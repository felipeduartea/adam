import { Agent } from "@mastra/core";
import { groq } from "@ai-sdk/groq";
import { zendeskSimilarCasesTool } from "../../tools/zendesk-similar-cases-tool";

export const zendeskAgent = new Agent({
  id: "zendeskAgent",
  name: "Zendesk Insights Agent",
  instructions: `You analyze customer support trends.
- Always call the 'zendesk-similar-cases' tool with the scenario provided by the orchestrator.
- Summarize how the returned cases influence customer impact.
- Highlight patterns in priority and similarities.
Return a structured summary with:
1. Impact overview (1-2 sentences)
2. Key supporting tickets (bullet list with ticketId + priority + similarity)
3. Recommendation on urgency`,
  model: groq("openai/gpt-oss-120b"),
  tools: {
    "zendesk-similar-cases": zendeskSimilarCasesTool,
  },
});
