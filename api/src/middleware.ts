import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import logger from './logger'

type EventHandler = (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>

export function withLogging(routeName: string, handler: EventHandler): EventHandler {
  return async (event) => {
    const requestMeta = {
      path: event.rawPath,
      queryStringParameters: event.queryStringParameters,
      pathParameters: event.pathParameters,
    }

    logger.info(`${routeName} request received`, requestMeta)
    const start = Date.now()

    const result = await handler(event)

    logger.info(`${routeName} request completed`, { ...requestMeta, durationMs: Date.now() - start })
    return result
  }
}
