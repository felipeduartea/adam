import { Agent } from "@mastra/core";
import { groq } from "@ai-sdk/groq";
import { analyticsEffortTool } from "../../tools/analytics-effort-tool";

export const analyticsAgent = new Agent({
  id: "analyticsAgent",
  name: "Analytics Effort Agent",
  instructions: `Estimate delivery effort combining Zendesk and GitHub insights.
- Expect structured JSON from previous agents as input.
- Always invoke 'analytics-effort-estimator' with the provided zendeskSignals and githubSignals.
- Translate the mocked output into a concise explanation of effort, risks, and confidence.`,
  model: groq("openai/gpt-oss-120b"),
  tools: {
    "analytics-effort-estimator": analyticsEffortTool,
  },
});
