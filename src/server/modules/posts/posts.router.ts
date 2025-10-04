import { z, createRoute } from "@hono/zod-openapi";

import { prisma } from "@/lib/prisma";
import { newOpenAPIHono } from "@/server/lib/router";
import { requireAuthentication } from "@/server/middleware";

// Response schemas
const PostSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string().nullable(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: z.object({
    name: z.string().nullable(),
    email: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }).optional(),
});

const GetPostsResponseSchema = z.array(PostSchema);

// Get all posts
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
  summary: `Get all posts`,
  tags: ["Posts"],
});

// Get user's own posts
const GetMyPostsRoute = createRoute({
  method: "get",
  path: "/my-posts",
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
  summary: `Get my posts`,
  tags: ["Posts"],
});

// Create a new post
const CreatePostRequestSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
});

const CreatePostRoute = createRoute({
  method: "post",
  path: "/",
  middleware: [requireAuthentication] as const,
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreatePostRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: PostSchema,
        },
      },
      description: "Post created successfully",
    },
  },
  summary: `Create a new post`,
  tags: ["Posts"],
});

// Update a post
const UpdatePostRequestSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
});

const UpdatePostRoute = createRoute({
  method: "patch",
  path: "/{id}",
  middleware: [requireAuthentication] as const,
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdatePostRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: PostSchema,
        },
      },
      description: "Post updated successfully",
    },
  },
  summary: `Update a post`,
  tags: ["Posts"],
});

// Delete a post
const DeletePostRoute = createRoute({
  method: "delete",
  path: "/{id}",
  middleware: [requireAuthentication] as const,
  request: {
    params: z.object({
      id: z.string().transform(Number),
    }),
  },
  responses: {
    204: {
      description: "Post deleted successfully",
    },
  },
  summary: `Delete a post`,
  tags: ["Posts"],
});

const router = newOpenAPIHono()
  // Get all posts with user info
  .openapi(GetPostsRoute, async (ctx) => {
    const posts = await prisma.post.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return ctx.json(posts, 200);
  })
  
  // Get current user's posts only
  .openapi(GetMyPostsRoute, async (ctx) => {
    const userId = ctx.get("userId");
    
    const posts = await prisma.post.findMany({
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return ctx.json(posts, 200);
  })
  
  // Create a new post
  .openapi(CreatePostRoute, async (ctx) => {
    const userId = ctx.get("userId");
    const body = ctx.req.valid("json");
    
    const post = await prisma.post.create({
      data: {
        title: body.title,
        content: body.content,
        userId,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
    
    return ctx.json(post, 201);
  })
  
  // Update a post (only if user owns it)
  .openapi(UpdatePostRoute, async (ctx) => {
    const userId = ctx.get("userId");
    const { id } = ctx.req.valid("param");
    const body = ctx.req.valid("json");
    
    // First, verify the post belongs to the user
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });
    
    if (!existingPost || existingPost.userId !== userId) {
      return ctx.json({ error: "Post not found or unauthorized" }, 404);
    }
    
    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
    
    return ctx.json(post, 200);
  })
  
  // Delete a post (only if user owns it)
  .openapi(DeletePostRoute, async (ctx) => {
    const userId = ctx.get("userId");
    const { id } = ctx.req.valid("param");
    
    // First, verify the post belongs to the user
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });
    
    if (!existingPost || existingPost.userId !== userId) {
      return ctx.json({ error: "Post not found or unauthorized" }, 404);
    }
    
    await prisma.post.delete({
      where: { id },
    });
    
    return ctx.body(null, 204);
  });

export default router;
