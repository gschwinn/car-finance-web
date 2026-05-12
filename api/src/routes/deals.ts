import { randomUUID } from 'crypto'
import type { Request, Response } from 'express'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

async function getUserId(req: Request): Promise<string | null> {
  const sessionId: string | undefined = req.cookies?.session_id
  if (!sessionId) return null

  const result = await ddb.send(new GetCommand({
    TableName: process.env.SESSION_TABLE,
    Key: { sessionId },
  }))

  const session = result.Item
  if (!session || session.expiresAt < Math.floor(Date.now() / 1000)) return null
  return session.userId as string
}

export async function handleListDeals(req: Request, res: Response): Promise<void> {
  const userId = await getUserId(req)
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

  const type = req.query.type as string | undefined
  const keyCondition = type
    ? 'userId = :uid AND begins_with(dealKey, :prefix)'
    : 'userId = :uid'
  const expressionValues: Record<string, string> = { ':uid': userId }
  if (type) expressionValues[':prefix'] = `${type}_`

  const result = await ddb.send(new QueryCommand({
    TableName: process.env.DEALS_TABLE,
    KeyConditionExpression: keyCondition,
    ExpressionAttributeValues: expressionValues,
  }))

  res.json(result.Items ?? [])
}

export async function handleCreateDeal(req: Request, res: Response): Promise<void> {
  const userId = await getUserId(req)
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

  const body = req.body
  if (!body?.type || (body.type !== 'lease' && body.type !== 'purchase')) {
    res.status(400).json({ error: 'Invalid deal type' }); return
  }

  const id = randomUUID()
  const createdAt = new Date().toISOString()
  const dealKey = `${body.type}_${id}`
  const deal = { ...body, id, createdAt, userId, dealKey }

  await ddb.send(new PutCommand({
    TableName: process.env.DEALS_TABLE,
    Item: deal,
  }))

  const { userId: _uid, dealKey: _dk, ...dealResponse } = deal
  res.status(201).json(dealResponse)
}

export async function handleUpdateDeal(req: Request, res: Response): Promise<void> {
  const userId = await getUserId(req)
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

  const { dealKey } = req.params
  const body = req.body

  await ddb.send(new PutCommand({
    TableName: process.env.DEALS_TABLE,
    Item: { ...body, userId, dealKey },
    ConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }))

  res.status(204).send()
}

export async function handleDeleteDeal(req: Request, res: Response): Promise<void> {
  const userId = await getUserId(req)
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return }

  const { dealKey } = req.params

  await ddb.send(new DeleteCommand({
    TableName: process.env.DEALS_TABLE,
    Key: { userId, dealKey },
    ConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }))

  res.status(204).send()
}
