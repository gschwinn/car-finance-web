import * as path from "path";

import {
  CfnOutput,
  Stack,
  StackProps,
  SecretValue,
  RemovalPolicy,
  Duration,
  aws_certificatemanager as acm,
  aws_lambda as lambda,
  aws_lambda_nodejs as lambdaNodejs,
  aws_apigatewayv2 as apigatewayv2,
  aws_iam as iam,
  aws_logs as logs,
  aws_cognito as cognito,
  aws_dynamodb as dynamodb,
  aws_secretsmanager as secretsmanager,
  aws_ssm as ssm,
  aws_s3 as s3,
  aws_s3_deployment as s3deploy,
  aws_cloudfront as cloudfront,
  aws_cloudfront_origins as origins,
} from "aws-cdk-lib";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Construct } from "constructs";

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

    const enableLocalhostAuth = this.node.tryGetContext('localhostAuth') === "true";

    const logGroup = new logs.LogGroup(this, "SharedLambdaLogGroup", {
      logGroupName: `/aws/lambda/${namespaceIt("shared-logs")}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: RemovalPolicy.DESTROY,
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

    // ── S3 + CloudFront (UI) ────────────────────────────────────────────────

    const uiBucket = new s3.Bucket(this, 'UiBucket', {
      bucketName: namespaceIt('car-finance-ui').toLowerCase(),
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    let otdCert;
    if (isProduction()) {
      const stingrayCertArn = ssm.StringParameter.valueForStringParameter(this, '/stingray/sites/stingrayCertARN');
      otdCert = acm.Certificate.fromCertificateArn(this, 'OutTheDoorCert', stingrayCertArn);
    }
    const domainNames = isProduction() ? [productionDomainName] : [];

    // Placeholder origin for /api/* — swapped for the real HTTP API origin once httpApi exists below.
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(uiBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      certificate: otdCert,
      domainNames,
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 200, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' },
      ],
    });

    new s3deploy.BucketDeployment(this, 'UiDeployment', {
      sources: [s3deploy.Source.asset(path.join(__dirname, "../../ui/dist"))],
      destinationBucket: uiBucket,
      distribution,
      distributionPaths: ['/*'],
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

    // ── Lambda functions ─────────────────────────────────────────────────────

    const apiTsconfigPath = path.join(__dirname, "../../api/tsconfig.json");
    const commonEnv = { LOG_LEVEL: 'debug', NODE_ENV: 'production' };

    const makeApiFunction = (id: string, entryFile: string, environment: Record<string, string>) =>
      new lambdaNodejs.NodejsFunction(this, id, {
        entry: path.join(__dirname, `../../api/src/handlers/${entryFile}`),
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_22_X,
        architecture: lambda.Architecture.ARM_64,
        memorySize: 512,
        timeout: Duration.seconds(28),
        logGroup,
        environment: { ...commonEnv, ...environment },
        bundling: {
          tsconfig: apiTsconfigPath,
        },
      });

    const authFunction = makeApiFunction('AuthFunction', 'auth.ts', {
      AUTH_CONFIG_SECRET_NAME: authConfigSecret.secretName,
      PENDING_STATE_TABLE: pendingStateTable.tableName,
      SESSION_TABLE: sessionTable.tableName,
    });

    const dealsFunction = makeApiFunction('DealsFunction', 'deals.ts', {
      SESSION_TABLE: sessionTable.tableName,
      DEALS_TABLE: dealsTable.tableName,
    });

    const uploadFunction = makeApiFunction('UploadFunction', 'upload.ts', {
      SESSION_TABLE: sessionTable.tableName,
      DEALS_TABLE: dealsTable.tableName,
      APP_CONFIG_SECRET_NAME: appConfigSecretName,
    });

    const agentFunction = makeApiFunction('AgentFunction', 'agent.ts', {
      APP_CONFIG_SECRET_NAME: appConfigSecretName,
    });

    const appConfigSecretReadPolicy = new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue', 'secretsmanager:DescribeSecret'],
      resources: [appConfigSecretArn],
    });

    authConfigSecret.grantRead(authFunction);
    pendingStateTable.grantReadWriteData(authFunction);
    sessionTable.grantReadWriteData(authFunction);

    sessionTable.grantReadData(dealsFunction);
    dealsTable.grantReadWriteData(dealsFunction);

    sessionTable.grantReadData(uploadFunction);
    dealsTable.grantReadWriteData(uploadFunction);
    uploadFunction.addToRolePolicy(appConfigSecretReadPolicy);

    agentFunction.addToRolePolicy(appConfigSecretReadPolicy);

    // ── API Gateway ───────────────────────────────────────────────────────────

    const httpApi = new apigatewayv2.HttpApi(this, 'HttpApi');

    const authIntegration = new HttpLambdaIntegration('AuthIntegration', authFunction);
    const dealsIntegration = new HttpLambdaIntegration('DealsIntegration', dealsFunction);
    const uploadIntegration = new HttpLambdaIntegration('UploadIntegration', uploadFunction);
    const agentIntegration = new HttpLambdaIntegration('AgentIntegration', agentFunction);

    httpApi.addRoutes({ path: '/api/login', methods: [apigatewayv2.HttpMethod.GET], integration: authIntegration });
    httpApi.addRoutes({ path: '/api/oauthcb', methods: [apigatewayv2.HttpMethod.GET], integration: authIntegration });
    httpApi.addRoutes({ path: '/api/oauthcb/local', methods: [apigatewayv2.HttpMethod.GET], integration: authIntegration });
    httpApi.addRoutes({ path: '/api/profile', methods: [apigatewayv2.HttpMethod.GET], integration: authIntegration });
    httpApi.addRoutes({ path: '/api/logout', methods: [apigatewayv2.HttpMethod.GET], integration: authIntegration });

    httpApi.addRoutes({ path: '/api/deals', methods: [apigatewayv2.HttpMethod.GET, apigatewayv2.HttpMethod.POST], integration: dealsIntegration });
    httpApi.addRoutes({ path: '/api/deals/{dealKey}', methods: [apigatewayv2.HttpMethod.PUT, apigatewayv2.HttpMethod.DELETE], integration: dealsIntegration });

    httpApi.addRoutes({ path: '/api/upload', methods: [apigatewayv2.HttpMethod.POST], integration: uploadIntegration });
    httpApi.addRoutes({ path: '/api/agent', methods: [apigatewayv2.HttpMethod.POST], integration: agentIntegration });

    // ── CloudFront /api/* behavior ───────────────────────────────────────────

    const apiDomain = `${httpApi.httpApiId}.execute-api.${this.region}.amazonaws.com`;

    distribution.addBehavior('/api/*', new origins.HttpOrigin(apiDomain, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
    }), {
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
      cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
    });

    new CfnOutput(this, "CloudFrontUrl", {
      value: `https://${distribution.distributionDomainName}`,
      description: "CloudFront HTTPS URL (use this as the app entry point)",
    });

    new CfnOutput(this, "ApiUrl", {
      value: httpApi.apiEndpoint,
      description: "HTTP API default endpoint (for debugging)",
    });
  }
}

const isProduction = () => process.env.STACK_PREFIX === "prod";

export const namespaceIt = (name: string, delim = "-") => {
  const prefix = process.env.STACK_PREFIX ?? "dev";
  return `${prefix}${delim}${name}`;
};
