import { createRoute, z } from "@hono/zod-openapi";
import type { Context } from "hono";
import { createHash, createHmac, timingSafeEqual, randomBytes } from "node:crypto";

import { Prisma, ZendeskIntegrationStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { newOpenAPIHono } from "@/server/lib/router";
import { requireAuthentication, Variables } from "@/server/middleware";

const ZendeskWebhookRoute = createRoute({
  method: "post",
  path: "/webhook/{webhookToken}",
  tags: ["Zendesk"],
  summary: "Handle Zendesk webhook events",
  request: {
    params: z.object({
      webhookToken: z.string().min(1),
    }),
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
            ok: z.literal(true),
            ticketId: z.string().optional(),
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
    401: {
      description: "Invalid or missing signature",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
    404: {
      description: "Webhook not found",
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

const ZendeskWebhookSetupRoute = createRoute({
  method: "post",
  path: "/webhook/setup",
  middleware: [requireAuthentication] as const,
  tags: ["Zendesk"],
  summary: "Create or regenerate webhook token",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            zendeskSubdomain: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Webhook token created/regenerated",
      content: {
        "application/json": {
          schema: z.object({
            webhookUrl: z.string(),
            endpointPath: z.string(),
          }),
        },
      },
    },
    404: {
      description: "Integration not found",
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

const ZendeskWebhookInfoRoute = createRoute({
  method: "get",
  path: "/webhook/info",
  middleware: [requireAuthentication] as const,
  tags: ["Zendesk"],
  summary: "Get webhook configuration",
  request: {
    query: z.object({
      zendeskSubdomain: z.string().min(1),
    }),
  },
  responses: {
    200: {
      description: "Webhook configuration",
      content: {
        "application/json": {
          schema: z.object({
            webhookUrl: z.string(),
            endpointPath: z.string(),
            isActive: z.boolean(),
            createdAt: z.string(),
          }),
        },
      },
    },
    404: {
      description: "Webhook not found",
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

const ZendeskStatusRoute = createRoute({
  method: "get",
  path: "/status",
  middleware: [requireAuthentication] as const,
  tags: ["Zendesk"],
  summary: "Get Zendesk integration status for the authenticated user's organization",
  responses: {
    200: {
      description: "Integration status",
      content: {
        "application/json": {
          schema: z.object({
            connected: z.boolean(),
            integration: z
              .object({
                id: z.string(),
                zendeskSubdomain: z.string(),
                status: z.nativeEnum(ZendeskIntegrationStatus),
                webhook: z
                  .object({
                    endpointPath: z.string(),
                    webhookUrl: z.string(),
                    isActive: z.boolean(),
                    createdAt: z.string(),
                  })
                  .nullable(),
              })
              .nullable(),
          }),
        },
      },
    },
  },
});

type JsonObject = Record<string, unknown>;

type ParsedTicket = {
  externalId: string;
  subject: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  requesterId: string | null;
  assigneeId: string | null;
  tags: string[];
  url: string | null;
  createdAtVendor: Date | null;
  updatedAtVendor: Date | null;
};

type ParsedMessage = {
  externalMessageId: string | null;
  authorId: string | null;
  authorName: string | null;
  authorEmail: string | null;
  body: string;
  isPrivate: boolean;
  createdAtVendor: Date | null;
};

const router = newOpenAPIHono<{ Variables: Variables }>();

// Webhook setup endpoint
router.openapi(ZendeskWebhookSetupRoute, async (c) => {
  const userId = c.get("userId");
  const { zendeskSubdomain } = c.req.valid("json");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  if (!user?.organizationId) {
    return c.json({ error: "User not associated with an organization" }, 404);
  }

  // Auto-create or find the Zendesk integration
  const integration = await prisma.zendeskIntegration.upsert({
    where: {
      organizationId_zendeskSubdomain: {
        organizationId: user.organizationId,
        zendeskSubdomain,
      },
    },
    create: {
      organizationId: user.organizationId,
      zendeskSubdomain,
      status: "PENDING",
      installerUserId: userId,
    },
    update: {
      // Update installer if they're regenerating
      installerUserId: userId,
    },
  });

  // Generate secure random token (no signing secret needed)
  const webhookToken = randomBytes(32).toString("hex");
  const endpointPath = `/webhook/${webhookToken}`;

  await prisma.zendeskWebhook.upsert({
    where: {
      zendeskIntegrationId: integration.id,
    },
    create: {
      zendeskIntegrationId: integration.id,
      endpointPath,
      signingSecret: "none", // Not used, but required by schema
      isActive: true,
    },
    update: {
      endpointPath,
      signingSecret: "none",
      isActive: true,
    },
  });

  // Get the base URL from the request
  const protocol = c.req.header("x-forwarded-proto") || "https";
  const host = c.req.header("host");
  const webhookUrl = `${protocol}://${host}/api/zendesk${endpointPath}`;

  return c.json(
    {
      webhookUrl,
      endpointPath,
    },
    200,
  );
});

// Webhook info endpoint
router.openapi(ZendeskWebhookInfoRoute, async (c) => {
  const userId = c.get("userId");
  const { zendeskSubdomain } = c.req.valid("query");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  if (!user?.organizationId) {
    return c.json({ error: "User not associated with an organization" }, 404);
  }

  const integration = await prisma.zendeskIntegration.findUnique({
    where: {
      organizationId_zendeskSubdomain: {
        organizationId: user.organizationId,
        zendeskSubdomain,
      },
    },
    include: {
      webhook: true,
    },
  });

  if (!integration?.webhook) {
    return c.json({ error: "Webhook not found" }, 404);
  }

  const protocol = c.req.header("x-forwarded-proto") || "https";
  const host = c.req.header("host");
  const webhookUrl = `${protocol}://${host}/api/zendesk${integration.webhook.endpointPath}`;

  return c.json(
    {
      webhookUrl,
      endpointPath: integration.webhook.endpointPath,
      isActive: integration.webhook.isActive,
      createdAt: integration.webhook.createdAt.toISOString(),
    },
    200,
  );
});

router.openapi(ZendeskStatusRoute, async (c) => {
  const userId = c.get("userId");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  if (!user?.organizationId) {
    return c.json({ connected: false, integration: null });
  }

  const integration = await prisma.zendeskIntegration.findFirst({
    where: { organizationId: user.organizationId },
    include: { webhook: true },
    orderBy: { createdAt: "desc" },
  });

  if (!integration) {
    return c.json({ connected: false, integration: null });
  }

  const host = c.req.header("host") ?? "localhost:3000";
  const protocol = c.req.header("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const webhookUrl = integration.webhook
    ? `${protocol}://${host}/api/zendesk${integration.webhook.endpointPath}`
    : null;

  const payload = {
    id: integration.id,
    zendeskSubdomain: integration.zendeskSubdomain,
    status: integration.status,
    webhook: integration.webhook
      ? {
          endpointPath: integration.webhook.endpointPath,
          webhookUrl: webhookUrl!,
          isActive: integration.webhook.isActive,
          createdAt: integration.webhook.createdAt.toISOString(),
        }
      : null,
  } as const;

  const connected = integration.status === ZendeskIntegrationStatus.ACTIVE && Boolean(integration.webhook?.isActive);

  return c.json({ connected, integration: payload });
});

// Webhook receiver endpoint
router.openapi(ZendeskWebhookRoute, async (c) => {
  const { webhookToken } = c.req.valid("param");
  const requestPath = normaliseRequestPath(c.req.path);
  const endpointCandidates = buildEndpointCandidates(webhookToken, requestPath);

  const webhook = await prisma.zendeskWebhook.findFirst({
    where: {
      isActive: true,
      endpointPath: { in: endpointCandidates },
    },
    include: {
      integration: true,
    },
  });

  if (!webhook || !webhook.integration) {
    return c.json({ error: "Unknown Zendesk webhook" }, 404);
  }

  const rawBody = await c.req.text();
  const providedSignature = extractZendeskSignature(c);

  let payload: JsonObject;
  try {
    payload = JSON.parse(rawBody) as JsonObject;
  } catch (error) {
    console.error("Zendesk webhook payload parsing failed", error);
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (!isRecord(payload)) {
    return c.json({ error: "Unsupported payload shape" }, 400);
  }

  const integration = webhook.integration;
  const eventType = extractEventType(payload, c.req.header("x-zendesk-topic"));
  const vendorEventId = extractVendorEventId(payload);
  const payloadHash = createHash("sha256").update(rawBody).digest("hex");
  const zendeskDomain = c.req.header("x-zendesk-domain");

  let storedTicketId: string | null = null;

  await prisma.$transaction(async (tx) => {
    await createRawEvent(tx, {
      integrationId: integration.id,
      vendorEventId,
      eventType,
      payload,
      payloadHash,
    });

    const parsedTicket = extractTicket(payload);

    if (parsedTicket) {
      const ticketRecord = await upsertTicket(tx, integration.id, parsedTicket);
      storedTicketId = ticketRecord.id;

      const parsedMessages = extractMessages(payload);
      for (const message of parsedMessages) {
        if (!message.body) continue;

        await upsertMessage(tx, integration.id, ticketRecord.id, message);
      }
    }

    const integrationUpdates: Record<string, unknown> = {};

    if (integration.status !== ZendeskIntegrationStatus.ACTIVE) {
      integrationUpdates.status = ZendeskIntegrationStatus.ACTIVE;
    }

    if (zendeskDomain && zendeskDomain !== integration.zendeskSubdomain) {
      integrationUpdates.zendeskSubdomain = zendeskDomain;
    }

    if (Object.keys(integrationUpdates).length > 0) {
      await tx.zendeskIntegration.update({
        where: { id: integration.id },
        data: integrationUpdates,
      });
    }
  });

  return c.json(
    storedTicketId ? { ok: true as const, ticketId: storedTicketId } : { ok: true as const },
    200,
  );
});

export default router;

function normaliseRequestPath(path: string) {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }
  return path;
}

function buildEndpointCandidates(webhookToken: string, requestPath: string) {
  const tokenWithSlash = webhookToken.startsWith("/") ? webhookToken : `/${webhookToken}`;
  const candidates = new Set<string>([
    tokenWithSlash,
    `/webhook${tokenWithSlash}`,
    requestPath.replace(/^\/api\/zendesk/i, "").replace(/^\/zendesk/i, ""),
    requestPath.replace(/^\/api/i, ""),
  ]);

  return Array.from(candidates)
    .map((candidate) => (candidate.startsWith("/") ? candidate : `/${candidate}`))
    .map((candidate) => candidate.replace(/\/$/, ""))
    .filter((candidate) => candidate.length > 0);
}

function extractZendeskSignature(c: Context) {
  const headersToCheck = ["x-zendesk-signature", "x-zendesk-webhook-signature"];
  for (const header of headersToCheck) {
    const value = c.req.header(header);
    if (value) {
      return value;
    }
  }
  return null;
}

function verifyZendeskSignature(body: string, secret: string, signature: string) {
  try {
    const expected = createHmac("sha256", secret).update(body, "utf8").digest("base64");
    const providedBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expected, "base64");

    if (providedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, expectedBuffer);
  } catch (error) {
    console.error("Zendesk signature verification failed", error);
    return false;
  }
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toStringOrNull(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return value.toString();
  }
  return null;
}

function toDateOrNull(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => toStringOrNull(item))
    .filter((item): item is string => typeof item === "string");
}

function extractTicket(payload: JsonObject): ParsedTicket | null {
  const ticketCandidate = [
    payload.ticket,
    payload.event && isRecord(payload.event) ? (payload.event as JsonObject).ticket : undefined,
  ]
    .concat(extractTicketEventCandidate(payload, "ticket"))
    .find((candidate): candidate is JsonObject => isRecord(candidate));

  if (!ticketCandidate) {
    return null;
  }

  const externalId = toStringOrNull(ticketCandidate.id ?? ticketCandidate.external_id);
  if (!externalId) {
    return null;
  }

  return {
    externalId,
    subject: toStringOrNull(ticketCandidate.subject ?? ticketCandidate.title),
    description: toStringOrNull(ticketCandidate.description),
    status: toStringOrNull(ticketCandidate.status),
    priority: toStringOrNull(ticketCandidate.priority),
    requesterId: toStringOrNull(ticketCandidate.requester_id ?? ticketCandidate.requesterId),
    assigneeId: toStringOrNull(ticketCandidate.assignee_id ?? ticketCandidate.assigneeId),
    tags: toStringArray(ticketCandidate.tags),
    url: toStringOrNull(ticketCandidate.url ?? ticketCandidate.html_url),
    createdAtVendor: toDateOrNull(ticketCandidate.created_at ?? ticketCandidate.createdAt),
    updatedAtVendor: toDateOrNull(ticketCandidate.updated_at ?? ticketCandidate.updatedAt),
  };
}

function extractTicketEventCandidate(payload: JsonObject, key: string) {
  const ticketEvent = payload.ticket_event;
  if (isRecord(ticketEvent)) {
    const value = ticketEvent[key as keyof typeof ticketEvent];
    if (value) {
      if (Array.isArray(value)) {
        return value;
      }
      return [value];
    }
  }
  return [];
}

function extractMessages(payload: JsonObject): ParsedMessage[] {
  const messageCandidates: unknown[] = [];

  const ticketEvent = payload.ticket_event;
  if (isRecord(ticketEvent)) {
    if (ticketEvent.latest_comment) {
      messageCandidates.push(ticketEvent.latest_comment);
    }
    if (Array.isArray(ticketEvent.comments)) {
      messageCandidates.push(...ticketEvent.comments);
    }
  }

  if (payload.comment) {
    messageCandidates.push(payload.comment);
  }

  if (isRecord(payload.event) && payload.event.comment) {
    messageCandidates.push((payload.event as JsonObject).comment as unknown);
  }

  const parsedMessages: ParsedMessage[] = [];
  const seenExternalIds = new Set<string>();

  for (const candidate of messageCandidates) {
    const parsed = parseMessage(candidate);
    if (!parsed) continue;

    if (parsed.externalMessageId) {
      if (seenExternalIds.has(parsed.externalMessageId)) {
        continue;
      }
      seenExternalIds.add(parsed.externalMessageId);
    }

    parsedMessages.push(parsed);
  }

  return parsedMessages;
}

function parseMessage(value: unknown): ParsedMessage | null {
  if (!isRecord(value)) {
    return null;
  }

  const body =
    toStringOrNull(value.body) ??
    toStringOrNull(value.html_body) ??
    toStringOrNull(value.plain_body) ??
    toStringOrNull(value.description);

  if (!body) {
    return null;
  }

  const author = isRecord(value.author) ? (value.author as JsonObject) : undefined;

  return {
    externalMessageId: toStringOrNull(value.id ?? value.external_id ?? value.message_id),
    authorId: toStringOrNull(value.author_id ?? value.authorId ?? author?.id),
    authorName: toStringOrNull(value.author_name ?? author?.name),
    authorEmail: toStringOrNull(value.author_email ?? author?.email),
    body,
    isPrivate: value.public === false || value.is_private === true,
    createdAtVendor: toDateOrNull(value.created_at ?? value.createdAt),
  };
}

function extractEventType(payload: JsonObject, topicHeader: string | undefined) {
  return (
    topicHeader ??
    toStringOrNull(payload.event_type) ??
    (isRecord(payload.event) ? toStringOrNull((payload.event as JsonObject).type) : null) ??
    "unknown"
  );
}

function extractVendorEventId(payload: JsonObject) {
  return (
    toStringOrNull(payload.event_id) ??
    toStringOrNull(payload.id) ??
    (isRecord(payload.event) ? toStringOrNull((payload.event as JsonObject).id) : null)
  );
}

async function createRawEvent(
  tx: Prisma.TransactionClient,
  params: {
    integrationId: string;
    vendorEventId: string | null;
    eventType: string;
    payload: JsonObject;
    payloadHash: string;
  },
) {
  try {
    await tx.zendeskEventRaw.create({
      data: {
        zendeskIntegrationId: params.integrationId,
        vendorEventId: params.vendorEventId ?? undefined,
        type: params.eventType,
        payloadJson: params.payload as Prisma.InputJsonValue,
        payloadHash: params.payloadHash,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
    // Duplicate event - this is normal, Zendesk sends webhooks multiple times for reliability
    console.log(`ℹ️  Skipping duplicate event: ${params.vendorEventId || params.eventType}`);
  }
}

async function upsertTicket(tx: Prisma.TransactionClient, integrationId: string, ticket: ParsedTicket) {
  return tx.zendeskTicket.upsert({
    where: {
      zendeskIntegrationId_externalId: {
        zendeskIntegrationId: integrationId,
        externalId: ticket.externalId,
      },
    },
    update: {
      subject: ticket.subject ?? undefined,
      description: ticket.description ?? undefined,
      status: ticket.status ?? undefined,
      priority: ticket.priority ?? undefined,
      requesterId: ticket.requesterId ?? undefined,
      assigneeId: ticket.assigneeId ?? undefined,
      tags: ticket.tags,
      url: ticket.url ?? undefined,
      createdAtVendor: ticket.createdAtVendor ?? undefined,
      updatedAtVendor: ticket.updatedAtVendor ?? undefined,
    },
    create: {
      zendeskIntegrationId: integrationId,
      externalId: ticket.externalId,
      subject: ticket.subject ?? undefined,
      description: ticket.description ?? undefined,
      status: ticket.status ?? undefined,
      priority: ticket.priority ?? undefined,
      requesterId: ticket.requesterId ?? undefined,
      assigneeId: ticket.assigneeId ?? undefined,
      tags: ticket.tags,
      url: ticket.url ?? undefined,
      createdAtVendor: ticket.createdAtVendor ?? undefined,
      updatedAtVendor: ticket.updatedAtVendor ?? undefined,
    },
  });
}

async function upsertMessage(
  tx: Prisma.TransactionClient,
  integrationId: string,
  ticketId: string,
  message: ParsedMessage,
) {
  const baseData = {
    ticketId,
    authorId: message.authorId ?? undefined,
    authorName: message.authorName ?? undefined,
    authorEmail: message.authorEmail ?? undefined,
    body: message.body,
    isPrivate: message.isPrivate,
    createdAtVendor: message.createdAtVendor ?? undefined,
  };

  if (message.externalMessageId) {
    await tx.zendeskTicketMessage.upsert({
      where: {
        zendeskIntegrationId_externalMessageId: {
          zendeskIntegrationId: integrationId,
          externalMessageId: message.externalMessageId,
        },
      },
      update: baseData,
      create: {
        zendeskIntegrationId: integrationId,
        externalMessageId: message.externalMessageId,
        ...baseData,
      },
    });
    return;
  }

  await tx.zendeskTicketMessage.create({
    data: {
      zendeskIntegrationId: integrationId,
      ...baseData,
    },
  });
}

function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
