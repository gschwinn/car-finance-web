import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { getAuthConfig } from '../secrets'
import logger from '../logger'
import { setCookie, redirectResponse } from '../http'
import { makeAuthUrlLocal } from './oauthcb'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

export async function handleLogin(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const config = await getAuthConfig()
  const state = crypto.randomUUID()
  const ttl = Math.floor(Date.now() / 1000) + 600

  await ddb.send(new PutCommand({
    TableName: process.env.PENDING_STATE_TABLE,
    Item: { stateId: state, expiresAt: ttl },
  }))

  const oauthStateCookie = setCookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
  })

  const query = event.queryStringParameters ?? {}
  const callbackUrl = query.localdev === 'true' ? makeAuthUrlLocal(config.callbackUrl) : config.callbackUrl

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: callbackUrl,
    state,
  })

  if (query.signup === 'true') {
    params.set('screen_hint', 'signup')
  }

  const authUrl = `https://${config.authDomain}/oauth2/authorize?${params}`
  logger.debug('redirecting to auth url', { authUrl })
  return redirectResponse(authUrl, { cookies: [oauthStateCookie] })
}
