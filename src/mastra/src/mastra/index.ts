import { Mastra } from "@mastra/core/mastra";
import { dockerAgent } from "./agents/docker-agent";
import { githubAgent } from "./agents/github-agent";
import { plannerAgent } from "./agents/planner-agent";
import { orchestratorAgent } from "./agents/adam/orchestrator-agent";
import { zendeskAgent } from "./agents/adam/zendesk-agent";
import { analyticsAgent } from "./agents/adam/analytics-agent";
import { roadmapAgent } from "./agents/adam/roadmap-agent";
import { githubAnalystAgent } from "./agents/adam/github-analyst-agent";

export const mastra = new Mastra({
  workflows: {},
  agents: {
    dockerAgent,
    githubAgent,
    plannerAgent,
    orchestratorAgent,
    zendeskAgent,
    analyticsAgent,
    roadmapAgent,
    githubAnalystAgent,
  },
});
