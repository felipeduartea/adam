# Deployment Guide

## Database Setup (Supabase + Prisma)

### Development Workflow

1. **Make schema changes** in `prisma/schema.prisma`

2. **Push schema to database:**
   ```bash
   npm run db:push
   ```
   This uses `prisma db push` which bypasses shadow database issues with Supabase.

3. **Apply RLS policies** (one-time or when changed):
   - Go to Supabase Dashboard → SQL Editor
   - Copy contents from `supabase/migrations/20251004200000_add_organization_rls_policies.sql`
   - Paste and run

### Production Deployment

#### Option 1: Vercel (Recommended)

1. **Environment Variables in Vercel:**
   ```
   DATABASE_URL=your-supabase-connection-pooler-url
   DIRECT_URL=your-supabase-direct-url
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Deploy:**
   ```bash
   git push
   ```
   Vercel automatically runs `vercel-build` which includes `prisma generate`.

3. **Initial Database Setup:**
   - Manually run the initial migration from `prisma/migrations/20251004183525_supabase_auth_setup/migration.sql` in Supabase SQL Editor (one-time)
   - Then push your schema: `npx prisma db push` (or let it sync automatically)
   - Apply RLS policies from `supabase/migrations/*.sql` in Supabase SQL Editor

#### Option 2: Manual Deployment

1. **Setup Database:**
   ```bash
   npx prisma db push
   ```

2. **Apply RLS Policies** via Supabase Dashboard SQL Editor

3. **Build and Deploy:**
   ```bash
   npm run build
   npm start
   ```

## Why This Approach?

### Prisma for Schema
- ✅ Type-safe database access
- ✅ Auto-generated TypeScript types
- ✅ Fast iteration with `db push`
- ✅ Works perfectly with Supabase connection pooler

### Separate RLS Files
- ✅ Supabase's `auth` schema not in Prisma
- ✅ RLS policies are Supabase-specific
- ✅ Clear separation of concerns
- ✅ No shadow database headaches

## Common Issues

### "Shadow database" errors
- **Solution:** We use `prisma db push` instead of `prisma migrate dev`
- This bypasses shadow database entirely

### Foreign key errors with auth.users
- **Solution:** RLS policies are applied separately via Supabase SQL Editor
- They reference `auth.uid()` which Prisma doesn't know about

### Schema drift warnings
- **Expected:** Prisma doesn't know about RLS policies
- **Solution:** Keep RLS files in `supabase/migrations/` for reference

