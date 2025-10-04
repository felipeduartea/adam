"use client";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <div className="p-4">
      <div className="p-5 border-zinc-200 border rounded-md max-w-2xl mx-auto">
        {isPending ? (
          <Skeleton className="h-[36px] w-full" />
        ) : session ? (
          <div>
            <p className="mb-2">Signed in as {session.user?.name}</p>
            <Button variant="outline" onClick={() => authClient.signOut()}>
              Sign out
            </Button>
          </div>
        ) : (
          <Button
            onClick={async () => {
              await authClient.signIn.social({
                provider: "github",
              });
            }}
          >
            Sign in with GitHub
          </Button>
        )}
      </div>
    </div>
  );
}
