import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import { serialize, type SerializeOptions } from 'cookie'

export function getCookie(event: APIGatewayProxyEventV2, name: string): string | undefined {
  for (const entry of event.cookies ?? []) {
    const eq = entry.indexOf('=')
    if (eq === -1) continue
    if (entry.slice(0, eq) === name) return entry.slice(eq + 1)
  }
  return undefined
}

export function setCookie(name: string, value: string, opts: SerializeOptions = {}): string {
  return serialize(name, value, opts)
}

export function clearCookie(name: string): string {
  return serialize(name, '', { maxAge: 0, path: '/' })
}

export function jsonResponse(
  statusCode: number,
  body: unknown,
  opts: { cookies?: string[] } = {},
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    cookies: opts.cookies,
    body: JSON.stringify(body),
  }
}

export function noContentResponse(opts: { cookies?: string[] } = {}): APIGatewayProxyStructuredResultV2 {
  return { statusCode: 204, cookies: opts.cookies }
}

export function redirectResponse(
  location: string,
  opts: { cookies?: string[] } = {},
): APIGatewayProxyStructuredResultV2 {
  return {
    statusCode: 302,
    headers: { location },
    cookies: opts.cookies,
  }
}

export function parseBody<T>(event: APIGatewayProxyEventV2): T | undefined {
  if (!event.body) return undefined
  const raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf-8') : event.body
  return JSON.parse(raw) as T
}
