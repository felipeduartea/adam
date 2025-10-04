/**
 * API Client for authenticated requests to your Hono API
 * Automatically includes Better Auth session token in requests
 */

import { authClient } from "@/lib/auth-client";

class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = "/api";
  }

  /**
   * Make an authenticated request to your API
   * Better Auth stores session in cookies, so we don't need to manually pass the token
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
      credentials: "include", // Include cookies for Better Auth session
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("API Error:", {
        status: response.status,
        statusText: response.statusText,
        endpoint,
        error,
      });
      throw new Error(error.message || `API request failed: ${response.status} ${response.statusText}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  // Posts endpoints
  posts = {
    getAll: () => this.request<Post[]>("/posts"),
    
    getMy: () => this.request<Post[]>("/posts/my-posts"),
    
    create: (data: CreatePostData) =>
      this.request<Post>("/posts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    
    update: (id: number, data: UpdatePostData) =>
      this.request<Post>(`/posts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    
    delete: (id: number) =>
      this.request<null>(`/posts/${id}`, {
        method: "DELETE",
      }),
  };
}

// Types
export interface Post {
  id: number;
  title: string;
  content: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

export interface CreatePostData {
  title: string;
  content?: string;
}

export interface UpdatePostData {
  title?: string;
  content?: string;
}

// Export singleton instance
export const apiClient = new APIClient();

