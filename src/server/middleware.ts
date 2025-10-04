import { auth } from "@/lib/auth";
import { MiddlewareHandler } from "hono";
import { UnauthorizedError } from "./errors";

export type Variables = {
  user: typeof auth.api.getSession extends (
    ...args: unknown[]
  ) => Promise<{ user: infer U } | null>
    ? U
    : unknown;
  session: typeof auth.api.getSession extends (
    ...args: unknown[]
  ) => Promise<{ session: infer S } | null>
    ? S
    : unknown;
};

export const requireAuthentication: MiddlewareHandler<{
  Variables: Variables;
}> = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    throw new UnauthorizedError();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
};
