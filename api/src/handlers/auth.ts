import type { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { handleLogin } from '../routes/login'
import { handleOauthCallback } from '../routes/oauthcb'
import { handleProfile } from '../routes/profile'
import { handleLogout } from '../routes/logout'
import { jsonResponse } from '../http'
import { withLogging } from '../middleware'

const route = async (event: APIGatewayProxyEventV2) => {
  if (event.rawPath.startsWith('/api/oauthcb')) return handleOauthCallback(event)
  if (event.rawPath === '/api/login') return handleLogin(event)
  if (event.rawPath === '/api/profile') return handleProfile(event)
  if (event.rawPath === '/api/logout') return handleLogout(event)
  return jsonResponse(404, { error: 'Not found' })
}

export const handler: APIGatewayProxyHandlerV2 = withLogging('auth', route)
