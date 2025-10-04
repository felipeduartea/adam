import { createServerClient } from "@supabase/ssr";
import { MiddlewareHandler } from "hono";
import { UnauthorizedError } from "./errors";

export type Variables = {
  userId: string;
  userEmail: string | undefined;
};

/**
 * Middleware to require authentication via Supabase JWT
 * Extracts user info from the JWT and makes it available in context
 */
export const requireAuthentication: MiddlewareHandler<{
  Variables: Variables;
}> = async (c, next) => {
  // Get authorization header
  const authHeader = c.req.header("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedError();
  }

  const token = authHeader.substring(7);

  // Create Supabase client to verify the token
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = c.req.header("cookie");
          if (!cookies) return [];
          return cookies.split(";").map((cookie) => {
            const [name, ...rest] = cookie.trim().split("=");
            return { name, value: rest.join("=") };
          });
        },
        setAll() {
          // No-op for API routes
        },
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  // Verify the user
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError();
  }

  // Set user info in context for use in route handlers
  c.set("userId", user.id);
  c.set("userEmail", user.email);
  
  return next();
};
