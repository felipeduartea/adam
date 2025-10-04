import { Agent } from "@mastra/core";
import { groq } from "@ai-sdk/groq";
import { vectorSearchTool } from "../../tools/vector-search-tool";
import { githubMCP } from "../../mcps/github-mcp-client";

export const githubAnalystAgent = new Agent({
  id: "githubAnalystAgent",
  name: "GitHub Analyst Agent",
  instructions: `You are a GitHub code analyst. Your role is to:
- Use the 'vector-search' tool to find relevant code in indexed repositories by searching with natural language queries
- The vector search will return code chunks with similarity scores - focus on the most relevant ones (higher scores)
- When you need to access actual file contents or GitHub data, use the GitHub MCP tools (they start with 'github-')
- Analyze code patterns, file structures, and relationships between components
- Provide detailed insights about code organization, dependencies, and relevant areas for a given scenario
- Summarize repository areas, key files, and recommended next steps for engineers.`,
  model: groq("openai/gpt-oss-120b"),
  tools: async () => {
    // Use function-based tools to prevent race conditions with MCP
    const githubTools = await githubMCP.getTools();
    return {
      "vector-search": vectorSearchTool,
      ...githubTools,
    };
  },
});
