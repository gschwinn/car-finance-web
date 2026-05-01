import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import type { Request, Response } from 'express'

function createServer() {
  const server = new McpServer({
    name: 'carfinance-api',
    version: '1.0.0',
  })

  // Register tools here
  server.registerTool('echo', { title: 'Echo Tool', description: 'This tool responds by echoing the input args' }, (args) => {
    return {
      content: [{ type: 'text', text: JSON.stringify(args) }],
    }
  })

  return server
}

export async function handleMcpRequest(req: Request, res: Response) {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  })
  const server = createServer()
  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
}
