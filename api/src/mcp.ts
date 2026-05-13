import type { Request, Response } from "express";
import logger from "./logger";

export async function handleMcpRequest(req: Request, res: Response) {
  const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
  const { StreamableHTTPServerTransport } = await import("@modelcontextprotocol/sdk/server/streamableHttp.js");
  const { z } = await import("zod");

  const server = new McpServer({
    name: "carfinance-api",
    version: "1.0.0",
  });

  server.registerTool(
    "echo",
    {
      title: "Echo Tool",
      description: "This tool responds by echoing the input args",
      inputSchema: {
        topic: z.string().optional(),
        subtopic: z.string().optional(),
      }
    },
    (args) => {
      logger.info('echo tool called', { args });
      return {
        content: [{ type: "text", text: JSON.stringify(args) }],
      };
    },
  );

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
