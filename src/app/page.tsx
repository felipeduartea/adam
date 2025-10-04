"use client";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { CircleDashed, ArrowRight, MoreVertical, LogOut } from "lucide-react";
import { GitHub } from "@/components/icons/github";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const { data: session, isPending: loading } = authClient.useSession();
  const user = session?.user;

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/",
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-md shadow-sm"
        >
          {/* Dropdown Menu - Only show when user is logged in */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 h-8 w-8"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

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
