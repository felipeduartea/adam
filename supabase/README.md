# Supabase Migrations

This directory contains SQL migrations for RLS policies and other Supabase-specific features.

## Workflow

### 1. Schema Changes (Use Prisma)
```bash
# Make changes to prisma/schema.prisma
# Then push to database
npx prisma db push
```

### 2. RLS Policies (Use Supabase SQL)
```bash
# After schema changes, apply RLS policies manually via:
# Supabase Dashboard > SQL Editor > Copy/paste from supabase/migrations/*.sql
```

## Why This Approach?

**Prisma** is great for:
- Type-safe schema definition
- Auto-generated TypeScript types
- Fast iteration with `db push`

**Supabase SQL** is needed for:
- Row Level Security (RLS) policies
- Triggers and functions
- Auth schema integration

## Migration Files

- `20251004200000_add_organization_rls_policies.sql` - Organization and membership RLS policies

## How to Apply

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql/
2. Copy the contents of the migration file
3. Paste and click "Run"

Or use Supabase CLI (if installed):
```bash
supabase db push
```

