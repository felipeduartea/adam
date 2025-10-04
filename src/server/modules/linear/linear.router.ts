import { createRoute, z } from "@hono/zod-openapi";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { InternalServerError } from "@/server/errors";
import { newOpenAPIHono } from "@/server/lib/router";
import { requireAuthentication, Variables } from "@/server/middleware";

const LinearAuthorizeRoute = createRoute({
  method: "post",
  path: "/authorize",
  middleware: [requireAuthentication] as const,
  tags: ["Linear"],
  summary: "Generate Linear authorization URL with state",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              scope: z.string().optional(),
              redirectUri: z.string().url().optional(),
            })
            .optional(),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Authorization URL generated",
      content: {
        "application/json": {
          schema: z.object({
            authorizationUrl: z.string().url(),
            state: z.string(),
          }),
        },
      },
    },
    400: {
      description: "Unable to build authorization request",
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

const LinearConnectRoute = createRoute({
  method: "get",
  path: "/connect",
  tags: ["Linear"],
  summary: "Handle Linear OAuth callback",
  request: {
    query: z.object({
      code: z.string().min(1),
      state: z.string().min(1),
    }),
  },
  responses: {
    302: {
      description: "Redirect back to the application",
    },
    400: {
      description: "Invalid OAuth callback",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Linear exchange failed",
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

const LinearStatusRoute = createRoute({
  method: "get",
  path: "/status",
  middleware: [requireAuthentication] as const,
  tags: ["Linear"],
  summary: "Get Linear integration status for the authenticated user's organization",
  responses: {
    200: {
      description: "Linear connection status",
      content: {
        "application/json": {
          schema: z.object({
            connected: z.boolean(),
            organizationId: z.string().nullable(),
            linearOrgId: z.string().nullable(),
            linearOrgName: z.string().nullable(),
            installerUserId: z.string().nullable(),
            updatedAt: z.string().nullable(),
          }),
        },
      },
    },
  },
});

function getEnvVar(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new InternalServerError(`Missing ${name} environment variable`);
  }
  return value;
}

type LinearStatePayload = {
  userId: string;
  organizationId: string;
  exp: number;
  nonce: string;
};

function getStateSecret() {
  return (
    process.env.LINEAR_STATE_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    process.env.LINEAR_CLIENT_SECRET ||
    "linear-state-fallback-secret"
  );
}

function encodeState(payload: LinearStatePayload) {
  const secret = getStateSecret();
  const json = JSON.stringify(payload);
  const signature = createHmac("sha256", secret).update(json).digest("base64url");
  const body = Buffer.from(json).toString("base64url");
  return `${body}.${signature}`;
}

function decodeState(state: string): LinearStatePayload {
  const secret = getStateSecret();
  const [body, signature] = state.split(".");
  if (!body || !signature) {
    throw new Error("Malformed state");
  }

  const payloadBuffer = Buffer.from(body, "base64url");
  const expectedSignature = createHmac("sha256", secret).update(payloadBuffer).digest("base64url");

  const signatureBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expectedSignature, "base64url");

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error("Invalid state signature");
  }

  const payload = JSON.parse(payloadBuffer.toString("utf8")) as LinearStatePayload;

  if (payload.exp < Date.now()) {
    throw new Error("State expired");
  }

  return payload;
}

const router = newOpenAPIHono<{ Variables: Variables }>();

router.openapi(LinearAuthorizeRoute, async (c) => {
  const body = (await c.req.json().catch(() => undefined)) as { scope?: string; redirectUri?: string } | undefined;
  const scope = body?.scope ?? "read,write";
  const redirectUri = body?.redirectUri ?? getEnvVar("LINEAR_REDIRECT_URI");
  const userId = c.get("userId") as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, organizationId: true },
  });

  if (!user?.organizationId) {
    return c.json({ error: "User is not associated with an organization" }, 400);
  }

  const clientId = getEnvVar("LINEAR_CLIENT_ID");
  const expiresInMs = 10 * 60 * 1000; // 10 minutes
  const statePayload: LinearStatePayload = {
    userId: user.id,
    organizationId: user.organizationId,
    exp: Date.now() + expiresInMs,
    nonce: randomBytes(16).toString("hex"),
  };

  const state = encodeState(statePayload);

  const authorizationUrl = new URL("https://linear.app/oauth/authorize");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", scope);
  authorizationUrl.searchParams.set("state", state);

  return c.json({ authorizationUrl: authorizationUrl.toString(), state }, 200);
});

router.openapi(LinearConnectRoute, async (c) => {
  const { code, state } = c.req.valid("query");

  const clientId = getEnvVar("LINEAR_CLIENT_ID");
  const clientSecret = getEnvVar("LINEAR_CLIENT_SECRET");
  const redirectUri = getEnvVar("LINEAR_REDIRECT_URI");

  let statePayload: LinearStatePayload;
  try {
    statePayload = decodeState(state);
  } catch (error) {
    console.error("Failed to decode Linear state", error);
    return c.json({ error: "Invalid state parameter" }, 400);
  }

  const tokenResponse = await fetch("https://api.linear.app/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    return c.json({ error: errorText }, 500);
  }

  const tokenJson = (await tokenResponse.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const accessToken = tokenJson.access_token;

  if (!accessToken) {
    return c.json({ error: "Missing access token" }, 500);
  }

  const viewerResponse = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: JSON.stringify({
      query: `query ViewerWithOrg {
        viewer {
          id
          name
          email
          avatarUrl
          organization {
            id
            name
          }
        }
      }`,
    }),
  });

  if (!viewerResponse.ok) {
    const errorText = await viewerResponse.text();
    return c.json({ error: errorText }, 500);
  }

  const viewerJson = (await viewerResponse.json()) as {
    data?: {
      viewer?: {
        id?: string | null;
        name?: string | null;
        email?: string | null;
        avatarUrl?: string | null;
        organization?: {
          id?: string | null;
          name?: string | null;
        } | null;
      } | null;
    };
    errors?: Array<{ message?: string }>;
  };

  const viewer = viewerJson.data?.viewer ?? null;

  if (!viewer?.organization?.id) {
    const errorMessage =
      viewerJson.errors?.map((err) => err.message).join(", ") ?? "Linear viewer organization missing in response";
    return c.json({ error: errorMessage }, 500);
  }

  const linearOrgId = viewer.organization.id;
  const linearOrgName = viewer.organization.name ?? null;
  const userId = statePayload.userId;

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, organizationId: true },
  });

  if (!currentUser?.organizationId || currentUser.organizationId !== statePayload.organizationId) {
    return c.json({ error: "User organization mismatch" }, 400);
  }

  const expiresAt =
    typeof tokenJson.expires_in === "number" ? new Date(Date.now() + tokenJson.expires_in * 1000) : null;

  await prisma.$transaction(async (tx) => {
    await tx.organization.update({
      where: { id: currentUser.organizationId! },
      data: {
        linearOrgId,
        linearOrgName,
      },
    });

    await tx.linearConnection.upsert({
      where: { organizationId: currentUser.organizationId! },
      update: {
        orgLinearId: linearOrgId,
        orgName: linearOrgName,
        accessToken,
        refreshToken: tokenJson.refresh_token ?? null,
        expiresAt,
        installerUserId: userId,
      },
      create: {
        organizationId: currentUser.organizationId!,
        orgLinearId: linearOrgId,
        orgName: linearOrgName,
        accessToken,
        refreshToken: tokenJson.refresh_token ?? null,
        expiresAt,
        installerUserId: userId,
      },
    });

    if (viewer.id) {
      await tx.linearUser.upsert({
        where: {
          orgLinearId_linearUserId: {
            orgLinearId: linearOrgId,
            linearUserId: viewer.id,
          },
        },
        update: {
          name: viewer.name ?? null,
          email: viewer.email ?? null,
          avatarUrl: viewer.avatarUrl ?? null,
          localUserId: userId,
        },
        create: {
          orgLinearId: linearOrgId,
          linearUserId: viewer.id,
          name: viewer.name ?? null,
          email: viewer.email ?? null,
          avatarUrl: viewer.avatarUrl ?? null,
          localUserId: userId,
        },
      });
    }
  });

  const redirectParams = new URLSearchParams({
    orgId: linearOrgId,
    organizationId: currentUser.organizationId!,
    status: "success",
  });

  if (viewer.id) {
    redirectParams.set("linearUserId", viewer.id);
  }

  return c.redirect(`/connected?${redirectParams.toString()}`, 302);
});

router.openapi(LinearStatusRoute, async (c) => {
  const userId = c.get("userId") as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  if (!user?.organizationId) {
    return c.json({
      connected: false,
      organizationId: null,
      linearOrgId: null,
      linearOrgName: null,
      installerUserId: null,
      updatedAt: null,
    });
  }

  const connection = await prisma.linearConnection.findUnique({
    where: { organizationId: user.organizationId },
  });

  return c.json({
    connected: Boolean(connection),
    organizationId: user.organizationId,
    linearOrgId: connection?.orgLinearId ?? null,
    linearOrgName: connection?.orgName ?? null,
    installerUserId: connection?.installerUserId ?? null,
    updatedAt: connection?.updatedAt.toISOString() ?? null,
  });
});

export default router;
