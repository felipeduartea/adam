"use client";
import { authClient } from "@/lib/auth-client";
import { apiClient, type Post } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session, isPending: loading } = authClient.useSession();
  const user = session?.user;
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch posts when user is authenticated
  useEffect(() => {
    if (user) {
      fetchPosts();
    } else {
      setPosts([]);
    }
  }, [user]);

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      setError(null);
      const data = await apiClient.posts.getAll();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
      console.error("Error fetching posts:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/",
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
            {loading ? (
              <Skeleton className="h-10 w-24" />
            ) : user ? (
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {user.name || user.email}
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  Sign out
                </Button>
              </div>
            ) : (
              <Button onClick={handleSignIn}>Sign in with GitHub</Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {!user ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              Sign in to view and create posts
            </p>
          </div>
        ) : (
          <>
            {/* Posts List */}
            <div className="space-y-4">
              {postsLoading ? (
                <>
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800">{error}</p>
                  <Button
                    variant="outline"
                    onClick={fetchPosts}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <p className="text-gray-600">No posts yet. Be the first!</p>
                </div>
              ) : (
                posts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {post.author?.image && (
                          <img
                            src={post.author.image}
                            alt={post.author.name || "User"}
                            className="w-10 h-10 rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {post.author?.name || post.author?.email || "Unknown"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(post.createdAt)}
                          </p>
                        </div>
                      </div>
                      {post.authorId === user.id && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Your post
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h2>
                    {post.content && (
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {post.content}
                      </p>
                    )}
                  </article>
                ))
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
