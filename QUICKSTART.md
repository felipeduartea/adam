# Quick Start Guide

## ✅ What's Been Done

- ✅ Prisma schema updated with Organization models
- ✅ Database schema synced to Supabase (organizations, memberships)
- ✅ RLS policies created in `supabase/migrations/`
- ✅ Package scripts updated for proper workflow

## 🚀 Next Steps

### 1. Apply RLS Policies (ONE TIME)

Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql) and run:

```sql
-- Copy and paste from:
supabase/migrations/20251004200000_add_organization_rls_policies.sql
```

### 2. Start Development

```bash
npm run dev
```

## 📝 Daily Workflow

```bash
# Edit prisma/schema.prisma
# Then:
npm run db:push              # Sync schema
npm run db:studio            # View data
```

If you add new tables that need RLS:
1. Create SQL file in `supabase/migrations/`
2. Apply via Supabase Dashboard

## 🗂️ Project Structure

```
prisma/
├── schema.prisma          # Source of truth for schema
└── migrations/            # Initial Supabase auth setup

supabase/
├── migrations/            # RLS policies (apply manually)
└── README.md             # Migration workflow

SUPABASE_SETUP.md         # Full Supabase integration guide
DEPLOYMENT.md             # Production deployment guide
```

## 🎯 Key Commands

```bash
npm run db:push           # Push schema changes
npm run db:studio         # Open Prisma Studio
npm run db:generate       # Regenerate Prisma Client
npm run dev              # Start dev server
```

## 📦 Organization Features

Your Prisma schema now includes:

- **Organizations**: Multi-tenant support
- **OrganizationMembership**: User roles (owner, admin, member)
- **Posts**: Can belong to organizations or be personal

Example usage:

```typescript
// Create organization
const org = await prisma.organization.create({
  data: {
    name: "My Company",
    slug: "my-company",
    memberships: {
      create: {
        userId: userId,
        role: "owner"
      }
    }
  }
});

// Create organization post
const post = await prisma.post.create({
  data: {
    title: "Team Update",
    userId: userId,
    organizationId: org.id
  }
});
```

## 🛠️ Troubleshooting

### "Shadow database" errors
✅ Fixed - We use `prisma db push` instead

### Schema changes not reflecting
```bash
npm run db:push
npm run db:generate
```

### Need to reset database?
```bash
# Careful - this deletes data!
npx prisma db push --force-reset
```

For more details, see:
- `SUPABASE_SETUP.md` - Full setup guide
- `DEPLOYMENT.md` - Production deployment
- `supabase/README.md` - Migration workflow

