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

      // Debug: Log the actual structure of result
      console.log("\n[Call Agents Tool] 🔍 RESULT STRUCTURE", {
        hasToolCalls: !!result.toolCalls,
        toolCallsLength: result.toolCalls?.length,
        toolCallsSample: result.toolCalls?.[0] ? JSON.stringify(result.toolCalls[0], null, 2) : 'none',
        resultKeys: Object.keys(result),
      });

      // Extract tool calls with better handling
      let toolCalls: Array<{ toolName: string; args: any }> | undefined;
      
      if (result.toolCalls && Array.isArray(result.toolCalls)) {
        toolCalls = result.toolCalls
          .map((tc: any) => {
            // Try different possible property names for tool name
            const toolName = tc.toolName || tc.name || tc.toolCallId || tc.type || "";
            // Try different possible property names for arguments
            const args = tc.args || tc.arguments || tc.parameters || tc.input || {};
            
            console.log("\n[Call Agents Tool] 🔧 EXTRACTING TOOL CALL", {
              rawToolCall: JSON.stringify(tc, null, 2),
              extractedToolName: toolName,
              extractedArgs: JSON.stringify(args, null, 2),
            });
            
            return {
              toolName,
              args,
            };
          })
          .filter(tc => tc.toolName !== ""); // Filter out empty tool names
      }

      return {
        agentId,
        agentName: agent.name,
        response: result.text || "",
        toolCalls,
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
