-- =====================================================
-- Supabase Auth + Prisma Migration
-- =====================================================
-- This migration sets up profiles and posts tables with
-- Supabase Auth integration, including RLS policies and triggers

-- CreateTable: profiles
-- This table references auth.users and stores extended user data
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable: posts
CREATE TABLE "posts" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "posts_user_id_idx" ON "posts"("user_id");

-- AddForeignKey: profiles references auth.users
-- This links profiles to Supabase Auth users
ALTER TABLE "profiles" 
ADD CONSTRAINT "profiles_id_fkey" 
FOREIGN KEY ("id") 
REFERENCES auth.users("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- AddForeignKey: posts references auth.users
-- Posts are owned by authenticated users
ALTER TABLE "posts" 
ADD CONSTRAINT "posts_user_id_fkey" 
FOREIGN KEY ("user_id") 
REFERENCES auth.users("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- =====================================================
-- Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies for Profiles
-- =====================================================

-- Allow everyone to read profiles
CREATE POLICY "Profiles are viewable by everyone"
ON "profiles" FOR SELECT
USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON "profiles" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON "profiles" FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- =====================================================
-- RLS Policies for Posts
-- =====================================================

-- Allow everyone (authenticated users) to read all posts
CREATE POLICY "Posts are viewable by everyone"
ON "posts" FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to create posts (must own them)
CREATE POLICY "Authenticated users can create posts"
ON "posts" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own posts only
CREATE POLICY "Users can update their own posts"
ON "posts" FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to delete their own posts only
CREATE POLICY "Users can delete their own posts"
ON "posts" FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- Auto-sync Function and Trigger
-- =====================================================

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name'
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Trigger to execute the function after new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- Backfill Existing Users
-- =====================================================

-- Create profiles for any existing users in auth.users
INSERT INTO public.profiles (id, email, name, avatar_url, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(
    raw_user_meta_data->>'name',
    raw_user_meta_data->>'full_name'
  ),
  raw_user_meta_data->>'avatar_url',
  COALESCE(created_at, NOW()),
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
