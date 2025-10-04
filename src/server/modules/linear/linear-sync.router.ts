import { createRoute, z } from "@hono/zod-openapi";
import { prisma } from "@/lib/prisma";
import { newOpenAPIHono } from "@/server/lib/router";
import { requireAuthentication, Variables } from "@/server/middleware";
import { IssueStatus } from "@/generated/prisma/client";

const LinearSyncRoute = createRoute({
  method: "post",
  path: "/sync",
  middleware: [requireAuthentication] as const,
  tags: ["Linear"],
  summary: "Sync Linear data (projects, sprints/cycles, issues) to database",
  responses: {
    200: {
      description: "Sync completed successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            synced: z.object({
              projects: z.number(),
              sprints: z.number(),
              issues: z.number(),
            }),
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
      description: "Sync failed",
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

router.openapi(LinearSyncRoute, async (c) => {
  const userId = c.get("userId");

  // Get user's organization
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true },
  });

  if (!user?.organizationId) {
    return c.json({ error: "User not associated with an organization" }, 404);
  }

  // Get Linear connection
  const linearConnection = await prisma.linearConnection.findUnique({
    where: { organizationId: user.organizationId },
    select: {
      accessToken: true,
      orgLinearId: true,
    },
  });

  if (!linearConnection) {
    return c.json({ error: "Linear not connected" }, 404);
  }

  try {
    let projectsCount = 0;
    let sprintsCount = 0;
    let issuesCount = 0;

    // Step 1: Fetch and sync projects
    const projectsData = await fetchLinearProjects(linearConnection.accessToken);

    for (const linearProject of projectsData) {
      const project = await prisma.project.upsert({
        where: {
          linearProjectId: linearProject.id,
        },
        update: {
          title: linearProject.name,
          description: linearProject.description,
          start_date: linearProject.startDate ? new Date(linearProject.startDate) : null,
          due_date: linearProject.targetDate ? new Date(linearProject.targetDate) : null,
        },
        create: {
          organizationId: user.organizationId!,
          linearProjectId: linearProject.id,
          title: linearProject.name,
          description: linearProject.description,
          start_date: linearProject.startDate ? new Date(linearProject.startDate) : null,
          due_date: linearProject.targetDate ? new Date(linearProject.targetDate) : null,
        },
      });
      projectsCount++;

      // Step 2: Fetch and sync cycles (sprints) for this project
      const cyclesData = await fetchLinearCycles(linearConnection.accessToken, linearProject.id);

      for (const linearCycle of cyclesData) {
        await prisma.sprint.upsert({
          where: {
            linearCycleId: linearCycle.id,
          },
          update: {
            title: linearCycle.name,
            description: linearCycle.description,
            start_date: linearCycle.startsAt ? new Date(linearCycle.startsAt) : null,
            due_date: linearCycle.endsAt ? new Date(linearCycle.endsAt) : null,
          },
          create: {
            projectId: project.id,
            linearCycleId: linearCycle.id,
            title: linearCycle.name,
            description: linearCycle.description,
            start_date: linearCycle.startsAt ? new Date(linearCycle.startsAt) : null,
            due_date: linearCycle.endsAt ? new Date(linearCycle.endsAt) : null,
          },
        });
        sprintsCount++;
      }
    }

    // Step 3: Fetch and sync all issues
    const issuesData = await fetchLinearIssues(linearConnection.accessToken);

    for (const linearIssue of issuesData) {
      // Find the project by linearProjectId
      const project = linearIssue.project?.id
        ? await prisma.project.findUnique({
            where: { linearProjectId: linearIssue.project.id },
          })
        : null;

      // Find the sprint by linearCycleId
      const sprint = linearIssue.cycle?.id
        ? await prisma.sprint.findUnique({
            where: { linearCycleId: linearIssue.cycle.id },
          })
        : null;

      // Find assignee by Linear user ID
      const assignee = linearIssue.assignee?.id
        ? await prisma.linearUser.findUnique({
            where: {
              orgLinearId_linearUserId: {
                orgLinearId: linearConnection.orgLinearId,
                linearUserId: linearIssue.assignee.id,
              },
            },
            select: { localUserId: true },
          })
        : null;

      // Map Linear state to your IssueStatus enum
      const status = mapLinearStateToStatus(linearIssue.state?.type);

      if (project) {
        await prisma.issue.upsert({
          where: {
            linearIssueId: linearIssue.id,
          },
          update: {
            title: linearIssue.title,
            description: linearIssue.description,
            status,
            sprintId: sprint?.id ?? null,
            assigneeId: assignee?.localUserId ?? null,
            assigneeLinearUserId: linearIssue.assignee?.id ?? null,
            sprint_date: linearIssue.updatedAt ? new Date(linearIssue.updatedAt) : null,
          },
          create: {
            projectId: project.id,
            linearIssueId: linearIssue.id,
            title: linearIssue.title,
            description: linearIssue.description,
            status,
            sprintId: sprint?.id ?? null,
            assigneeId: assignee?.localUserId ?? null,
            assigneeLinearUserId: linearIssue.assignee?.id ?? null,
            sprint_date: linearIssue.updatedAt ? new Date(linearIssue.updatedAt) : null,
          },
        });
        issuesCount++;
      }
    }

    return c.json(
      {
        success: true,
        synced: {
          projects: projectsCount,
          sprints: sprintsCount,
          issues: issuesCount,
        },
      },
      200,
    );
  } catch (error) {
    console.error("Linear sync error:", error);
    return c.json({ error: "Failed to sync Linear data" }, 500);
  }
});

export default router;

// Helper function to fetch Linear projects
async function fetchLinearProjects(accessToken: string) {
  const query = `
    query GetProjects {
      projects(first: 100) {
        nodes {
          id
          name
          description
          startDate
          targetDate
          state
        }
      }
    }
  `;

  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: JSON.stringify({ query }),
  });

  const data = (await response.json()) as {
    data?: {
      projects?: {
        nodes?: Array<{
          id: string;
          name: string;
          description?: string | null;
          startDate?: string | null;
          targetDate?: string | null;
          state: string;
        }>;
      };
    };
  };

  return data.data?.projects?.nodes || [];
}

// Helper function to fetch Linear cycles for a project
async function fetchLinearCycles(accessToken: string, projectId: string) {
  const query = `
    query GetCycles($projectId: ID!) {
      project(id: $projectId) {
        projectMilestones {
          nodes {
            id
            name
            description
          }
        }
      }
      cycles(first: 100) {
        nodes {
          id
          name
          description
          startsAt
          endsAt
        }
      }
    }
  `;

  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: JSON.stringify({ query, variables: { projectId } }),
  });

  const data = (await response.json()) as {
    data?: {
      cycles?: {
        nodes?: Array<{
          id: string;
          name: string;
          description?: string | null;
          startsAt?: string | null;
          endsAt?: string | null;
        }>;
      };
    };
  };

  return data.data?.cycles?.nodes || [];
}

// Helper function to fetch Linear issues
async function fetchLinearIssues(accessToken: string) {
  const query = `
    query GetIssues {
      issues(first: 250) {
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
          project {
            id
            name
          }
          cycle {
            id
            name
          }
          assignee {
            id
            name
            email
          }
          createdAt
          updatedAt
        }
      }
    }
  `;

  const response = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: accessToken,
    },
    body: JSON.stringify({ query }),
  });

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
          project?: {
            id: string;
            name: string;
          } | null;
          cycle?: {
            id: string;
            name: string;
          } | null;
          assignee?: {
            id: string;
            name: string;
            email?: string | null;
          } | null;
          createdAt: string;
          updatedAt: string;
        }>;
      };
    };
  };

  return data.data?.issues?.nodes || [];
}

// Map Linear state types to your IssueStatus enum
function mapLinearStateToStatus(stateType?: string): IssueStatus {
  switch (stateType) {
    case "triage":
    case "backlog":
    case "unstarted":
      return IssueStatus.TODO;
    case "started":
      return IssueStatus.IN_PROGRESS;
    case "completed":
      return IssueStatus.DONE;
    case "canceled":
      return IssueStatus.CANCELLED;
    default:
      return IssueStatus.TODO;
  }
}

