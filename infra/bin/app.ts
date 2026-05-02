#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

const stackPrefix = process.env.STACK_PREFIX ?? 'dev';

new ApiStack(app, `${stackPrefix}CarFinanceStack`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
});
