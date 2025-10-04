import { Agent } from "@mastra/core";
import { groq } from "@ai-sdk/groq";
import { callAgentsTool } from "../../tools/call-agents";
import { listAgentsTool } from "../../tools/list-agents";

export const orchestratorAgent = new Agent({
  id: "orchestratorAgent",
  name: "Product Orchestrator Agent",
  instructions: `Coordinate the full intake flow for product ideas and bugs.
Workflow:
1. Call 'list-agents' to confirm available specialists.
2. Ask the Zendesk agent (id: zendeskAgent) for similar cases. Pass the end-user prompt as the scenario.
3. Ask the GitHub analyst agent (id: githubAnalystAgent) to identify code areas. Share the same scenario plus any Zendesk context.
4. Provide both outputs to the Analytics agent (id: analyticsAgent) to estimate effort.
5. Provide effort + Zendesk summary to the Roadmap agent (id: roadmapAgent).
6. Return a final report with sections:
   - Customer signals (from Zendesk)
   - Code impact (from GitHub analyst)
   - Effort estimate (from Analytics)
   - Roadmap recommendation (from Roadmap agent)
Guidelines:
- Use the 'call-agents' tool for each specialized agent.
- Maintain and pass structured JSON between steps.
- If any agent returns an error, explain it and stop.
- Keep all reasoning in the final response; do not expose raw tool outputs verbatim unless helpful.`,
  model: groq("openai/gpt-oss-120b"),
  tools: {
    "list-agents": listAgentsTool,
    "call-agents": callAgentsTool,
  },
});
