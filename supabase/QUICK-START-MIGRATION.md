# Quick Start: Run Database Migrations

## ⚡ Fastest Method: SQL Editor (5 minutes)

### Step 1: Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/blstphkvdrrhtdxrllvx/sql/new

### Step 2: Copy & Run Combined Migration

1. Open `supabase/combined-migration.sql` in VS Code
2. Select all (Cmd/Ctrl + A) and copy
3. Paste into Supabase SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)

⏱️ This will take ~10-15 seconds to execute all migrations.

### Step 3: Verify Success

Go to: https://supabase.com/dashboard/project/blstphkvdrrhtdxrllvx/editor

You should see these tables:
- ✅ families
- ✅ users
- ✅ children
- ✅ tasks
- ✅ task_completions
- ✅ task_templates
- ✅ rewards
- ✅ reward_purchases
- ✅ reward_templates
- ✅ kindness_cards
- ✅ kindness_badges
- ✅ family_values
- ✅ point_transactions
- ✅ weekly_summaries
- ✅ app_integrations
- ✅ app_integration_events

---

## 🔧 Alternative: CLI Method (if you prefer)

### Step 1: Get Access Token

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Name it "Local Development"
4. Copy the token

### Step 2: Set Environment Variable

Add to your `.env.local`:

```bash
SUPABASE_ACCESS_TOKEN=sbp_[your-token-here]
```

### Step 3: Run Migration Script

```bash
./scripts/run-migrations-cli.sh
```

---

## ✅ After Migration Complete

Once tables are created, continue with Phase 2:

1. ✅ Database schema created
2. 📱 Set up OAuth providers (Google, Apple)
3. 🔒 Implement authentication flow
4. 👨‍👩‍👧‍👦 Build family creation flow
5. 🎯 Build onboarding wizard

---

## 📋 Migration Contents

The combined migration includes:

- **16 tables**: Full EarnQuest data model
- **4 views**: Dashboard stats, pending approvals, weekly usage
- **6 functions**: Points management, auto-approval, validation
- **17 triggers**: Auto-timestamps, approval scheduling
- **Row Level Security**: Enabled on all tables (policies to be added)
- **Seed data**: Task and reward templates

Total: **1043 lines of SQL**

---

## ❌ Troubleshooting

### Error: "relation already exists"

Some tables might already exist. You can either:
1. Drop existing tables in SQL Editor
2. Run individual migration files that failed

### Error: "permission denied"

Make sure you're logged in to the correct Supabase project in the dashboard.

### Tables not showing

Refresh the page or click "Reload schema" in Table Editor.

---

## 🎉 Success!

After migration completes successfully, you can proceed with implementing OAuth authentication and building the family creation flow.

The database is now ready for Phase 2 development!
