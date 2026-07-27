import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { handleUploadDeal } from '../routes/upload'
import { withLogging } from '../middleware'

export const handler: APIGatewayProxyHandlerV2 = withLogging('upload', handleUploadDeal)
