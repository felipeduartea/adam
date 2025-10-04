import { OpenAPIHono } from "@hono/zod-openapi";
import postsRouter from "@/server/modules/posts/posts.router";

const router = new OpenAPIHono().route("/posts", postsRouter);

export default router;
