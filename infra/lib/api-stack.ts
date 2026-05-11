import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import { Construct } from "constructs";
import * as path from "path";
import os from 'os';

import {
  CfnOutput,
  Stack,
  StackProps,
  SecretValue,
  RemovalPolicy,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_iam as iam,
  aws_logs as logs,
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_secretsmanager as secretsmanager,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
} from "aws-cdk-lib";

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const stackVersion =
      process.env.STACK_VERSION ?? process.env.npm_package_version ?? "unknown";

    const logGroup = new logs.LogGroup(this, "SharedLambdaLogGroup", {
      logGroupName: `/aws/lambda/${namespaceIt("shared-logs")}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const logStmt = new iam.PolicyStatement({
      actions: [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
      ],
      resources: [logGroup.logGroupArn, `${logGroup.logGroupArn}:*`],
    });

    const vpc = new ec2.Vpc(this, 'CarFinanceVpc', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 0,
    });
    const cluster = new ecs.Cluster(this, 'CarFinanceCluster', { vpc });

    const taskRole = new iam.Role(this, 'CarFinanceTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy',
        ),
      ],
    });

    const image = new DockerImageAsset(this, "ApiImage", {
      directory: path.join(__dirname, "../../"),
      file: "api/Dockerfile",
    });

    const service = new ecsPatterns.ApplicationLoadBalancedFargateService(
      this,
      "ApiService",
      {
        cluster,
        cpu: 256,
        desiredCount: 1,
        memoryLimitMiB: 512,
        runtimePlatform: {
          cpuArchitecture:
            os.platform() === 'darwin'
              ? ecs.CpuArchitecture.ARM64
              : ecs.CpuArchitecture.X86_64,
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        },
        taskImageOptions: {
          image: ecs.ContainerImage.fromDockerImageAsset(image),
          containerPort: 3000,
          environment: {
            NODE_ENV: "production",
            STACK_VERSION: stackVersion,
          },
          enableLogging: true,
          logDriver: ecs.LogDrivers.awsLogs({
            streamPrefix: namespaceIt('fargate-logs'),
            logGroup: logGroup,
          }),
          taskRole,
        },
        publicLoadBalancer: true,
        assignPublicIp: true,
      },
    );

    taskRole.addToPolicy(logStmt);

    service.targetGroup.configureHealthCheck({
      path: "/health",
    });

    // ── CloudFront ───────────────────────────────────────────────────────────

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.LoadBalancerV2Origin(service.loadBalancer, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      },
    });

    // ── Cognito ──────────────────────────────────────────────────────────────

    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: namespaceIt('user-pool'),
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userPoolDomain = userPool.addDomain('UserPoolDomain', {
      cognitoDomain: { domainPrefix: namespaceIt('car-finance') },
    });

    const callbackUrl = `https://${distribution.distributionDomainName}/api/oauthcb`;

    const appClient = userPool.addClient('WebClient', {
      generateSecret: true,
      preventUserExistenceErrors: true,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [callbackUrl],
        logoutUrls: [`https://${distribution.distributionDomainName}/api/logout`],
      },
    });

    const cognitoDomain = `${userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`;

    // ── Secrets Manager ──────────────────────────────────────────────────────

    const authConfigSecret = new secretsmanager.Secret(this, 'AuthConfigSecret', {
      secretName: namespaceIt('AuthConfig', '/'),
      secretObjectValue: {
        userPoolId: SecretValue.unsafePlainText(userPool.userPoolId),
        clientId: SecretValue.unsafePlainText(appClient.userPoolClientId),
        clientSecret: appClient.userPoolClientSecret,
        domain: SecretValue.unsafePlainText(cognitoDomain),
      },
    });

    // ── DynamoDB tables ──────────────────────────────────────────────────────

    const pendingStateTable = new dynamodb.Table(this, 'PendingOAuthStateTable', {
      tableName: namespaceIt('pending-oauth-state'),
      partitionKey: { name: 'stateId', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'expiresAt',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const sessionTable = new dynamodb.Table(this, 'UserSessionsTable', {
      tableName: namespaceIt('user-sessions'),
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'expiresAt',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // ── IAM grants ───────────────────────────────────────────────────────────

    authConfigSecret.grantRead(taskRole);
    pendingStateTable.grantReadWriteData(taskRole);
    sessionTable.grantReadWriteData(taskRole);

    // ── Inject env vars into the Fargate container ───────────────────────────

    const container = service.taskDefinition.defaultContainer!;
    container.addEnvironment('AUTH_CONFIG_SECRET_NAME', authConfigSecret.secretName);
    container.addEnvironment('PENDING_STATE_TABLE', pendingStateTable.tableName);
    container.addEnvironment('SESSION_TABLE', sessionTable.tableName);
    container.addEnvironment('CALLBACK_URL', callbackUrl);

    new CfnOutput(this, "LoadBalancerDns", {
      value: service.loadBalancer.loadBalancerDnsName,
      description: "Public DNS of the Application Load Balancer",
    });

    new CfnOutput(this, "CloudFrontUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "CloudFront HTTPS URL (use this as the app entry point)",
    });
  }
}

const namespaceIt = (name: string, delim = "-") => {
  const prefix = process.env.STACK_PREFIX ?? "dev";
  return `${prefix}${delim}${name}`;
};
