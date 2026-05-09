import type { Request, Response } from 'express'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

export async function handleLogout(req: Request, res: Response): Promise<void> {
  const sessionId: string | undefined = req.cookies?.session_id

  if (sessionId) {
    await ddb.send(new DeleteCommand({
      TableName: process.env.SESSION_TABLE,
      Key: { sessionId },
    }))
  }

  res.clearCookie('session_id')
  res.redirect(302, '/')
}
