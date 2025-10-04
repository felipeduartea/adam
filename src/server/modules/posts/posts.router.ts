import { z, createRoute } from "@hono/zod-openapi";

import { prisma } from "@/lib/prisma";
import { newOpenAPIHono } from "@/server/lib/router";
import { requireAuthentication } from "@/server/middleware";

const GetPostsResponseSchema = z.array(
  z.object({
    id: z.number(),
    title: z.string(),
    content: z.string().nullable(),
  })
);

const GetPostsRoute = createRoute({
  method: "get",
  path: "/",
  middleware: [requireAuthentication] as const,
  responses: {
    200: {
      content: {
        "application/json": {
          schema: GetPostsResponseSchema,
        },
      },
      description: "Success",
    },
  },
  summary: `Get Posts`,
  tags: ["Posts"],
});

const router = newOpenAPIHono().openapi(
  GetPostsRoute,
  async (ctx) => {
    const posts = await prisma.post.findMany();
    return ctx.json(posts, 200);
  }
);

export default router;
