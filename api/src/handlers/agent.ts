import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { handleAgentRequest } from '../agent'
import { withLogging } from '../middleware'

export const handler: APIGatewayProxyHandlerV2 = withLogging('agent', handleAgentRequest)
