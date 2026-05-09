import type { Request, Response } from 'express'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { getAuthConfig } from '../authConfig.js'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

export async function handleLogin(req: Request, res: Response): Promise<void> {
  const config = await getAuthConfig()
  const state = crypto.randomUUID()
  const ttl = Math.floor(Date.now() / 1000) + 600

  await ddb.send(new PutCommand({
    TableName: process.env.PENDING_STATE_TABLE,
    Item: { stateId: state, expiresAt: ttl },
  }))

  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600 * 1000,
  })

  const callbackUrl = process.env.CALLBACK_URL!
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: callbackUrl,
    state,
  })

  if (req.query.signup === 'true') {
    params.set('screen_hint', 'signup')
  }

  res.redirect(302, `https://${config.domain}/oauth2/authorize?${params}`)
}
