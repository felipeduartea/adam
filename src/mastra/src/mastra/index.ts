import { Mastra } from "@mastra/core/mastra";
import { dockerAgent } from "./agents/docker-agent";
import { githubAgent } from "./agents/github-agent";
import { indexAgent } from "./agents/index-agent";
import { plannerAgent } from "./agents/planner-agent";
import { indexRepoWorkflow } from "./workflows/index-repo-workflow";

export const mastra = new Mastra({
  workflows: { indexRepoWorkflow },
  agents: { dockerAgent, githubAgent, indexAgent, plannerAgent },
});
