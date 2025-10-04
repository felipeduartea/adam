import { OpenAPIHono } from "@hono/zod-openapi";

export function newOpenAPIHono<T extends { Variables: Record<string, unknown> }>() {
  const router = new OpenAPIHono<T>({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json(
          {
            code: 400,
            message: "Validation Error",
            errorCode: "VALIDATION_ERROR",
            errors: result.error.flatten().fieldErrors,
          },
          400,
        );
      }
    },
  });

  return router;
}
