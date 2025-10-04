import { Agent } from "@mastra/core";
import { groq } from "@ai-sdk/groq";
import { githubCodeLocatorTool } from "../../tools/github-code-locator-tool";
import { githubMCPTool } from "../../tools/github-mcp-tool";

export const githubAnalystAgent = new Agent({
  id: "githubAnalystAgent",
  name: "GitHub Analyst Agent",
  instructions: `Locate code hotspots related to the product scenario.
- Prefer the mocked 'github-code-locator' tool to propose relevant files and modules.
- When real GitHub access is required, you may use 'github-mcp-call'.
- Summarize repository areas, key files, and recommended next steps for engineers.`,
  model: groq("openai/gpt-oss-120b"),
  tools: {
    "github-code-locator": githubCodeLocatorTool,
    "github-mcp-call": githubMCPTool,
  },
});
