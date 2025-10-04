import { OpenAPIHono } from "@hono/zod-openapi";
import linearRouter from "@/server/modules/linear/linear.router";
import linearIssuesRouter from "@/server/modules/linear/linear-issues.router";
import linearSyncRouter from "@/server/modules/linear/linear-sync.router";
import zendeskRouter from "@/server/modules/zendesk/zendesk.router";
import postsRouter from "@/server/modules/posts/posts.router";

const router = new OpenAPIHono()
  .route("/linear", linearRouter)
  .route("/linear", linearIssuesRouter)
  .route("/linear", linearSyncRouter)
  .route("/zendesk", zendeskRouter)
  .route("/posts", postsRouter);

export default router;
