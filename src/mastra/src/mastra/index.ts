import { Mastra } from "@mastra/core/mastra";
import { weatherWorkflow } from "./workflows/weather-workflow";
import { weatherAgent } from "./agents/weather-agent";

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent },
});
