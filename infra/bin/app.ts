#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ApiStack } from '../lib/api-stack';
import { SecretsStack } from '../lib/secrets-stack';

const app = new cdk.App();

const stackPrefix = process.env.STACK_PREFIX ?? 'dev';

const secretsStack = new SecretsStack(app, `${stackPrefix}CarFinanceSecrets`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
});

const appStack = new ApiStack(app, `${stackPrefix}CarFinanceStack`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
  appConfigSecretArn: secretsStack.appConfigSecretArn,
  appConfigSecretName: secretsStack.appConfigSecretName,
});

appStack.addStackDependency(secretsStack);