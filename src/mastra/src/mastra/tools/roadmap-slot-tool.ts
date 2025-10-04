import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const RoadmapSlotInput = z.object({
  effort: z.object({
    estimatedEngineeringHours: z.number(),
    engineeringWeekEstimate: z.number(),
    confidence: z.enum(["low", "medium", "high"]),
  }),
  zendeskSignals: z.object({
    aggregatedSummary: z.string(),
  }),
  currentRoadmap: z
    .array(
      z.object({
        initiative: z.string(),
        targetQuarter: z.string(),
        notes: z.string().optional(),
      }),
    )
    .default([]),
});

const RoadmapSlotOutput = z.object({
  recommendedInitiative: z.string(),
  targetQuarter: z.string(),
  rationale: z.array(z.string()),
});

export const roadmapSlotTool = createTool({
  id: "roadmap-slot-recommender",
  description: "Suggest a mocked roadmap slot for the feature based on effort and signals.",
  inputSchema: RoadmapSlotInput,
  outputSchema: RoadmapSlotOutput,
  execute: async ({ context }) => {
    const { effort, zendeskSignals, currentRoadmap } = context;
    const quarterFallback = "Q3 2025";
    const existingMatch = currentRoadmap.find((item) =>
      item.notes?.toLowerCase().includes("zendesk") ?? false,
    );

    return {
      recommendedInitiative: existingMatch?.initiative ?? "Customer Feedback Alignment",
      targetQuarter: existingMatch?.targetQuarter ?? quarterFallback,
      rationale: [
        `Effort estimated at ${effort.engineeringWeekEstimate} engineering weeks (${effort.estimatedEngineeringHours} hours).`,
        `Confidence level reported as ${effort.confidence}.`,
        `Key customer signal: ${zendeskSignals.aggregatedSummary}.`,
        existingMatch
          ? `Aligning with existing roadmap item '${existingMatch.initiative}' to consolidate Zendesk-driven work.`
          : "No matching roadmap initiative found; recommending the next available roadmap slot.",
      ],
    };
  },
});
