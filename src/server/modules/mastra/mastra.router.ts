import { createRoute, z } from "@hono/zod-openapi";

import { newOpenAPIHono } from "@/server/lib/router";
import { requireAuthentication, Variables } from "@/server/middleware";

const MastraChatRoute = createRoute({
  method: "post",
  path: "/chat",
  middleware: [requireAuthentication] as const,
  tags: ["Mastra"],
  summary: "Send a prompt to the Mastra orchestrator agent and receive a reply",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            message: z.string().min(1),
            history: z
              .array(
                z.object({
                  role: z.enum(["user", "assistant"]),
                  content: z.string(),
                }),
              )
              .optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Mastra agent reply",
      content: {
        "application/json": {
          schema: z.object({
            reply: z.string(),
            raw: z.unknown().optional(),
          }),
        },
      },
    },
    400: {
      description: "Invalid request",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
    502: {
      description: "Mastra upstream error",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
            detail: z.string().optional(),
          }),
        },
      },
    },
  },
});

function getMastraBaseUrl() {
  const value = process.env.MASTRA_API_URL;
  if (!value) {
    throw new Error("MASTRA_API_URL environment variable is not set");
  }
  return value.replace(/\/$/, "");
}

const router = newOpenAPIHono<{ Variables: Variables }>();

router.openapi(MastraChatRoute, async (c) => {
  const { message, history } = c.req.valid("json");

  let baseUrl: string;
  try {
    baseUrl = getMastraBaseUrl();
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : "Mastra configuration missing" }, 400);
  }

  const agentId = process.env.MASTRA_AGENT_ID ?? "orchestratorAgent";
  const endpoint = process.env.MASTRA_CHAT_ENDPOINT ?? "/api/issue-intake";
  const targetUrl = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const payload = {
    agentId,
    input: {
      message,
      history,
    },
  };

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.MASTRA_API_KEY ? { Authorization: `Bearer ${process.env.MASTRA_API_KEY}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    return c.json({ error: "Mastra request failed", detail }, 502);
  }

  const data = await response.json().catch(() => null);

  const reply =
    (typeof data?.output === "string" && data.output) ||
    data?.output?.content ||
    data?.output?.text ||
    (Array.isArray(data?.output) ? data.output.join("\n\n") : undefined) ||
    data?.response?.message ||
    data?.response?.content ||
    data?.message ||
    data?.result ||
    data?.content ||
    "";

  return c.json({ reply: String(reply ?? ""), raw: data ?? undefined });
});

export default router;
