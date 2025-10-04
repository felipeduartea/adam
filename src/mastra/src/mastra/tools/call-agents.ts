import { Agent, Mastra } from "@mastra/core";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Define the input schema for calling an agent
const CallAgentInputSchema = z.object({
  agentId: z.string().describe("The ID or name of the agent to call"),
  input: z.string().describe("The input message to send to the agent"),
});

// Define the output schema
const CallAgentOutputSchema = z.object({
  agentId: z.string(),
  agentName: z.string(),
  response: z.string(),
  toolCalls: z
    .array(
      z.object({
        toolName: z.string(),
        args: z.any(),
      }),
    )
    .optional(),
  usage: z
    .object({
      totalTokens: z.number().optional(),
      promptTokens: z.number().optional(),
      completionTokens: z.number().optional(),
    })
    .optional(),
  error: z.string().optional(),
});

export const callAgentsTool = createTool({
  id: "call-agents",
  description: "Execute another Mastra agent by providing its ID/name and input, then return the agent's response",
  inputSchema: CallAgentInputSchema,
  outputSchema: CallAgentOutputSchema,
  execute: async ({ context }): Promise<z.infer<typeof CallAgentOutputSchema>> => {
    const { agentId, input } = context;

    try {
      // Import the mastra instance to access agents
      const { mastra } = (await import("../index")) as { mastra: Mastra };

      if (!mastra) {
        throw new Error("Mastra instance not found");
      }

      const agent = mastra.getAgentById(agentId);

      if (!agent) {
        throw new Error(`Agent with ID/name '${agentId}' not found`);
      }

      // Call the agent with default maxSteps of 50
      const result = await agent.generate(input, { maxSteps: 50 });

      return {
        agentId,
        agentName: agent.name,
        response: result.text || "",
        toolCalls: result.toolCalls?.map((tc: any) => ({
          toolName: tc.toolName || tc.name || "",
          args: tc.args || tc.arguments || {},
        })),
        usage: result.usage
          ? {
              totalTokens: result.usage.totalTokens,
            }
          : undefined,
      };
    } catch (error) {
      return {
        agentId,
        agentName: "",
        response: "",
        error: `Failed to call agent: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
