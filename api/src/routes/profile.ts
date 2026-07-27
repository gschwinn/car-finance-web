import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { getCookie, jsonResponse } from '../http'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

export async function handleProfile(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const sessionId = getCookie(event, 'session_id')

  if (!sessionId) {
    return jsonResponse(200, { authenticated: false })
  }

  const result = await ddb.send(new GetCommand({
    TableName: process.env.SESSION_TABLE,
    Key: { sessionId },
  }))

  const session = result.Item
  if (!session || session.expiresAt < Math.floor(Date.now() / 1000)) {
    return jsonResponse(200, { authenticated: false })
  }

  return jsonResponse(200, { authenticated: true, id: session.userId, email: session.email })
}
