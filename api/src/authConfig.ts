import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

type AuthConfig = {
  userPoolId: string
  clientId: string
  clientSecret: string
  domain: string
}

const client = new SecretsManagerClient({})
let cached: AuthConfig | null = null

export async function getAuthConfig(): Promise<AuthConfig> {
  if (cached) return cached
  const secretName = process.env.AUTH_CONFIG_SECRET_NAME
  if (!secretName) throw new Error('AUTH_CONFIG_SECRET_NAME env var not set')
  const resp = await client.send(new GetSecretValueCommand({ SecretId: secretName }))
  cached = JSON.parse(resp.SecretString!) as AuthConfig
  return cached
}
