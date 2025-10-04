import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";

const LinearIssuesInput = z.object({
  organizationId: z.string().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]).optional(),
  projectId: z.string().optional(),
  sprintId: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
});

const LinearIssuesOutput = z.object({
  summary: z.string(),
  issues: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().nullable(),
      status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]),
      priority: z.number().nullable(),
      estimate: z.number().nullable(),
      projectName: z.string().nullable(),
      sprintName: z.string().nullable(),
      createdAt: z.string(),
      updatedAt: z.string(),
    }),
  ),
  totalIssues: z.number(),
  byStatus: z.record(z.number()),
});

export const linearIssuesTool = createTool({
  id: "linear-issues",
  description:
    "Fetch real Linear issues from the database. Can filter by status, project, sprint, or organization.",
  inputSchema: LinearIssuesInput,
  outputSchema: LinearIssuesOutput,
  execute: async ({ context }) => {
    const { organizationId, status, projectId, sprintId, limit } = context;

    try {
      // Build where clause
      const where: any = {};

      if (organizationId) {
        where.project = {
          organizationId,
        };
      }

      if (status) {
        where.status = status;
      }

      if (projectId) {
        where.projectId = projectId;
      }

      if (sprintId) {
        where.sprintId = sprintId;
      }

      // Fetch issues from database
      const issues = await prisma.issue.findMany({
        where,
        orderBy: {
          updatedAt: "desc",
        },
        take: limit,
        include: {
          project: {
            select: {
              name: true,
            },
          },
          sprint: {
            select: {
              name: true,
            },
          },
        },
      });

      if (issues.length === 0) {
        return {
          summary: `No Linear issues found in the database. Please ensure Linear is connected and synced.`,
          issues: [],
          totalIssues: 0,
          byStatus: {},
        };
      }

      // Count by status
      const byStatus: Record<string, number> = {};
      issues.forEach((issue: typeof issues[number]) => {
        byStatus[issue.status] = (byStatus[issue.status] || 0) + 1;
      });

      // Map to output format
      const mappedIssues = issues.map((issue: typeof issues[number]) => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        status: issue.status,
        priority: issue.priority,
        estimate: issue.estimate,
        projectName: issue.project?.name ?? null,
        sprintName: issue.sprint?.name ?? null,
        createdAt: issue.createdAt.toISOString(),
        updatedAt: issue.updatedAt.toISOString(),
      }));

      const statusFilter = status ? ` with status ${status}` : "";
      const projectFilter = projectId ? ` in project ${projectId}` : "";
      const sprintFilter = sprintId ? ` in sprint ${sprintId}` : "";

      return {
        summary: `Found ${issues.length} Linear issues${statusFilter}${projectFilter}${sprintFilter}`,
        issues: mappedIssues,
        totalIssues: issues.length,
        byStatus,
      };
    } catch (error) {
      console.error("Error fetching Linear issues:", error);
      return {
        summary: `Error fetching issues: ${error instanceof Error ? error.message : "Unknown error"}`,
        issues: [],
        totalIssues: 0,
        byStatus: {},
      };
    }
  },
});

