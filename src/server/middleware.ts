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
    // Get cookie header from request
    const cookieHeader = c.req.header("cookie") || "";
    
    // Verify the session using Better Auth with the cookie
    const session = await auth.api.getSession({
      headers: new Headers({
        cookie: cookieHeader,
      }),
    });

    if (!session || !session.user) {
      throw new UnauthorizedError();
    }

    // Set user info in context for use in route handlers
    c.set("userId", session.user.id);
    c.set("userEmail", session.user.email);
    
    return next();
  } catch (error) {
    throw new UnauthorizedError();
  }
};
