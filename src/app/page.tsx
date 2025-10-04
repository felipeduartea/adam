"use client";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { CircleDashed, ArrowRight } from "lucide-react";
import { GitHub } from "@/components/icons/github";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  const { data: session, isPending: loading } = authClient.useSession();
  const user = session?.user;

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/",
    });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-md shadow-sm"
        >
          <div className="flex flex-col items-start">
            {/* Icon Section */}
            <div className="bg-[#4b9466] text-white rounded-xl p-3 mb-6">
              <CircleDashed className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-1.5 mb-6">
              {/* App Name */}
              <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
                Adam
              </h1>

              {/* Subtitle */}
              <p className="text-base text-zinc-500">
                Adam integrates with Linear, GitHub and Zendesk to help you make better product decisions.
              </p>
            </div>

            {/* Action Button */}
            <div className="w-full">
              {user ? (
                <Button
                  size="lg"
                  variant="default"
                  className="w-full flex items-center justify-center gap-2"
                  asChild
                >
                  <Link href="/integrations">
                    <ArrowRight className="w-5 h-5" />
                    Go to Integrations
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={handleSignIn}
                  variant="secondary"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <GitHub className="w-5 h-5 fill-current" />
                  Login with GitHub
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
