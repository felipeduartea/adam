import { Agent } from "@mastra/core";
import { groq } from "@ai-sdk/groq";
import { roadmapSlotTool } from "../../tools/roadmap-slot-tool";

export const roadmapAgent = new Agent({
  id: "roadmapAgent",
  name: "Roadmap Reasoning Agent",
  instructions: `You decide roadmap placement using effort and customer signal context.
- Receive the analytics effort output, zendesk summary, and current roadmap snapshot.
- Always call 'roadmap-slot-recommender'.
- Respond with: recommended initiative, target quarter, and rationale bullet list.`,
  model: groq("openai/gpt-oss-120b"),
  tools: {
    "roadmap-slot-recommender": roadmapSlotTool,
  },
});
