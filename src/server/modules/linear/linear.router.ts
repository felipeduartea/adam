import { createRoute, z } from "@hono/zod-openapi";

import { prisma } from "@/lib/prisma";
import { InternalServerError } from "@/server/errors";
import { newOpenAPIHono } from "@/server/lib/router";
import { requireAuthentication, Variables } from "@/server/middleware";

const LinearConnectRoute = createRoute({
  method: "get",
  path: "/connect",
  middleware: [requireAuthentication] as const,
  tags: ["Linear"],
  summary: "Handle Linear OAuth callback",
  request: {
    query: z.object({
      code: z.string().min(1),
    }),
  },
  responses: {
    302: {
      description: "Redirect back to the application",
    },
    400: {
      description: "Missing OAuth code",
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

function getEnvVar(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new InternalServerError(`Missing ${name} environment variable`);
  }
  return value;
}

const router = newOpenAPIHono<{ Variables: Variables }>();

router.openapi(LinearConnectRoute, async (c) => {
  const { code } = c.req.valid("query");

  if (!code) {
    return c.json({ error: "missing code" }, 400);
  }

  const clientId = getEnvVar("LINEAR_CLIENT_ID");
  const clientSecret = getEnvVar("LINEAR_CLIENT_SECRET");
  const redirectUri = getEnvVar("LINEAR_REDIRECT_URI");

  const tokenResponse = await fetch("https://api.linear.app/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
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
      query: `query { viewer { id name email organization { id name } } }`,
    }),
  });

  if (!viewerResponse.ok) {
    const errorText = await viewerResponse.text();
    return c.json({ error: errorText }, 500);
  }

  const viewerJson = (await viewerResponse.json()) as {
    data?: {
      viewer?: {
        organization?: {
          id?: string;
        } | null;
      } | null;
    };
  };

  const orgId = viewerJson.data?.viewer?.organization?.id ?? null;
  const redirectTarget = orgId ? `/connected?orgId=${encodeURIComponent(orgId)}` : "/connected?error=missing_org";

  if (orgId) {
    const userId = c.get("userId");
    const expiresAt =
      typeof tokenJson.expires_in === "number" ? new Date(Date.now() + tokenJson.expires_in * 1000) : null;

    // await prisma.linearConnection.upsert({
    //   where: {
    //     userId_orgId: {
    //       userId,
    //       orgId,
    //     },
    //   },
    //   update: {
    //     accessToken,
    //     refreshToken: tokenJson.refresh_token ?? null,
    //     expiresAt,
    //   },
    //   create: {
    //     userId,
    //     orgId,
    //     accessToken,
    //     refreshToken: tokenJson.refresh_token ?? null,
    //     expiresAt,
    //   },
    // });
  }

  return c.redirect(redirectTarget, 302);
});

export default router;
