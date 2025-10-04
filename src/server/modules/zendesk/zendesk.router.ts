import { createRoute, z } from "@hono/zod-openapi";

import { newOpenAPIHono } from "@/server/lib/router";

const ZendeskWebhookRoute = createRoute({
  method: "post",
  path: "/webhook",
  tags: ["Zendesk"],
  summary: "Handle Zendesk webhook events",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.record(z.unknown()),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Webhook acknowledged",
      content: {
        "application/json": {
          schema: z.object({
            ok: z.boolean(),
          }),
        },
      },
    },
    400: {
      description: "Invalid payload",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
  },
});

const router = newOpenAPIHono();

router.openapi(ZendeskWebhookRoute, async (c) => {
  try {
    const payload = await c.req.json();
    // Forward payload for processing or queueing here
    return c.json({ ok: true, received: payload }, 200);
  } catch (error) {
    console.error("Zendesk webhook payload parsing failed", error);
    return c.json({ error: "Invalid JSON" }, 400);
  }
});

export default router;
