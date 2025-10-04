import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const AnalyticsEffortInput = z.object({
  zendeskSignals: z
    .object({
      aggregatedSummary: z.string(),
      cases: z
        .array(
          z.object({
            ticketId: z.string(),
            priority: z.enum(["low", "medium", "high", "urgent"]),
            similarity: z.number(),
          }),
        )
        .optional(),
    })
    .describe("Output returned by the Zendesk agent."),
  githubSignals: z
    .object({
      impactedAreas: z.array(z.string()),
      keyFiles: z.array(z.string()),
    })
    .describe("Output returned by the GitHub agent."),
});

const AnalyticsEffortOutput = z.object({
  estimatedEngineeringHours: z.number(),
  engineeringWeekEstimate: z.number(),
  confidence: z.enum(["low", "medium", "high"]),
  reasoning: z.array(z.string()),
});

export const analyticsEffortTool = createTool({
  id: "analytics-effort-estimator",
  description: "Return a mocked delivery effort estimate using Zendesk + GitHub signals.",
  inputSchema: AnalyticsEffortInput,
  outputSchema: AnalyticsEffortOutput,
  execute: async ({ context }) => {
    const { zendeskSignals, githubSignals } = context;
    const priorityBoost = zendeskSignals?.cases?.some((c) => c.priority === "urgent") ? 1.25 : 1;
    const surfaceArea = githubSignals.impactedAreas.length + githubSignals.keyFiles.length;
    const baseHours = Math.max(8, surfaceArea * 6);
    const estimatedEngineeringHours = Math.round(baseHours * priorityBoost);

    return {
      estimatedEngineeringHours,
      engineeringWeekEstimate: Number((estimatedEngineeringHours / 30).toFixed(1)),
      confidence: priorityBoost > 1 ? "medium" : "high",
      reasoning: [
        `Derived from ${surfaceArea} impacted areas and files.`,
        `Priority boost multiplier applied: ${priorityBoost}.`,
        `Zendesk summary: ${zendeskSignals.aggregatedSummary}.`,
      ],
    };
  },
});
