import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ApiStack } from '../lib/api-stack';

describe('ApiStack', () => {
  let template: Template;

  beforeAll(() => {
    delete process.env.STACK_VERSION;
    delete process.env.STACK_PREFIX;
    delete process.env.npm_package_version;

    const app = new cdk.App();
    const stack = new ApiStack(app, 'TestApiStack', { 
      appConfigSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test/AppConfig-AAAAAA',
      appConfigSecretName: 'test/AppConfig',
    });
    template = Template.fromStack(stack);
  });

  describe('CloudWatch Log Group', () => {
    test('creates log group with correct name and 30-day retention', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/lambda/dev-shared-logs',
        RetentionInDays: 30,
      });
    });

    test('log group has DESTROY removal policy', () => {
      template.hasResource('AWS::Logs::LogGroup', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('IAM', () => {
    test('task role trusts ecs-tasks service principal', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Principal: { Service: 'ecs-tasks.amazonaws.com' },
            }),
          ]),
        }),
      });
    });

    test('task role has AmazonECSTaskExecutionRolePolicy managed policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              Match.arrayWith([
                Match.stringLikeRegexp('AmazonECSTaskExecutionRolePolicy'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('task role policy grants CloudWatch log actions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ]),
              Effect: 'Allow',
            }),
          ]),
        }),
      });
    });
  });

  describe('Networking', () => {
    test('creates a single VPC', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('creates 4 subnets (2 public + 2 private across 2 AZs)', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });
  });

  describe('ECS', () => {
    test('creates a single ECS cluster', () => {
      template.resourceCountIs('AWS::ECS::Cluster', 1);
    });

    test('task definition specifies 256 cpu and 512 memory', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Cpu: '256',
        Memory: '512',
      });
    });

    test('container exposes port 3000 with correct environment variables', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            PortMappings: Match.arrayWith([
              Match.objectLike({ ContainerPort: 3000, Protocol: 'tcp' }),
            ]),
            Environment: Match.arrayWith([
              { Name: 'NODE_ENV', Value: 'production' },
              { Name: 'STACK_VERSION', Value: 'unknown' },
            ]),
          }),
        ]),
      });
    });

    test('fargate service runs a single desired task', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        DesiredCount: 1,
        LaunchType: 'FARGATE',
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('creates an internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('target group health check uses /health path', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        HealthCheckPath: '/health',
        TargetType: 'ip',
      });
    });

    test('ALB listener accepts traffic on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('STACK_VERSION env var', () => {
    test('passes explicit STACK_VERSION to container when set', () => {
      delete process.env.STACK_PREFIX;
      process.env.STACK_VERSION = '2.0.0-test';

      const app = new cdk.App();
      const stack = new ApiStack(app, 'VersionedTestStack', { 
        appConfigSecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test/AppConfig-AAAAAA',
        appConfigSecretName: 'test/AppConfig',
      });
      const t = Template.fromStack(stack);

      t.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Environment: Match.arrayWith([
              { Name: 'STACK_VERSION', Value: '2.0.0-test' },
            ]),
          }),
        ]),
      });

      delete process.env.STACK_VERSION;
    });
  });

  describe('Outputs', () => {
    test('outputs LoadBalancerDns', () => {
      template.hasOutput('LoadBalancerDns', {
        Description: 'Public DNS of the Application Load Balancer',
      });
    });
  });
});
