import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const server = process.env.MCP_SERVER;
if (!server) {
	console.error('Error: MCP_SERVER environment variable is required');
	process.exit(1);
}

const token = process.env.MCP_TOKEN;
const verbose = true;

const createClient = async (server, token) => {
	console.log(`Connecting ENDPOINT_URL=${server}, using auth? ${!!token}`);
	const options = token ? {
		requestInit: {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	} : {};
	const transport = new StreamableHTTPClientTransport(new URL(server), options);
	const client = new Client({
		name: "node-client",
		version: "0.0.1"
	});
	await client.connect(transport);
	console.log('client connected');
	return client;
}

const listTools = async (client) => {
	const tools = await client.listTools();
	if (tools) {
		console.log('\n******* tools *******\n');
		tools.tools.map(t => {
			if (verbose) {
				console.log(`${t.name} : ${t.title} - ${t.description}`);
				console.log(`input schema:\n${JSON.stringify(t.inputSchema, null, 2)}`);
				console.log(`output schema:\n${JSON.stringify(t.outputSchema, null, 2)}`);
			} else {
				console.log(`${t.name} : ${t.title}`);
			}
		});
	}
}

const callTool = async (client, toolName, toolInput) => {
	const params = { name: toolName };
	if (toolInput !== undefined) {
		params.arguments = toolInput;
	}
	console.log(`\nCalling tool: ${toolName}`);
	const result = await client.callTool(params);
	console.log('\n******* result *******\n');
	console.log(JSON.stringify(result, null, 2));
}

const [,, toolName, toolInputJson] = process.argv;

try {
	const client = await createClient(server, token);
	if (toolName) {
		const toolInput = toolInputJson ? JSON.parse(toolInputJson) : undefined;
		await callTool(client, toolName, toolInput);
	} else {
		await listTools(client);
	}
	await client.close();
} catch (e) {
	console.error('error:', e);
	process.exit(1);
}
