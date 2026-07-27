import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ApiStack } from '../lib/api-stack';

describe('ApiStack', () => {
  let template: Template;

  beforeAll(() => {
    delete process.env.STACK_PREFIX;

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

  // The template also contains CDK-generated helper Lambdas (BucketDeployment's
  // handler, S3 auto-delete-objects handler) — filter to just the 4 API
  // functions via the LOG_LEVEL env var that only they set.
  const findApiFunctions = () => template.findResources('AWS::Lambda::Function', {
    Properties: { Environment: { Variables: Match.objectLike({ LOG_LEVEL: 'debug' }) } },
  });

  describe('Lambda functions', () => {
    test('creates 4 API Lambda functions', () => {
      expect(Object.keys(findApiFunctions())).toHaveLength(4);
    });

    test('all 4 API functions use the nodejs22.x runtime and arm64 architecture', () => {
      const functions = template.findResources('AWS::Lambda::Function', {
        Properties: {
          Runtime: 'nodejs22.x',
          Architectures: ['arm64'],
          Environment: { Variables: Match.objectLike({ LOG_LEVEL: 'debug' }) },
        },
      });
      expect(Object.keys(functions)).toHaveLength(4);
    });

    test('auth function has AuthConfig secret name and session/state table env vars', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            AUTH_CONFIG_SECRET_NAME: Match.anyValue(),
            PENDING_STATE_TABLE: Match.anyValue(),
            SESSION_TABLE: Match.anyValue(),
            NODE_ENV: 'production',
          }),
        },
      });
    });

    test('agent function only has APP_CONFIG_SECRET_NAME table-independent env', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            APP_CONFIG_SECRET_NAME: 'test/AppConfig',
          }),
        },
      });
    });
  });

  describe('IAM', () => {
    test('lambda functions trust the lambda service principal', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Principal: { Service: 'lambda.amazonaws.com' },
            }),
          ]),
        }),
      });
    });

    test('creates a separate IAM role per API Lambda function (scoped, not shared)', () => {
      const functions = findApiFunctions();
      const roleRefs = Object.values(functions).map((fn: any) => fn.Properties.Role['Fn::GetAtt'][0]);
      expect(new Set(roleRefs).size).toBe(4);
    });

    test('at least one policy grants secretsmanager:GetSecretValue', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['secretsmanager:GetSecretValue']),
              Effect: 'Allow',
            }),
          ]),
        }),
      });
    });
  });

  describe('HTTP API', () => {
    test('creates a single HTTP API', () => {
      template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
    });

    test('creates the expected number of routes', () => {
      // login, oauthcb, oauthcb/local, profile, logout, deals(GET+POST), deals/{dealKey}(PUT+DELETE), upload, agent
      template.resourceCountIs('AWS::ApiGatewayV2::Route', 11);
    });

    test('creates a route for GET /api/deals', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'GET /api/deals',
      });
    });

    test('creates a route for POST /api/agent', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'POST /api/agent',
      });
    });
  });

  describe('S3 + UI deployment', () => {
    test('creates a private S3 bucket for the UI', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: Match.objectLike({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
        }),
      });
    });

    test('creates a BucketDeployment custom resource for ui/dist', () => {
      template.resourceCountIs('Custom::CDKBucketDeployment', 1);
    });
  });

  describe('CloudFront', () => {
    test('distribution has a default behavior and an /api/* behavior', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          DefaultCacheBehavior: Match.anyValue(),
          CacheBehaviors: Match.arrayWith([
            Match.objectLike({ PathPattern: '/api/*' }),
          ]),
        }),
      });
    });

    test('distribution has SPA-friendly 403/404 error responses to index.html', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          CustomErrorResponses: Match.arrayWith([
            Match.objectLike({ ErrorCode: 403, ResponseCode: 200, ResponsePagePath: '/index.html' }),
            Match.objectLike({ ErrorCode: 404, ResponseCode: 200, ResponsePagePath: '/index.html' }),
          ]),
        }),
      });
    });
  });

  describe('DynamoDB', () => {
    test('creates 3 pay-per-request tables', () => {
      template.resourceCountIs('AWS::DynamoDB::Table', 3);
    });
  });

  describe('Outputs', () => {
    test('outputs CloudFrontUrl', () => {
      template.hasOutput('CloudFrontUrl', {});
    });

    test('outputs ApiUrl', () => {
      template.hasOutput('ApiUrl', {});
    });
  });
});
