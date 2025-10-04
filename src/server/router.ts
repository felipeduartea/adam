import { OpenAPIHono } from "@hono/zod-openapi";
import linearRouter from "@/server/modules/linear/linear.router";
import zendeskRouter from "@/server/modules/zendesk/zendesk.router";
import postsRouter from "@/server/modules/posts/posts.router";

const router = new OpenAPIHono()
  .route("/linear", linearRouter)
  .route("/zendesk", zendeskRouter)
  .route("/posts", postsRouter);

export default router;
