import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolResultSchema, ListToolsResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { readdir } from 'fs/promises';
import path from "path";
import { fileURLToPath } from "url";

interface Tool {
    name: string;
    description?: string;
    inputSchema?: Record<string, any>;
    outputSchema?: Record<string, any>;
}

interface Config {
    allow?: string[];
    deny?: string[];
}

interface Server {
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
    igate?: Config;
    tools?: Tool[];
}

interface Servers {
    servers: Record<string, Server>;
}

let config: Servers = { servers: {} };
let server: McpServer | null = null;

export const getServer = (): McpServer => server!;

export const init = async (): Promise<void> => {
    config = await getAllServerTools(JSON.parse(process.env.SERVERS || '{}'));
    server = new McpServer({ name: "igate", version: "1.0.0" }, {
        instructions: [
            "IMPORTANT: Always call `search_tool` first for any MCP tool to retrieve its input schema and understand required parameters before using `execute_tool`.",
            "`igate` incrorporates the following servers and their tools:",
            JSON.stringify(
                Object.entries(config.servers).map(([serverName, server]) => ({
                    serverName,
                    tools: server.tools?.map(tool => ({
                        toolName: tool.name,
                        description: tool.description
                    }))
                }))
            ),
        ].join('\n')
    });

    await registerTools();
    await server.connect(new StdioServerTransport());
}

const registerTools = async (): Promise<void> => {
    try {
        const toolsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), './tools');
        const toolFiles = (await readdir(toolsDir)).filter((file: string) => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts'));
        for (const file of toolFiles) {
            await import(path.join(toolsDir, file));
        }
    } catch (error) {
        console.error('Error registering tools:', error);
        throw error;
    }
}

export const toolInfo = (serverName: string, toolName: string): Tool => {
    return getTool(config.servers[serverName], toolName);
}

export const executeTool = async (serverName: string, toolName: string, args: Record<string, any>): Promise<any> => {
    const tool = getTool(config.servers[serverName], toolName);
    const result = await getClient(config.servers[serverName], serverName, async (client) => client.callTool({ name: tool.name, arguments: args }, CallToolResultSchema));
    return result.structuredContent || result.content;
}

const getTool = (server: Server, toolName: string): Tool => {
    const tool = server.tools?.find(tool => tool.name === toolName);
    if (!tool) {
        throw new Error(`Tool ${toolName} not found.`);
    }
    if (server.igate?.allow && !server.igate.allow.includes(tool.name)) {
        throw new Error(`Tool ${toolName} is not allowed on this server.`);
    }
    if (server.igate?.deny && server.igate.deny.includes(tool.name)) {
        throw new Error(`Tool ${toolName} is denied on this server.`);
    }
    return tool;
}

const getAllServerTools = async (input: Servers): Promise<Servers> => {
    const results: Servers = { servers: {} };
    const mcpServers = Object.entries(input.servers).map(async ([name, config]) => {
        try {
            const tools = await getClient(config, name, async (client) => (await client.request({ method: "tools/list" }, ListToolsResultSchema)).tools);
            results.servers[name] = {
                ...config,
                tools: config.igate?.allow
                    ? tools.filter(tool => config.igate?.allow?.includes(tool.name))
                    : tools.filter(tool => !config.igate?.deny?.includes(tool.name)) || []
            };
        } catch (error) {
            console.error(`Error connecting to ${name}:`, error);
        }
    });
    await Promise.all(mcpServers);
    return results;
}

const getClient = async <T>(config: Server, serverName: string, callback: (client: Client) => Promise<T>): Promise<T> => {
    const transport = config.url
        ? new StreamableHTTPClientTransport(new URL(config.url))
        : new StdioClientTransport({
            command: config.command!,
            args: config.args || [],
            env: config.env || {}
        });

    const client = new Client({ name: serverName, version: "1.0.0" });
    try {
        await client.connect(transport);
        return await callback(client);
    } finally {
        await client.close();
    }
}
