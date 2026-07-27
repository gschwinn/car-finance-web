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
  aws_certificatemanager as acm,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_iam as iam,
  aws_logs as logs,
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_secretsmanager as secretsmanager,
  aws_ssm as ssm,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
} from "aws-cdk-lib";

const productionDomainName = 'outthedoor.stingrayengineering.com';
const oauthCallbackPath = '/api/oauthcb';
const logoutPath = '/api/logout';

// CAUTION local dev stuff also in api/src/routes/oauthcb.ts
const devServer = 'http://localhost:3000';
const devCallbackUrl = `${devServer}${oauthCallbackPath}/local`;
const devLogoutUrl = `${devServer}${logoutPath}`;

interface ApiStackProps extends StackProps {
  appConfigSecretArn: string;
  appConfigSecretName: string;
}

export class ApiStack extends Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { appConfigSecretArn, appConfigSecretName } = props;

    const stackVersion =
      process.env.STACK_VERSION ?? process.env.npm_package_version ?? "unknown";

    const enableLocalhostAuth = this.node.tryGetContext('localhostAuth') === "true";

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

    let otdCert;
    if (isProduction()) {
      const stingrayCertArn = ssm.StringParameter.valueForStringParameter(this, '/stingray/sites/stingrayCertARN');
      otdCert = acm.Certificate.fromCertificateArn(this, 'OutTheDoorCert', stingrayCertArn);
    }
    const domainNames = isProduction() ? [productionDomainName] : [];

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
      certificate: otdCert,
      domainNames,
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

    const callbackHost = isProduction() ? productionDomainName : distribution.distributionDomainName;
    const callbackUrls = [`https://${callbackHost}${oauthCallbackPath}`];
    const logoutUrls = [`https://${callbackHost}${logoutPath}`];
    if (enableLocalhostAuth) {
      callbackUrls.push(devCallbackUrl);
      logoutUrls.push(devLogoutUrl);
    }

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
        callbackUrls,
        logoutUrls,
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
        callbackUrl: SecretValue.unsafePlainText(callbackUrls[0]),
        authDomain: SecretValue.unsafePlainText(cognitoDomain),
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

    const dealsTable = new dynamodb.Table(this, 'DealsTable', {
      tableName: namespaceIt('deals'),
      partitionKey: { name: 'userId',  type: dynamodb.AttributeType.STRING },
      sortKey:      { name: 'dealKey', type: dynamodb.AttributeType.STRING },
      billingMode:  dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // ── IAM grants ───────────────────────────────────────────────────────────

    authConfigSecret.grantRead(taskRole);
    taskRole.addToPolicy(new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
      resources: [appConfigSecretArn],
    }));
    pendingStateTable.grantReadWriteData(taskRole);
    sessionTable.grantReadWriteData(taskRole);
    dealsTable.grantReadWriteData(taskRole);

    // ── Inject env vars into the Fargate container ───────────────────────────

    const container = service.taskDefinition.defaultContainer!;
    container.addEnvironment('AUTH_CONFIG_SECRET_NAME', authConfigSecret.secretName);
    container.addEnvironment('APP_CONFIG_SECRET_NAME', appConfigSecretName);
    container.addEnvironment('PENDING_STATE_TABLE', pendingStateTable.tableName);
    container.addEnvironment('SESSION_TABLE', sessionTable.tableName);
    container.addEnvironment('DEALS_TABLE', dealsTable.tableName);
    container.addEnvironment('LOG_LEVEL', 'debug');

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

const isProduction = () => process.env.STACK_PREFIX === "prod";

export const namespaceIt = (name: string, delim = "-") => {
  const prefix = process.env.STACK_PREFIX ?? "dev";
  return `${prefix}${delim}${name}`;
};
