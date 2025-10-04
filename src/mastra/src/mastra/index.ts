import { Mastra } from "@mastra/core/mastra";
import { dockerAgent } from "./agents/docker-agent";
import { githubAgent } from "./agents/github-agent";
import { plannerAgent } from "./agents/planner-agent";

export const mastra = new Mastra({
  workflows: {},
  agents: { dockerAgent, githubAgent, plannerAgent },
});
