import { Agent } from "@mastra/core";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Define the agent info schema
const AgentInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

// Define the output schema
const ListAgentsOutputSchema = z.object({
  agents: z.array(AgentInfoSchema),
  totalCount: z.number(),
});

export const listAgentsTool = createTool({
  id: "list-agents",
  description: "Returns a list of all available Mastra agents with their IDs, names, and descriptions",
  inputSchema: z.object({}),
  outputSchema: ListAgentsOutputSchema,
  execute: async ({ context }) => {
    // Import the mastra instance to access agents
    const { mastra } = await import("../index");

    if (!mastra) {
      throw new Error("Mastra instance not found");
    }

    // Get all agents from the Mastra instance
    const agents = Object.values(mastra.getAgents()) as Agent[];

    // Map agents to the required format
    const agentList = agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.getDescription(),
    }));

    return {
      agents: agentList,
      totalCount: agentList.length,
    };
  },
});
