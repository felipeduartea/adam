import { Mastra } from "@mastra/core/mastra";
// import { dockerAgent } from "./agents/docker-agent";
// import { githubAgent } from "./agents/github-agent";
// import { indexAgent } from "./agents/index-agent";
// import { plannerAgent } from "./agents/planner-agent";
import { githubAnalystAgent } from "./agents/adam/github-analyst-agent";
import { analyticsAgent } from "./agents/adam/analytics-agent";
import { roadmapAgent } from "./agents/adam/roadmap-agent";
import { zendeskAgent } from "./agents/adam/zendesk-agent";
import { linearAgent } from "./agents/adam/linear-agent";
import { orchestratorAgent } from "./agents/adam/orchestrator-agent";
import { indexRepoWorkflow } from "./workflows/index-repo-workflow";
import { analyzeRepoWorkflow } from "./workflows/analyze-repo-workflow";

export const mastra = new Mastra({
  workflows: {
    indexRepoWorkflow,
    analyzeRepoWorkflow,
  },
  agents: {
    // dockerAgent,
    // githubAgent,
    // plannerAgent,
    orchestratorAgent,
    analyticsAgent,
    zendeskAgent,
    linearAgent,
    roadmapAgent,
    githubAnalystAgent,
    // indexAgent,
  },
});
