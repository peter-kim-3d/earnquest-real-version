# EarnQuest Task System v2 - Migration Guide

## 🎯 Overview

This guide will help you safely migrate from v1 to v2 of the EarnQuest Task System.

**What changes:**
- Categories: `hygiene, chores, learning, kindness, other` → `learning, household, health`
- Approval Types: `manual, auto` → `parent, auto, timer, checklist`
- New Features: Timer tasks, checklist tasks, fix requests, batch approve

---

## ⚠️ PRE-MIGRATION CHECKLIST

Before starting, complete these tasks:

- [ ] **Backup your database** (Download from Supabase Dashboard → Database → Backups)
- [ ] **Test on staging first** (if you have a staging environment)
- [ ] **Notify your team** (if working with others)
- [ ] **Set maintenance window** (or do this during low-traffic time)

---

## 🚀 OPTION 1: Supabase CLI (Recommended)

### Step 1: Install Supabase CLI

```bash
# macOS (using Homebrew)
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase
```

### Step 2: Link to Your Project

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref blstphkvdrrhtdxrllvx
```

### Step 3: Run Migrations

```bash
# Apply all pending migrations
supabase db push

# This will run:
# - 020_task_system_v2_enums.sql
# - 021_task_system_v2_templates.sql
# - 022_task_completions_v2.sql
```

### Step 4: Verify Migration

```bash
# Check migration status
supabase migration list

# Should show all 3 migrations as "Applied"
```

---

## 🖥️ OPTION 2: Supabase Studio (Manual - Fastest)

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/blstphkvdrrhtdxrllvx/sql
2. Create a new query

### Step 2: Run Migration 020 (Enums & Schema)

Copy the entire content from:
`supabase/migrations/020_task_system_v2_enums.sql`

Paste into SQL Editor and click **Run**

### Step 3: Run Migration 021 (Templates)

Copy the entire content from:
`supabase/migrations/021_task_system_v2_templates.sql`

Paste into SQL Editor and click **Run**

### Step 4: Run Migration 022 (Task Completions)

Copy the entire content from:
`supabase/migrations/022_task_completions_v2.sql`

Paste into SQL Editor and click **Run**

---

## 🐍 OPTION 3: Python Script (Automated)

I can create a Python script that runs all migrations automatically.

Would you like me to create this? (Let me know!)

---

## ✅ POST-MIGRATION VERIFICATION

After running migrations, verify everything worked:

### 1. Check Database Schema

Run this query in Supabase SQL Editor:

```sql
-- Check tasks table has new columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tasks'
  AND column_name IN ('category', 'approval_type', 'metadata', 'timer_minutes', 'checklist', 'category_old', 'approval_type_old')
ORDER BY column_name;

-- Should return:
-- approval_type      | text
-- approval_type_old  | text
-- category           | text
-- category_old       | text
-- checklist          | jsonb
-- metadata           | jsonb
-- timer_minutes      | integer
```

### 2. Check Data Migration

```sql
-- Verify old data migrated correctly
SELECT
  name,
  category_old as old_category,
  category as new_category,
  approval_type_old as old_approval,
  approval_type as new_approval
FROM tasks
WHERE category_old IS NOT NULL
LIMIT 5;

-- Verify categories changed:
-- hygiene → health
-- chores → household
-- learning → learning (unchanged)
```

### 3. Check Templates

```sql
-- Should have 13 templates
SELECT COUNT(*) as template_count FROM task_templates;
-- Expected: 13

-- List all templates
SELECT template_key, name, category, approval_type, timer_minutes
FROM task_templates
ORDER BY template_key;
```

### 4. Check Constraints

```sql
-- Verify category constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%category%';

-- Should allow: learning, household, health
```

---

## 🧪 TESTING CHECKLIST

After migration, test these features:

### Database Level
- [ ] Old tasks still visible
- [ ] Old tasks have correct new categories
- [ ] Templates inserted (13 total)
- [ ] Constraints working (try inserting invalid category - should fail)

### Onboarding Flow
- [ ] Create new test family
- [ ] Select "Balanced" preset
- [ ] Check "Has Pet" checkbox
- [ ] Verify tasks created (should have 8 tasks including feed_pet)

### Parent Features
- [ ] Create new task with "Timer" approval type
- [ ] Create new task with "Checklist" approval type
- [ ] Send fix request (verify templates appear)
- [ ] Batch approve multiple tasks

### Child Features
- [ ] Start timer task (countdown should work)
- [ ] Complete timer task (should auto-approve)
- [ ] Complete checklist task (all items required)
- [ ] Receive fix request, view feedback

---

## 🆘 TROUBLESHOOTING

### Issue: Migration Fails with "column already exists"

**Solution:** Some columns might already exist. Check if migrations were partially run:

```sql
-- Check which columns exist
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'tasks';
```

If v2 columns exist, the migration might have already run.

### Issue: "violates check constraint"

**Solution:** Old data might not fit new constraints. Check:

```sql
-- Find invalid categories
SELECT DISTINCT category
FROM tasks
WHERE category NOT IN ('learning', 'household', 'health');
```

### Issue: Templates not inserted

**Solution:** Check for duplicate template_key:

```sql
-- Check existing templates
SELECT template_key, name FROM task_templates;

-- Delete old templates if needed
DELETE FROM task_templates;
-- Then re-run migration 021
```

---

## 🔄 ROLLBACK PROCEDURE

If something goes wrong, you can rollback:

### Option A: Restore from Backup

1. Go to Supabase Dashboard → Database → Backups
2. Find your pre-migration backup
3. Click "Restore"

### Option B: Run Rollback Migration

```sql
-- Run the rollback script
-- Location: supabase/migrations/020_rollback_task_system_v2_enums.sql

-- This will:
-- 1. Swap column names back (category_old → category)
-- 2. Restore old constraints
-- 3. Preserve all data
```

---

## 📞 NEED HELP?

If you encounter issues:

1. **Check migration status:** `supabase migration list`
2. **Check database logs:** Supabase Dashboard → Database → Logs
3. **Share error message:** Copy the exact error for troubleshooting

---

## ✨ POST-MIGRATION: Deploy Code

Once migrations succeed:

```bash
# Commit and deploy
git add .
git commit -m "Deploy EarnQuest Task System v2"
git push origin main

# Vercel will auto-deploy
# Monitor logs for any runtime errors
```

---

## 🎉 SUCCESS CRITERIA

You'll know the migration succeeded when:

- ✅ All 3 migrations show "Applied" status
- ✅ `task_templates` table has 13 rows
- ✅ Old tasks have new categories (but category_old preserved)
- ✅ Can create new task with "timer" approval type
- ✅ Can complete timer task with modal countdown
- ✅ Onboarding flow shows 4 new presets

---

**Next:** Choose an option above and let me know if you need help with any step!
