import { executeTool, getServer } from "src/server";
import { z } from "zod";

getServer().registerTool('execute_tool', {
    title: 'Execute Tool',
    description: 'Executes a specific tool available in the MCP configuration',
    inputSchema: {
        serverName: z.string().describe('The name of the server where the tool is hosted. Must be taken from the instructions of this server'),
        toolName: z.string().describe('The name of the tool to execute. Must be taken from the instructions of this server'),
        args: z.record(z.any()).describe('The arguments to pass to the tool. Use "search_tool" to find the required arguments first'),
    },
    outputSchema: {
        result: z.record(z.any()).describe('The result of the tool execution'),
    }
}, async ({ serverName, toolName, args }: { serverName: string, toolName: string, args: Record<string, any> }) => {
    return {
        content: [],
        structuredContent: {
            result: (await executeTool(serverName, toolName, args)) || {},
        }
    };
});
