import type { Request, Response } from 'express'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

export async function handleProfile(_req: Request, res: Response): Promise<void> {
  const sessionId: string | undefined = _req.cookies?.session_id

  if (!sessionId) {
    res.json({ authenticated: false })
    return
  }

  const result = await ddb.send(new GetCommand({
    TableName: process.env.SESSION_TABLE,
    Key: { sessionId },
  }))

  const session = result.Item
  if (!session || session.expiresAt < Math.floor(Date.now() / 1000)) {
    res.json({ authenticated: false })
    return
  }

  res.json({ authenticated: true, id: session.userId, email: session.email })
}
