import { getServer, toolInfo } from "src/server";
import { z } from "zod";

getServer().registerTool('search_tool', {
    title: 'Search Tool Information',
    description: 'Retrieves detailed information about a specific tool available in the MCP configuration',
    inputSchema: {
        serverName: z.string().describe('The name of the server where the tool is hosted. Must be taken from the instructions of this server'),
        toolName: z.string().describe('The name of the tool to retrieve information about. Must be taken from the instructions of this server'),
    },
    outputSchema: {
        inputSchema: z.record(z.any()).describe('The input schema of the tool'),
        outputSchema: z.record(z.any()).describe('The output schema of the tool'),
    }
}, async ({ serverName, toolName }: { serverName: string, toolName: string }) => {
    const { inputSchema, outputSchema } = toolInfo(serverName, toolName);
    return {
        content: [],
        structuredContent: {
            inputSchema: inputSchema,
            outputSchema: outputSchema
        }
    };
});
