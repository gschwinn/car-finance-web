import { randomUUID } from 'crypto'
import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb'
import { getCookie, jsonResponse, noContentResponse, parseBody } from '../http'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

async function getUserId(event: APIGatewayProxyEventV2): Promise<string | null> {
  const sessionId = getCookie(event, 'session_id')
  if (!sessionId) return null

  const result = await ddb.send(new GetCommand({
    TableName: process.env.SESSION_TABLE,
    Key: { sessionId },
  }))

  const session = result.Item
  if (!session || session.expiresAt < Math.floor(Date.now() / 1000)) return null
  return session.userId as string
}

export async function handleListDeals(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const userId = await getUserId(event)
  if (!userId) return jsonResponse(401, { error: 'Unauthorized' })

  const type = event.queryStringParameters?.type
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

  return jsonResponse(200, result.Items ?? [])
}

export async function handleCreateDeal(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const userId = await getUserId(event)
  if (!userId) return jsonResponse(401, { error: 'Unauthorized' })

  const body = parseBody<{ type?: string }>(event)
  if (!body?.type || (body.type !== 'lease' && body.type !== 'purchase')) {
    return jsonResponse(400, { error: 'Invalid deal type' })
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
  return jsonResponse(201, dealResponse)
}

export async function handleUpdateDeal(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const userId = await getUserId(event)
  if (!userId) return jsonResponse(401, { error: 'Unauthorized' })

  const dealKey = event.pathParameters?.dealKey
  const body = parseBody<Record<string, unknown>>(event)

  await ddb.send(new PutCommand({
    TableName: process.env.DEALS_TABLE,
    Item: { ...body, userId, dealKey },
    ConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }))

  return noContentResponse()
}

export async function handleDeleteDeal(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const userId = await getUserId(event)
  if (!userId) return jsonResponse(401, { error: 'Unauthorized' })

  const dealKey = event.pathParameters?.dealKey

  await ddb.send(new DeleteCommand({
    TableName: process.env.DEALS_TABLE,
    Key: { userId, dealKey },
    ConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }))

  return noContentResponse()
}
