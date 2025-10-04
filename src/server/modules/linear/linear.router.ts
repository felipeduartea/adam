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
  const userId = c.get("userId");

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, organizationId: true },
  });

  if (!currentUser?.organizationId) {
    return c.json({ error: "Authenticated user is not associated with an organization" }, 400);
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
    organizationId: currentUser.organizationId,
    status: "success",
  });

  if (viewer.id) {
    redirectParams.set("linearUserId", viewer.id);
  }

  return c.redirect(`/connected?${redirectParams.toString()}`, 302);
});

export default router;
