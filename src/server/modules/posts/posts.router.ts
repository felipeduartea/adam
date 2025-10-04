import { createRoute, z } from "@hono/zod-openapi";
import { prisma } from "@/lib/prisma";
import { newOpenAPIHono } from "@/server/lib/router";
import { requireAuthentication, Variables } from "@/server/middleware";

// Schemas
const PostSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string().nullable(),
  authorId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  author: z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    image: z.string().nullable(),
  }).optional(),
});

const CreatePostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
});

const UpdatePostSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
});

// Routes
const GetAllPostsRoute = createRoute({
  method: "get",
  path: "/",
  middleware: [requireAuthentication] as const,
  tags: ["Posts"],
  summary: "Get all posts",
  responses: {
    200: {
      description: "List of posts",
      content: {
        "application/json": {
          schema: z.array(PostSchema),
        },
      },
    },
  },
});

const GetMyPostsRoute = createRoute({
  method: "get",
  path: "/my-posts",
  middleware: [requireAuthentication] as const,
  tags: ["Posts"],
  summary: "Get current user's posts",
  responses: {
    200: {
      description: "List of user's posts",
      content: {
        "application/json": {
          schema: z.array(PostSchema),
        },
      },
    },
  },
});

const CreatePostRoute = createRoute({
  method: "post",
  path: "/",
  middleware: [requireAuthentication] as const,
  tags: ["Posts"],
  summary: "Create a new post",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreatePostSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Post created",
      content: {
        "application/json": {
          schema: PostSchema,
        },
      },
    },
  },
});

const UpdatePostRoute = createRoute({
  method: "patch",
  path: "/{id}",
  middleware: [requireAuthentication] as const,
  tags: ["Posts"],
  summary: "Update a post",
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdatePostSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Post updated",
      content: {
        "application/json": {
          schema: PostSchema,
        },
      },
    },
    404: {
      description: "Post not found",
    },
  },
});

const DeletePostRoute = createRoute({
  method: "delete",
  path: "/{id}",
  middleware: [requireAuthentication] as const,
  tags: ["Posts"],
  summary: "Delete a post",
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
  },
  responses: {
    204: {
      description: "Post deleted",
    },
    404: {
      description: "Post not found",
    },
  },
});

// Router implementation
const router = newOpenAPIHono<{ Variables: Variables }>();

// Get all posts
router.openapi(GetAllPostsRoute, async (c) => {
  const posts = await prisma.post.findMany({
    include: {
      author: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return c.json(posts);
});

// Get my posts
router.openapi(GetMyPostsRoute, async (c) => {
  const userId = c.get("userId");

  const posts = await prisma.post.findMany({
    where: {
      authorId: userId,
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return c.json(posts);
});

// Create post
router.openapi(CreatePostRoute, async (c) => {
  const userId = c.get("userId");
  const body = c.req.valid("json");

  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content || null,
      authorId: userId,
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return c.json(post, 201);
});

// Update post
router.openapi(UpdatePostRoute, async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  // Check if post exists and belongs to user
  const existingPost = await prisma.post.findUnique({
    where: { id },
  });

  if (!existingPost) {
    return c.json({ error: "Post not found" }, 404);
  }

  if (existingPost.authorId !== userId) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  const post = await prisma.post.update({
    where: { id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.content !== undefined && { content: body.content || null }),
    },
    include: {
      author: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  return c.json(post);
});

// Delete post
router.openapi(DeletePostRoute, async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.valid("param");

  // Check if post exists and belongs to user
  const existingPost = await prisma.post.findUnique({
    where: { id },
  });

  if (!existingPost) {
    return c.json({ error: "Post not found" }, 404);
  }

  if (existingPost.authorId !== userId) {
    return c.json({ error: "Unauthorized" }, 403);
  }

  await prisma.post.delete({
    where: { id },
  });

  return c.body(null, 204);
});

export default router;

