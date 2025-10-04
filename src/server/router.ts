import { OpenAPIHono } from "@hono/zod-openapi";
import linearRouter from "@/server/modules/linear/linear.router";
import zendeskRouter from "@/server/modules/zendesk/zendesk.router";

const router = new OpenAPIHono().route("/linear", linearRouter).route("/zendesk", zendeskRouter);

export default router;
