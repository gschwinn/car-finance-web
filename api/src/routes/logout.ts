import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { getCookie, clearCookie, redirectResponse } from '../http'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

export async function handleLogout(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyStructuredResultV2> {
  const sessionId = getCookie(event, 'session_id')

  if (sessionId) {
    await ddb.send(new DeleteCommand({
      TableName: process.env.SESSION_TABLE,
      Key: { sessionId },
    }))
  }

  return redirectResponse('/', { cookies: [clearCookie('session_id')] })
}
