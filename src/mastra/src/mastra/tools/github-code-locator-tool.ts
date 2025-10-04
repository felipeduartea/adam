import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const GithubCodeLocatorInput = z.object({
  scenario: z.string().describe("Product or bug scenario we want to investigate."),
  codebaseHints: z
    .array(z.string())
    .default([])
    .describe("Optional keywords, component names, or modules likely involved."),
});

const GithubCodeLocatorOutput = z.object({
  repo: z.string(),
  impactedAreas: z.array(z.string()),
  keyFiles: z.array(z.string()),
  testFiles: z.array(z.string()),
  summary: z.string(),
});

export const githubCodeLocatorTool = createTool({
  id: "github-code-locator",
  description: "Return mocked source code locations relevant to the described scenario.",
  inputSchema: GithubCodeLocatorInput,
  outputSchema: GithubCodeLocatorOutput,
  execute: async ({ context }) => {
    const { scenario, codebaseHints } = context;
    const joinedHints = codebaseHints?.length ? ` Hints: ${codebaseHints.join(", ")}.` : "";

    return {
      repo: "github.com/acme/adam",
      impactedAreas: [
        "Next.js route handlers",
        "Server-side integrations",
        "Supabase security policies",
      ],
      keyFiles: [
        "src/app/api/zendesk/webhook/route.ts",
        "src/server/modules/zendesk/zendesk.router.ts",
        "src/server/modules/linear/linear.router.ts",
      ],
      testFiles: ["src/server/modules/zendesk/zendesk.router.test.ts"],
      summary: `Mapped scenario to affected modules for further analysis.${joinedHints} Scenario: ${scenario}`,
    };
  },
});
