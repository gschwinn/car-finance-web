import {
  Stack,
  StackProps,
  SecretValue,
  aws_secretsmanager as secretsmanager,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { namespaceIt } from "./api-stack";

export class SecretsStack extends Stack {
  public readonly appConfigSecretArn: string;
  public readonly appConfigSecretName: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const appConfigSecret = new secretsmanager.Secret(this, 'AppConfigSecret', {
      secretName: namespaceIt('AppConfig', '/'),
      secretObjectValue: {
        openaiApiKey: SecretValue.unsafePlainText(process.env.OPENAI_API_KEY ?? 'SET ME'),
        openaiModel: SecretValue.unsafePlainText('gpt-4o'),
      },
    });

    this.appConfigSecretArn = appConfigSecret.secretArn;
    this.appConfigSecretName = appConfigSecret.secretName;
  }
}