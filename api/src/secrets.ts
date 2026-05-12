import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({});

export type AuthConfig = {
  userPoolId: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
  authDomain: string;
};

let authConfigCache: AuthConfig | null = null;

export async function getAuthConfig(): Promise<AuthConfig> {
  if (authConfigCache) return authConfigCache;

  const secretName = process.env.AUTH_CONFIG_SECRET_NAME;
  if (!secretName) throw new Error("AUTH_CONFIG_SECRET_NAME env var not set");

  const resp = await client.send(
    new GetSecretValueCommand({ SecretId: secretName }),
  );
  authConfigCache = JSON.parse(resp.SecretString!) as AuthConfig;
  return authConfigCache;
}

export type AppConfig = {
  openaiApiKey: string;
  openaiModel: string;
};

let appConfigCache: AppConfig | null = null;

export async function getAppConfig(): Promise<AppConfig> {
  if (appConfigCache) return appConfigCache;

  const secretName = process.env.APP_CONFIG_SECRET_NAME;
  if (!secretName) throw new Error("APP_CONFIG_SECRET_NAME env var not set");

  const resp = await client.send(
    new GetSecretValueCommand({ SecretId: secretName }),
  );
  appConfigCache = JSON.parse(resp.SecretString!) as AppConfig;
  return appConfigCache;
}
