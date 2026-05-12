import type { Request, Response } from 'express'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, DeleteCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { getAuthConfig } from '../secrets'
import logger from '../logger'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

const localdevServer = 'http://localhost:3000'; // CAUTION:  this path is also in infra workspace

export const makeAuthUrlLocal = (callbackUrl: string): string => {
  const url = URL.parse(callbackUrl);
  return `${localdevServer}${url?.pathname}/local`;
}

export async function handleOauthCallback(req: Request, res: Response): Promise<void> {
  const { code, state } = req.query
  const cookieState: string | undefined = req.cookies?.oauth_state

  if (typeof code !== 'string' || typeof state !== 'string' || !cookieState || state !== cookieState) {
    res.status(400).json({ error: 'Invalid state parameter' })
    return
  }

  const stateResult = await ddb.send(new GetCommand({
    TableName: process.env.PENDING_STATE_TABLE,
    Key: { stateId: state },
  }))

  if (!stateResult.Item || stateResult.Item.expiresAt < Math.floor(Date.now() / 1000)) {
    res.status(400).json({ error: 'State not found or expired' })
    return
  }

  await ddb.send(new DeleteCommand({
    TableName: process.env.PENDING_STATE_TABLE,
    Key: { stateId: state },
  }))

  const config = await getAuthConfig()
  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')

  const callbackUrl = (req.path.endsWith('local')) ? makeAuthUrlLocal(config.callbackUrl) : config.callbackUrl;

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
    res.status(502).json({ error: 'Token exchange failed' })
    return
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

  res.clearCookie('oauth_state')
  res.cookie('session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400 * 1000,
  })

  res.redirect(302, '/')
}
