import { createRoute, z } from "@hono/zod-openapi";
import { prisma } from "@/lib/prisma";
import { newOpenAPIHono } from "@/server/lib/router";
import { requireAuthentication, Variables } from "@/server/middleware";

const LinearIssuesRoute = createRoute({
  method: "get",
  path: "/issues",
  middleware: [requireAuthentication] as const,
  tags: ["Linear"],
  summary: "Get all Linear issues for the user's organization",
  request: {
    query: z.object({
      teamId: z.string().optional(),
      status: z.string().optional(),
      limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
    }),
  },
  responses: {
    200: {
      description: "List of Linear issues",
      content: {
        "application/json": {
          schema: z.object({
            issues: z.array(
              z.object({
                id: z.string(),
                identifier: z.string(),
                title: z.string(),
                description: z.string().nullable(),
                state: z.object({
                  id: z.string(),
                  name: z.string(),
                  type: z.string(),
                }).nullable(),
                priority: z.number().nullable(),
                assignee: z
                  .object({
                    id: z.string(),
                    name: z.string(),
                    email: z.string().nullable(),
                  })
                  .nullable(),
                team: z.object({
                  id: z.string(),
                  name: z.string(),
                  key: z.string(),
                }),
                createdAt: z.string(),
                updatedAt: z.string(),
                url: z.string(),
              }),
            ),
            totalCount: z.number(),
          }),
        },
      },
    },
    404: {
      description: "Linear connection not found",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
    500: {
      description: "Failed to fetch issues from Linear",
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

const router = newOpenAPIHono<{ Variables: Variables }>();

router.openapi(LinearIssuesRoute, async (c) => {
  const userId = c.get("userId");
  const { teamId, status, limit } = c.req.valid("query");

  // Get user's organization
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  if (!user?.organizationId) {
    return c.json({ error: "User not associated with an organization" }, 404);
  }

  // Get Linear connection for the organization
  const linearConnection = await prisma.linearConnection.findUnique({
    where: { organizationId: user.organizationId },
    select: {
      accessToken: true,
      orgLinearId: true,
      orgName: true,
    },
  });

  if (!linearConnection) {
    return c.json({ error: "Linear not connected. Please connect Linear first." }, 404);
  }

  // Build GraphQL query
  const filters: string[] = [];
  if (teamId) {
    filters.push(`team: { id: { eq: "${teamId}" } }`);
  }
  if (status) {
    filters.push(`state: { name: { eq: "${status}" } }`);
  }

  const filterString = filters.length > 0 ? `filter: { ${filters.join(", ")} }` : "";

  const query = `
    query GetIssues {
      issues(first: ${limit}, ${filterString}) {
        nodes {
          id
          identifier
          title
          description
          state {
            id
            name
            type
          }
          priority
          priorityLabel
          assignee {
            id
            name
            email
          }
          team {
            id
            name
            key
          }
          createdAt
          updatedAt
          url
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  try {
    // Call Linear GraphQL API
    const response = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: linearConnection.accessToken,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Linear API error:", errorText);
      return c.json({ error: "Failed to fetch issues from Linear" }, 500);
    }

    const data = (await response.json()) as {
      data?: {
        issues?: {
          nodes?: Array<{
            id: string;
            identifier: string;
            title: string;
            description?: string | null;
            state?: {
              id: string;
              name: string;
              type: string;
            } | null;
            priority?: number | null;
            assignee?: {
              id: string;
              name: string;
              email?: string | null;
            } | null;
            team: {
              id: string;
              name: string;
              key: string;
            };
            createdAt: string;
            updatedAt: string;
            url: string;
          }>;
        };
      };
      errors?: Array<{ message?: string }>;
    };

    if (data.errors) {
      const errorMessage = data.errors.map((err) => err.message).join(", ");
      return c.json({ error: errorMessage }, 500);
    }

    const rawIssues = data.data?.issues?.nodes || [];

    // Normalize the data to match the schema (convert undefined to null)
    const issues = rawIssues.map((issue) => ({
      ...issue,
      description: issue.description ?? null,
      state: issue.state ?? null,
      priority: issue.priority ?? null,
      assignee: issue.assignee
        ? {
            id: issue.assignee.id,
            name: issue.assignee.name,
            email: issue.assignee.email ?? null,
          }
        : null,
    }));

    return c.json(
      {
        issues,
        totalCount: issues.length,
      },
      200,
    );
  } catch (error) {
    console.error("Error fetching Linear issues:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default router;

