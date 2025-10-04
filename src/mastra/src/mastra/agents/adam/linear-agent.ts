import { Agent } from "@mastra/core";
import { groq } from "@ai-sdk/groq";
import { linearIssuesTool } from "../../tools/linear-issues-tool";

export const linearAgent = new Agent({
  id: "linearAgent",
  name: "Linear Issues Agent",
  instructions: `You analyze Linear issues and project status.
- Always call the 'linear-issues' tool to fetch real data from the database.
- Analyze the issues and provide insights about:
  * Current workload distribution
  * Issues by status (TODO, IN_PROGRESS, IN_REVIEW, DONE)
  * Priority distribution
  * Sprint and project organization
- Highlight any patterns or potential bottlenecks
Return a structured summary with:
1. Overview (total issues, status breakdown)
2. Priority distribution and high-priority items
3. Notable issues or patterns
4. Recommendations for related work`,
  model: groq("openai/gpt-oss-120b"),
  tools: {
    "linear-issues": linearIssuesTool,
  },
});

