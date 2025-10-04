import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const ZendeskSimilarCasesInput = z.object({
  scenario: z
    .string()
    .min(5, "Provide a short description of the customer scenario to search against."),
});

const ZendeskSimilarCasesOutput = z.object({
  aggregatedSummary: z.string(),
  cases: z
    .array(
      z.object({
        ticketId: z.string(),
        title: z.string(),
        similarity: z.number().min(0).max(1),
        priority: z.enum(["low", "medium", "high", "urgent"]),
        summary: z.string(),
      }),
    )
    .min(1),
});

export const zendeskSimilarCasesTool = createTool({
  id: "zendesk-similar-cases",
  description: "Return mocked Zendesk cases that resemble the provided customer scenario.",
  inputSchema: ZendeskSimilarCasesInput,
  outputSchema: ZendeskSimilarCasesOutput,
  execute: async ({ context }) => {
    const { scenario } = context;

    const normalizedScenario = scenario.trim();
    const baseSimilarity = Math.max(0.5, Math.min(0.95, normalizedScenario.length / 200));

    return {
      aggregatedSummary: `Identified representative Zendesk tickets related to: ${normalizedScenario}`,
      cases: [
        {
          ticketId: "ZD-2471",
          title: "Similar request impacting roadmap delivery",
          similarity: Number((baseSimilarity + 0.03).toFixed(2)),
          priority: "high",
          summary:
            "Customers reported friction completing the workflow, requesting the same enhancement you described.",
        },
        {
          ticketId: "ZD-2319",
          title: "Recurring bug raised by beta users",
          similarity: Number((baseSimilarity - 0.05).toFixed(2)),
          priority: "medium",
          summary: "Early access users encountered a blocking issue aligned with the scenario details.",
        },
        {
          ticketId: "ZD-2198",
          title: "Feature gap feedback from enterprise account",
          similarity: Number((baseSimilarity - 0.08).toFixed(2)),
          priority: "high",
          summary: "Enterprise stakeholders highlighted the missing capability as a roadmap gap.",
        },
      ],
    };
  },
});
