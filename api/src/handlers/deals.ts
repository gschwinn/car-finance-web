import type { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { handleListDeals, handleCreateDeal, handleUpdateDeal, handleDeleteDeal } from '../routes/deals'
import { jsonResponse } from '../http'
import { withLogging } from '../middleware'

const route = async (event: APIGatewayProxyEventV2) => {
  switch (event.requestContext.http.method) {
    case 'GET': return handleListDeals(event)
    case 'POST': return handleCreateDeal(event)
    case 'PUT': return handleUpdateDeal(event)
    case 'DELETE': return handleDeleteDeal(event)
    default: return jsonResponse(404, { error: 'Not found' })
  }
}

export const handler: APIGatewayProxyHandlerV2 = withLogging('deals', route)
