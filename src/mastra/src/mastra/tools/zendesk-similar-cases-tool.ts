import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";

const ZendeskSimilarCasesInput = z.object({
  scenario: z
    .string()
    .min(5, "Provide a short description of the customer scenario to search against."),
  organizationId: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
});

const ZendeskSimilarCasesOutput = z.object({
  aggregatedSummary: z.string(),
  cases: z.array(
    z.object({
      ticketId: z.string(),
      title: z.string(),
      similarity: z.number().min(0).max(1),
      priority: z.enum(["low", "medium", "high", "urgent"]),
      summary: z.string(),
      status: z.string().optional(),
      createdAt: z.string().optional(),
    }),
  ),
  totalTickets: z.number(),
});

export const zendeskSimilarCasesTool = createTool({
  id: "zendesk-similar-cases",
  description:
    "Fetch real Zendesk tickets from the database. Returns tickets that may be similar to the provided scenario.",
  inputSchema: ZendeskSimilarCasesInput,
  outputSchema: ZendeskSimilarCasesOutput,
  execute: async ({ context }) => {
    const { scenario, organizationId, limit } = context;

    try {
      // Fetch tickets from database
      const tickets = await prisma.zendeskTicket.findMany({
        where: organizationId
          ? {
              integration: {
                organizationId,
              },
            }
          : undefined,
        orderBy: {
          updatedAt: "desc",
        },
        take: limit,
        include: {
          integration: {
            select: {
              zendeskSubdomain: true,
            },
          },
        },
      });

      if (tickets.length === 0) {
        return {
          aggregatedSummary: `No Zendesk tickets found in the database. Please ensure Zendesk webhooks are configured and receiving data.`,
          cases: [],
          totalTickets: 0,
        };
      }

      // Simple similarity calculation based on keyword matching
      const scenarioKeywords = scenario.toLowerCase().split(/\s+/);
      const casesWithSimilarity = tickets.map((ticket: typeof tickets[number]) => {
        const titleLower = (ticket.subject ?? "").toLowerCase();
        const descLower = (ticket.description ?? "").toLowerCase();
        const combined = `${titleLower} ${descLower}`;

        // Calculate similarity: percentage of keywords found
        const matchCount = scenarioKeywords.filter((kw: string) => combined.includes(kw)).length;
        const similarity = scenarioKeywords.length > 0 ? matchCount / scenarioKeywords.length : 0.5;

        return {
          ticketId: ticket.externalId,
          title: ticket.subject ?? "Untitled ticket",
          similarity: Number(Math.min(similarity, 1).toFixed(2)),
          priority: (ticket.priority ?? "medium") as "low" | "medium" | "high" | "urgent",
          summary: ticket.description?.substring(0, 200) ?? "No description available",
          status: ticket.status ?? undefined,
          createdAt: ticket.createdAt?.toISOString(),
        };
      });

      // Sort by similarity
      casesWithSimilarity.sort(
        (a: { similarity: number }, b: { similarity: number }) => b.similarity - a.similarity,
      );

      return {
        aggregatedSummary: `Found ${tickets.length} Zendesk tickets. Top matches based on similarity to: "${scenario}"`,
        cases: casesWithSimilarity,
        totalTickets: tickets.length,
      };
    } catch (error) {
      console.error("Error fetching Zendesk tickets:", error);
      return {
        aggregatedSummary: `Error fetching tickets: ${error instanceof Error ? error.message : "Unknown error"}`,
        cases: [],
        totalTickets: 0,
      };
    }
  },
});
