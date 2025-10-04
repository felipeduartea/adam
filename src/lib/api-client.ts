/**
 * API Client for authenticated requests to your Hono API
 * Automatically includes Supabase JWT token in requests
 */

import { createClient } from "@/lib/supabase/client";

class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = "/api";
  }

  /**
   * Get the current access token from Supabase
   */
  private async getAccessToken(): Promise<string | null> {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  /**
   * Make an authenticated request to your API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "API request failed");
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
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
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

