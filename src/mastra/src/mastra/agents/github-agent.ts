import { Agent } from "@mastra/core/agent";
import { githubMCP } from "../mcps/github-mcp-client";
import { groq } from "@ai-sdk/groq";

export const githubAgent = new Agent({
  name: "GitHub Agent",
  instructions: `
You are a helpful GitHub assistant. 
Use the 'github-mcp-call' tool to interact with GitHub via the MCP server. 
When you need to perform an action, specify the exact MCP tool name and provide a JSON object with the required parameters.
Return concise, actionable results.
`,
  model: groq("openai/gpt-oss-120b"),
  tools: await githubMCP.getTools(),
});
