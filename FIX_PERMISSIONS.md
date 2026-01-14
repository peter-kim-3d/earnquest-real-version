# Fix Database Permissions - 2 Minutes

## Problem
The tables exist (you can see them in the dashboard ✅), but the API can't access them because permissions weren't granted during migration.

## Solution
Run this quick SQL fix:

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/blstphkvdrrhtdxrllvx/sql
2. Click "+ New query"

### Step 2: Copy and Run Fix SQL

Copy this SQL:
```sql
-- Grant all permissions on tables to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Ensure service_role can bypass RLS
ALTER ROLE service_role SET row_security = off;

-- Confirm
SELECT 'Permissions fixed!' as status;
```

OR open and copy: `scripts/fix-permissions.sql`

### Step 3: Paste and Run
1. Paste into SQL Editor
2. Click "Run" (or Cmd+Enter)
3. Should see "Permissions fixed!"

### Step 4: Verify It Worked
Run this in your terminal:
```bash
node scripts/check-tables.js
```

You should now see:
```
✅ families: EXISTS (0 rows)
✅ users: EXISTS (0 rows)
✅ children: EXISTS (0 rows)
✅ tasks: EXISTS (0 rows)
✅ task_completions: EXISTS (0 rows)
✅ rewards: EXISTS (0 rows)
✅ reward_purchases: EXISTS (0 rows)
✅ point_transactions: EXISTS (0 rows)
✅ kindness_cards: EXISTS (0 rows)
✅ kindness_badges: EXISTS (0 rows)
✅ family_values: EXISTS (0 rows)
✅ screen_usage_log: EXISTS (0 rows)
✅ task_templates: EXISTS (17 rows)  ← Seeded templates!
✅ reward_templates: EXISTS (15 rows)  ← Seeded templates!
```

## What This Does
- Grants full access to `service_role` (your backend)
- Grants read/write access to `authenticated` users (logged-in users)
- Grants read-only access to `anon` (public API)
- Ensures service_role bypasses all RLS policies

## After This Works
Once you see all green checkmarks, we'll move on to:
1. Configure Google OAuth ✅
2. Test the signup/login flow ✅
3. Start using the app! 🎉
