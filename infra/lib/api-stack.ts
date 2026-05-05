import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import { DockerImageAsset } from "aws-cdk-lib/aws-ecr-assets";
import { Construct } from "constructs";
import * as path from "path";
import os from 'os';

import {
  CfnOutput,
  Stack,
  StackProps,
  aws_ec2 as ec2,
  aws_ecs as ecs,
  aws_ecs_patterns as ecs_patterns,
  aws_ecr_assets as ecr_assets,
  aws_iam as iam,
  aws_logs as logs,
  RemovalPolicy,
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

    // const ddbStmt = new iam.PolicyStatement({
    //   actions: [
    //     "dynamodb:Query",
    //     "dynamodb:GetItem",
    //     "dynamodb:PutItem",
    //     "dynamodb:UpdateItem",
    //     "dynamodb:DeleteItem",
    //   ],
    //   resources: ["table arn 1"],
    // });

    // Create VPC with only public subnets
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

    // Build context is the repo root; Dockerfile lives at api/Dockerfile
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
    // taskRole.addToPolicy(ddbStmt);

    service.targetGroup.configureHealthCheck({
      path: "/health",
    });

    new CfnOutput(this, "LoadBalancerDns", {
      value: service.loadBalancer.loadBalancerDnsName,
      description: "Public DNS of the Application Load Balancer",
    });
  }
}

const namespaceIt = (name: string, delim = "-") => {
  const prefix = process.env.STACK_PREFIX ?? "dev";
  return `${prefix}${delim}${name}`;
};
