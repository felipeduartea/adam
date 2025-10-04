import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { githubMCP } from "../mcps/github-mcp-client";

export const githubMCPTool = createTool({
  id: "github-mcp-call",
  description: "Call a GitHub MCP tool by name with JSON parameters",
  inputSchema: z.object({
    tool: z.string().describe("Fully qualified MCP tool name (e.g. github.search)"),
    params: z.record(z.any()).default({}).describe("Arguments for the MCP tool"),
  }),
  outputSchema: z.unknown(),
  execute: async ({ context }) => {
    const toolName = (context as any).tool as string;
    const params = ((context as any).params ?? {}) as Record<string, unknown>;

    const client: any = githubMCP as any;
    if (!client) {
      throw new Error("GitHub MCP client not initialized");
    }

    // Try common method names for MCP tool invocation to remain compatible
    if (typeof client.callTool === "function") {
      return await client.callTool(toolName, params);
    }
    if (typeof client.invoke === "function") {
      return await client.invoke(toolName, params);
    }
    if (typeof client.runTool === "function") {
      return await client.runTool(toolName, params);
    }

    throw new Error("MCP client does not support tool invocation");
  },
});
