# Supabase Database Migrations

This directory contains all database migrations for EarnQuest.

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New project"
3. Fill in project details:
   - Name: `earnquest`
   - Database Password: (save this securely)
   - Region: Choose closest to your users
4. Wait for project to be provisioned (~2 minutes)

### 2. Get API Keys

1. Go to Project Settings → API
2. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep this secret!)

### 3. Update Environment Variables

Update `.env.local` with your real values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
```

### 4. Run Migrations

**Option A: Using Supabase CLI (Recommended)**

```bash
# Link to your project
npx supabase link --project-ref your-project-ref

# Run all migrations
npx supabase db push
```

**Option B: Manual via SQL Editor**

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste each migration file in order (001, 002, 003, etc.)
3. Click "Run" for each migration

### 5. Configure Authentication

**Google OAuth:**
1. Supabase Dashboard → Authentication → Providers → Google
2. Enable Google provider
3. Add Google OAuth credentials from Google Cloud Console
4. Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`

**Apple OAuth:**
1. Supabase Dashboard → Authentication → Providers → Apple
2. Enable Apple provider
3. Add Apple credentials from Apple Developer Console

**Auth Settings:**
- Site URL: `http://localhost:3000` (development) or `https://earnquest.vercel.app` (production)
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://earnquest.vercel.app/auth/callback`

### 6. Generate TypeScript Types

After running migrations:

```bash
npx supabase gen types typescript --project-id=your-project-ref > lib/supabase/types.ts
```

## Migration Files

- `001_create_families.sql` - Families table
- `002_create_users.sql` - Users table (linked to auth.users)
- `003_create_children.sql` - Children profiles
- `004_create_task_templates.sql` - System task templates
- `005_create_tasks.sql` - Family-specific tasks
- `006_create_task_completions.sql` - Task completion records
- `007_create_reward_templates.sql` - System reward templates
- `008_create_rewards.sql` - Family-specific rewards
- `009_create_reward_purchases.sql` - Reward purchase tickets
- `010_create_kindness_cards.sql` - Gratitude cards
- `011_create_kindness_badges.sql` - Kindness achievement badges
- `012_create_app_integrations.sql` - Third-party app connections
- `013_create_app_integration_events.sql` - Integration event logs
- `014_create_weekly_summaries.sql` - Weekly family reports
- `015_create_point_transactions.sql` - Point transaction history
- `016_create_family_values.sql` - No-point zone values
- `017_create_views.sql` - Database views for common queries
- `018_create_functions.sql` - PostgreSQL functions
- `019_create_triggers.sql` - Database triggers
- `020_create_rls_policies.sql` - Row Level Security
- `021_seed_templates.sql` - Initial task/reward templates

## Troubleshooting

**Error: "relation already exists"**
- Tables already created. Safe to ignore or drop and recreate.

**Error: "permission denied"**
- Make sure you're using the service_role key for admin operations.

**Error: "RLS policy prevents access"**
- Check that Row Level Security policies are correctly configured.

## Next Steps

After migrations are complete:
1. Verify tables in Supabase Dashboard → Table Editor
2. Test authentication with test user
3. Generate TypeScript types
4. Start development!
