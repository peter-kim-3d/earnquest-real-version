# 🚀 Run Database Migration - 3 Easy Steps

## Your database tables don't exist yet. Let's fix that in 2 minutes!

---

### Step 1: Copy the SQL File

The migration SQL is in:
```
supabase/migrations/000_all_migrations_combined_FIXED.sql
```

**Option A: Open in VS Code and copy**
- Open the file in your editor
- Select All (Cmd+A)
- Copy (Cmd+C)

**Option B: Copy via terminal**
```bash
# This copies the file to your clipboard
cat supabase/migrations/000_all_migrations_combined_FIXED.sql | pbcopy
echo "✅ SQL copied to clipboard!"
```

---

### Step 2: Open Supabase SQL Editor

1. Go to: **https://supabase.com/dashboard**
2. Select your project: **blstphkvdrrhtdxrllvx** (or "earnquest")
3. Click **"SQL Editor"** in the left sidebar
4. Click **"+ New query"** button (top right)

---

### Step 3: Paste and Run

1. **Paste** the SQL into the editor (Cmd+V)
2. **Click "Run"** button (or press Cmd+Enter)
3. **Wait** ~10 seconds for execution
4. **Look for**: "Success. No rows returned" message

✅ If you see "Success" - you're done!
❌ If you see an error - copy the error message and let me know

---

## Verify It Worked

After running the migration, run this command:

```bash
node scripts/check-tables.js
```

You should see:
```
✅ families: EXISTS
✅ users: EXISTS
✅ children: EXISTS
... (14 tables total)
```

---

## What This Migration Creates

- ✅ **14 database tables** (families, users, children, tasks, etc.)
- ✅ **3 PostgreSQL functions** (add_points, approve_task_completion, purchase_reward)
- ✅ **Multiple triggers** (auto-update timestamps, badge creation)
- ✅ **3 views** (child_today_tasks, pending_approvals, weekly_screen_usage)
- ✅ **Security policies** (Row Level Security for data isolation)
- ✅ **30+ templates** (task and reward templates for onboarding)

---

## Need Help?

**Common issues:**

**"Relation already exists"**
- Some tables were partially created
- Solution: Drop the tables first or continue anyway (idempotent)

**"Permission denied"**
- Wrong SQL editor session
- Solution: Make sure you're logged into the correct Supabase project

**"Syntax error"**
- SQL might have been truncated
- Solution: Make sure you copied the entire file (1065 lines)

**Ready to proceed?** Run the migration now and let me know once it's done!
