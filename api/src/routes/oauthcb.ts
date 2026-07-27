import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { getAuthConfig } from '../secrets'
import logger from '../logger'
import { getCookie, setCookie, clearCookie, jsonResponse, redirectResponse } from '../http'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

const localdevServer = 'http://localhost:3000'; // CAUTION:  this path is also in infra workspace

export const makeAuthUrlLocal = (callbackUrl: string): string => {
  const url = URL.parse(callbackUrl);
  return `${localdevServer}${url?.pathname}/local`;
}

export async function handleOauthCallback(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const query = event.queryStringParameters ?? {}
  const code = query.code
  const state = query.state
  const cookieState = getCookie(event, 'oauth_state')

  if (typeof code !== 'string' || typeof state !== 'string' || !cookieState || state !== cookieState) {
    return jsonResponse(400, { error: 'Invalid state parameter' })
  }

  const stateResult = await ddb.send(new GetCommand({
    TableName: process.env.PENDING_STATE_TABLE,
    Key: { stateId: state },
  }))

  if (!stateResult.Item || stateResult.Item.expiresAt < Math.floor(Date.now() / 1000)) {
    return jsonResponse(400, { error: 'State not found or expired' })
  }

  await ddb.send(new DeleteCommand({
    TableName: process.env.PENDING_STATE_TABLE,
    Key: { stateId: state },
  }))

  const config = await getAuthConfig()
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')

  const callbackUrl = event.rawPath.endsWith('local') ? makeAuthUrlLocal(config.callbackUrl) : config.callbackUrl;

  const tokenResp = await fetch(`https://${config.authDomain}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl,
    }).toString(),
  })

  if (!tokenResp.ok) {
    const err = await tokenResp.json();
    logger.error('error getting oauth tokens', { err });
    return jsonResponse(502, { error: 'Token exchange failed' })
  }

  const tokens = await tokenResp.json() as {
    id_token: string
    access_token: string
    refresh_token: string
    expires_in: number
  }

  const payload = JSON.parse(
    Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString()
  ) as { sub: string; email: string }

  const sessionId = crypto.randomUUID()
  const expiresAt = Math.floor(Date.now() / 1000) + 86400

  await ddb.send(new PutCommand({
    TableName: process.env.SESSION_TABLE,
    Item: {
      sessionId,
      userId: payload.sub,
      email: payload.email,
      accessToken: tokens.access_token,
      idToken: tokens.id_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    },
  }))

  const sessionCookie = setCookie('session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400,
  })

  return redirectResponse('/', { cookies: [clearCookie('oauth_state'), sessionCookie] })
}
