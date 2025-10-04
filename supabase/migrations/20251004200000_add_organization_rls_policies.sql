-- =====================================================
-- Organization RLS Policies
-- =====================================================
-- Run this after `npx prisma db push` to add RLS policies
-- Apply via Supabase Dashboard > SQL Editor

-- Enable Row Level Security
ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "organization_memberships" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Organizations Policies
-- =====================================================

-- Users can view organizations they belong to
CREATE POLICY "Users can view organizations they belong to"
ON "organizations" FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "organization_memberships"
    WHERE "organization_memberships"."organization_id" = "organizations"."id"
    AND "organization_memberships"."user_id" = auth.uid()
  )
);

-- Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations"
ON "organizations" FOR INSERT
TO authenticated
WITH CHECK (true);

-- Organization owners and admins can update
CREATE POLICY "Organization owners and admins can update"
ON "organizations" FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "organization_memberships"
    WHERE "organization_memberships"."organization_id" = "organizations"."id"
    AND "organization_memberships"."user_id" = auth.uid()
    AND "organization_memberships"."role" IN ('owner', 'admin')
  )
);

-- Only organization owners can delete
CREATE POLICY "Organization owners can delete"
ON "organizations" FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "organization_memberships"
    WHERE "organization_memberships"."organization_id" = "organizations"."id"
    AND "organization_memberships"."user_id" = auth.uid()
    AND "organization_memberships"."role" = 'owner'
  )
);

-- =====================================================
-- Organization Memberships Policies
-- =====================================================

-- Users can view memberships in their organizations
CREATE POLICY "Users can view memberships in their organizations"
ON "organization_memberships" FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "organization_memberships" AS om
    WHERE om."organization_id" = "organization_memberships"."organization_id"
    AND om."user_id" = auth.uid()
  )
);

-- Owners/admins can add members (or users can add themselves when creating org)
CREATE POLICY "Owners and admins can add members"
ON "organization_memberships" FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = "organization_memberships"."user_id"
  OR EXISTS (
    SELECT 1 FROM "organization_memberships" AS om
    WHERE om."organization_id" = "organization_memberships"."organization_id"
    AND om."user_id" = auth.uid()
    AND om."role" IN ('owner', 'admin')
  )
);

-- Owners/admins can update memberships
CREATE POLICY "Owners and admins can update memberships"
ON "organization_memberships" FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM "organization_memberships" AS om
    WHERE om."organization_id" = "organization_memberships"."organization_id"
    AND om."user_id" = auth.uid()
    AND om."role" IN ('owner', 'admin')
  )
);

-- Owners/admins can remove members (or users can leave)
CREATE POLICY "Owners and admins can remove members or users can leave"
ON "organization_memberships" FOR DELETE
TO authenticated
USING (
  auth.uid() = "organization_memberships"."user_id"
  OR EXISTS (
    SELECT 1 FROM "organization_memberships" AS om
    WHERE om."organization_id" = "organization_memberships"."organization_id"
    AND om."user_id" = auth.uid()
    AND om."role" IN ('owner', 'admin')
  )
);

-- =====================================================
-- Update Posts Policies for Organization Context
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their posts or organization posts" ON "posts";
DROP POLICY IF EXISTS "Users can create posts" ON "posts";
DROP POLICY IF EXISTS "Users can update their own posts" ON "posts";
DROP POLICY IF EXISTS "Users can delete their posts or org admins can delete" ON "posts";

-- Recreate with organization support
CREATE POLICY "Users can view their posts or organization posts"
ON "posts" FOR SELECT
TO authenticated
USING (
  auth.uid() = "posts"."user_id"
  OR (
    "posts"."organization_id" IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM "organization_memberships"
      WHERE "organization_memberships"."organization_id" = "posts"."organization_id"
      AND "organization_memberships"."user_id" = auth.uid()
    )
  )
);

CREATE POLICY "Users can create posts"
ON "posts" FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = "posts"."user_id"
  AND (
    "posts"."organization_id" IS NULL
    OR EXISTS (
      SELECT 1 FROM "organization_memberships"
      WHERE "organization_memberships"."organization_id" = "posts"."organization_id"
      AND "organization_memberships"."user_id" = auth.uid()
    )
  )
);

CREATE POLICY "Users can update their own posts"
ON "posts" FOR UPDATE
TO authenticated
USING (auth.uid() = "posts"."user_id");

CREATE POLICY "Users can delete their posts or org admins can delete"
ON "posts" FOR DELETE
TO authenticated
USING (
  auth.uid() = "posts"."user_id"
  OR (
    "posts"."organization_id" IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM "organization_memberships"
      WHERE "organization_memberships"."organization_id" = "posts"."organization_id"
      AND "organization_memberships"."user_id" = auth.uid()
      AND "organization_memberships"."role" IN ('owner', 'admin')
    )
  )
);

