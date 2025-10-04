# Supabase Auth + Prisma + Hono Setup Guide

This guide explains how to use Supabase Auth with your own Prisma-powered API.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Your App                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐      ┌──────────────┐     ┌─────────────┐ │
│  │   Next.js   │      │   Hono API   │     │   Prisma    │ │
│  │  Frontend   │─────▶│  (Your API)  │────▶│   Client    │ │
│  └─────────────┘      └──────────────┘     └─────────────┘ │
│         │                     │                     │        │
│         │                     │                     │        │
│         ▼                     ▼                     ▼        │
│  ┌─────────────┐      ┌──────────────┐     ┌─────────────┐ │
│  │  Supabase   │      │  JWT Verify  │     │  Postgres   │ │
│  │Auth Client  │      │  Middleware  │     │  Database   │ │
│  └─────────────┘      └──────────────┘     └─────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Supabase      │
                    │  (Auth Service) │
                    └─────────────────┘
```

## ✅ What You're Using

- **Supabase Auth**: Authentication only (login, OAuth, JWT verification)
- **Your Hono API**: All business logic and authorization
- **Prisma**: Database queries and schema management
- **Direct Postgres**: Connect to Supabase's PostgreSQL database

## ❌ What You're NOT Using

- ~~Supabase auto-generated API~~ (bypassed completely)
- ~~Supabase client for data fetching~~ (only for auth)

---

## Setup Instructions

### 1. Push the Prisma Schema

The database schema is managed through Prisma. To sync it:

```bash
# Push schema changes (bypasses shadow database)
npm run db:push

# Or directly:
npx prisma db push
```

This will:
- Create `profiles`, `posts`, `organizations`, and `organization_memberships` tables
- Set up foreign keys to `auth.users`
- Auto-generate TypeScript types

### 2. Apply RLS Policies

RLS policies are managed separately via Supabase SQL Editor:

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Copy contents from:
   - `prisma/migrations/20251004183525_supabase_auth_setup/migration.sql` (lines 54-163 for initial RLS)
   - `supabase/migrations/20251004200000_add_organization_rls_policies.sql` (for organization RLS)
3. Paste and click "Run"

**Why separate?** Prisma can't access Supabase's `auth` schema, so we manage RLS policies as SQL files.

### 3. Configure Environment Variables

Make sure your `.env` has:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Database (from Supabase)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### 4. Test Your Setup

Start your development server:

```bash
npm run dev
```

Then visit `http://localhost:3000` and sign in with GitHub. Your profile should be automatically created!

---

## How It Works

### Authentication Flow

1. **User logs in** via GitHub OAuth (handled by Supabase)
2. **Supabase returns JWT** with user info
3. **Frontend stores JWT** in cookies/localStorage
4. **Frontend calls your API** with JWT in Authorization header
5. **API middleware verifies JWT** using Supabase
6. **API extracts user ID** from verified JWT
7. **API uses Prisma** to query database with user context

### Data Flow

```typescript
// 1. User signs in with GitHub
await supabase.auth.signInWithOAuth({ provider: 'github' })

// 2. Frontend makes authenticated API call
const response = await apiClient.posts.create({
  title: "Hello World",
  content: "My first post"
})

// 3. API middleware extracts userId from JWT
// (automatically handled by requireAuthentication middleware)

// 4. API creates post with Prisma
const post = await prisma.post.create({
  data: {
    title: body.title,
    content: body.content,
    userId: userId, // From JWT
  },
})
```

---

## Usage Examples

### Frontend: Making API Calls

```typescript
import { apiClient } from "@/lib/api-client";

// Get all posts
const posts = await apiClient.posts.getAll();

// Get my posts only
const myPosts = await apiClient.posts.getMy();

// Create a post
const newPost = await apiClient.posts.create({
  title: "My Post",
  content: "Hello world!",
});

// Update a post
const updated = await apiClient.posts.update(1, {
  title: "Updated Title",
});

// Delete a post
await apiClient.posts.delete(1);
```

### Backend: Creating Protected Endpoints

```typescript
import { requireAuthentication } from "@/server/middleware";
import { prisma } from "@/lib/prisma";

const router = newOpenAPIHono()
  .openapi(MyRoute, async (ctx) => {
    // Get authenticated user ID from context
    const userId = ctx.get("userId");
    
    // Use Prisma to query with user context
    const userPosts = await prisma.post.findMany({
      where: { userId },
    });
    
    return ctx.json(userPosts);
  });
```

### Backend: Creating a New Resource

```typescript
// Example: Creating a comments table

// 1. Add to Prisma schema
model Comment {
  id        Int       @id @default(autoincrement())
  content   String
  postId    Int       @map("post_id")
  userId    String    @map("user_id") @db.Uuid
  createdAt DateTime  @default(now()) @map("created_at")
  
  post      Post      @relation(fields: [postId], references: [id])
  user      Profile   @relation(fields: [userId], references: [id])
  
  @@map("comments")
}

// 2. Run migration in Supabase SQL Editor
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Users can create their own comments
CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Generate Prisma client
npx prisma generate

// 4. Use in your API
const comment = await prisma.comment.create({
  data: {
    content: "Great post!",
    postId: 1,
    userId: ctx.get("userId"),
  },
});
```

---

## Key Concepts

### 1. **Profiles Table**

The `profiles` table is your "extended user profile":
- Primary key is the user's UUID from `auth.users`
- Store additional user data here (name, avatar, bio, etc.)
- Automatically created when user signs up (via trigger)

### 2. **User ID References**

All your tables should reference users via UUID:

```typescript
model Post {
  userId String @db.Uuid  // Always UUID
  user   Profile @relation(fields: [userId], references: [id])
}
```

### 3. **JWT Verification**

Your middleware verifies JWTs and extracts user info:

```typescript
// In your API routes, you always have access to:
const userId = ctx.get("userId");       // User's UUID
const userEmail = ctx.get("userEmail"); // User's email
```

### 4. **Authorization vs Authentication**

- **Authentication**: "Who are you?" → Handled by Supabase
- **Authorization**: "What can you do?" → Handled by YOUR API

Your API enforces ownership:

```typescript
// Only allow users to update their own posts
const post = await prisma.post.findUnique({ where: { id } });
if (post.userId !== ctx.get("userId")) {
  return ctx.json({ error: "Unauthorized" }, 403);
}
```

### 5. **Row Level Security (RLS)**

RLS is enabled as a **safety net**, but your API handles most authorization:

- RLS policies run at the database level
- Useful if you ever use Supabase client directly
- Protects against misconfiguration

---

## Database Schema

```sql
auth.users (Supabase managed)
├── id (UUID)
├── email
├── raw_user_meta_data (JSON with OAuth info)
└── ...

public.profiles (Your table)
├── id (UUID) → references auth.users(id)
├── email
├── name
├── avatar_url
└── posts[]

public.posts (Your table)
├── id (SERIAL)
├── title
├── content
├── user_id (UUID) → references auth.users(id)
└── created_at
```

---

## API Endpoints

Your Hono API exposes these endpoints:

### Posts
- `GET /api/posts` - Get all posts (with user info)
- `GET /api/posts/my-posts` - Get authenticated user's posts
- `POST /api/posts` - Create a new post
- `PATCH /api/posts/:id` - Update a post (if owned by user)
- `DELETE /api/posts/:id` - Delete a post (if owned by user)

### API Documentation
- `GET /api` - Scalar API documentation

---

## Troubleshooting

### "User not authenticated" error

Make sure you're passing the JWT token:

```typescript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

fetch('/api/posts', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### Foreign key constraint errors

Make sure the user has a profile:

```sql
-- Check if profile exists
SELECT * FROM profiles WHERE id = 'user-uuid';

-- Create profile manually if needed
INSERT INTO profiles (id, email) 
VALUES ('user-uuid', 'user@example.com');
```

### Prisma type errors after schema changes

Regenerate the Prisma client:

```bash
npx prisma generate
```

---

## Benefits of This Approach

✅ **Full control** over your API and business logic  
✅ **Type-safe** with Prisma  
✅ **Fast** - direct database queries, no extra HTTP calls  
✅ **Flexible** - add any custom logic or tables  
✅ **Secure** - JWT verification + your authorization rules  
✅ **Scalable** - standard REST API architecture  

---

## Making Schema Changes

When you make changes to your Prisma schema:

```bash
# 1. Update prisma/schema.prisma

# 2. Push changes to database
npm run db:push

# 3. Add RLS policies (if needed) via Supabase SQL Editor
```

### Example: Adding Comments

1. **Update `prisma/schema.prisma`:**

```prisma
model Comment {
  id        Int       @id @default(autoincrement())
  content   String
  postId    Int       @map("post_id")
  userId    String    @map("user_id") @db.Uuid
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  
  post      Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  user      Profile   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([postId])
  @@index([userId])
  @@map("comments")
}

// Add to Post model
model Post {
  // ... existing fields
  comments  Comment[]
}
```

2. **Push to database:**

```bash
npm run db:push
```

3. **Create RLS policy file** `supabase/migrations/YYYYMMDD_add_comments_rls.sql`:

```sql
-- Enable RLS
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Comments are viewable by everyone"
ON "comments" FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create comments"
ON "comments" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON "comments" FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON "comments" FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

4. **Apply RLS policies** in Supabase SQL Editor

---

## Next Steps

1. Add more models to Prisma schema (comments, likes, etc.)
2. Create corresponding API routes in Hono
3. Implement authorization rules in your API
4. Add rate limiting and other middleware
5. Create a nice UI for creating/editing posts
6. Deploy to production

Happy coding! 🚀

