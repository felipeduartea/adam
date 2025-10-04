import { MiddlewareHandler } from "hono";
import { UnauthorizedError } from "./errors";
import { auth } from "@/lib/auth";

export type Variables = {
  userId: string;
  userEmail: string | undefined;
};

/**
 * Middleware to require authentication via Better Auth
 * Extracts user info from the session cookie and makes it available in context
 */
export const requireAuthentication: MiddlewareHandler<{
  Variables: Variables;
}> = async (c, next) => {
  try {
    // Verify the session using Better Auth with incoming request headers
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session || !session.user) {
      console.warn("Better Auth session missing", {
        hasCookie: c.req.header("cookie")?.length ?? 0,
        hasAuthHeader: Boolean(c.req.header("authorization")),
      });
      throw new UnauthorizedError();
    }

    // Set user info in context for use in route handlers
    c.set("userId", session.user.id);
    c.set("userEmail", session.user.email);
    
    return next();
  } catch (error) {
    console.error("Authentication middleware failed", error);
    throw new UnauthorizedError();
  }
};
