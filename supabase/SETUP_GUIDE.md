# Complete Supabase Setup Guide for EarnQuest

## 📋 Overview

This guide will walk you through setting up the complete EarnQuest database with Supabase.

**What you'll set up:**
- 14 database tables
- 3 PostgreSQL functions
- 2 triggers
- 3 views
- Row Level Security policies
- 30+ task and reward templates
- Google OAuth (Apple optional)

**Time required:** 15-20 minutes

---

## Step 1: Create Supabase Project ⏱️ 5 min

1. **Go to** https://supabase.com
2. **Sign in** with GitHub (or create account)
3. **Click** "New Project"
4. **Fill in:**
   - **Organization:** Select or create one
   - **Project Name:** `earnquest`
   - **Database Password:** Click "Generate a password" (SAVE THIS!)
   - **Region:** Choose closest to you (e.g., "US East")
   - **Pricing Plan:** Free
5. **Click** "Create new project"
6. **Wait** ~2 minutes for provisioning

---

## Step 2: Get Credentials ⏱️ 2 min

Once your project is ready:

1. **Go to** Settings (gear icon in sidebar) → API
2. **Copy these 3 values:**

   **Project URL:**
   ```
   https://xxxxxxxxxxx.supabase.co
   ```

   **anon public key:** (starts with `eyJhbGciOiJIUzI1Ni...`)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

   **service_role key:** (starts with `eyJhbGciOiJIUzI1Ni...`, different from anon)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## Step 3: Update Environment Variables ⏱️ 1 min

1. **Open** `.env.local` in your project root
2. **Replace** placeholder values with your real credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co  # Your Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...          # Your anon key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1Ni...              # Your service_role key
NEXT_PUBLIC_APP_URL=http://localhost:3001                    # Keep this for dev
```

3. **Save** the file

---

## Step 4: Run Database Migrations ⏱️ 5-10 min

You have **two options**. Choose Option A if you have npm installed, otherwise use Option B.

### Option A: Automated (Supabase CLI)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project (use your project ref from URL)
supabase link --project-ref xxxxxxxxxxx

# Run all 15 migrations at once
supabase db push

# Generate TypeScript types
npx supabase gen types typescript --project-id xxxxxxxxxxx > lib/supabase/types.ts
```

### Option B: Manual (SQL Editor)

1. **Go to** Supabase Dashboard → SQL Editor
2. **Click** "+ New query"
3. **Run each migration file in order:**

**Copy-paste and run one at a time:**

#### Migration 1: Families Table
- Copy entire content of `supabase/migrations/001_create_families.sql`
- Paste into SQL Editor
- Click **"Run"**
- Wait for ✅ "Success"

#### Migration 2: Users Table
- Copy entire content of `supabase/migrations/002_create_users.sql`
- Paste and **Run**
- Wait for ✅ "Success"

#### Migration 3: Children Table
- Copy `003_create_children.sql`
- Paste and **Run**

#### Migration 4-15: Repeat for remaining migrations
- `004_create_tasks.sql`
- `005_create_task_completions.sql`
- `006_create_rewards.sql`
- `007_create_reward_purchases.sql`
- `008_create_point_transactions.sql`
- `009_create_kindness_tables.sql`
- `010_create_family_values_and_screen_log.sql`
- `011_create_template_tables.sql`
- `012_create_functions.sql`
- `013_create_triggers.sql`
- `014_create_views.sql`
- `015_seed_templates.sql`

**✅ You should see "Success" for each migration**

---

## Step 5: Verify Database Setup ⏱️ 2 min

1. **Go to** Supabase Dashboard → Table Editor
2. **Check these tables exist:**
   - ✅ families
   - ✅ users
   - ✅ children
   - ✅ tasks
   - ✅ task_completions
   - ✅ rewards
   - ✅ reward_purchases
   - ✅ point_transactions
   - ✅ kindness_cards
   - ✅ kindness_badges
   - ✅ family_values
   - ✅ screen_usage_log
   - ✅ task_templates (should have ~30 rows)
   - ✅ reward_templates (should have ~15 rows)

3. **Click** on `task_templates` table
4. **Verify** you see tasks like "Brush Teeth", "Complete Homework", etc.

---

## Step 6: Configure Google OAuth ⏱️ 5 min

### Part A: Google Cloud Console

1. **Go to** https://console.cloud.google.com
2. **Create** new project:
   - Click dropdown at top
   - Click "New Project"
   - Name: "EarnQuest"
   - Click "Create"
   - Wait for creation, then select it

3. **Enable Google+ API:**
   - Search "Google+ API" in search bar
   - Click "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "+ Create Credentials" → "OAuth client ID"
   - If prompted, configure consent screen:
     - User Type: External
     - App name: "EarnQuest"
     - User support email: your email
     - Developer email: your email
     - Click "Save and Continue" through all steps
   - Application type: **Web application**
   - Name: "EarnQuest Web Client"
   - **Authorized redirect URIs:**
     ```
     https://xxxxxxxxxxx.supabase.co/auth/v1/callback
     ```
     (Replace `xxxxxxxxxxx` with your actual Supabase project ref!)
   - Click "Create"
   - **Copy** Client ID and Client Secret (you'll need these)

### Part B: Supabase Dashboard

1. **Go to** Supabase Dashboard → Authentication → Providers
2. **Find** "Google"
3. **Click** the toggle to enable
4. **Paste:**
   - Client ID (from Google)
   - Client Secret (from Google)
5. **Leave** "Authorized Client IDs" empty
6. **Click** "Save"

---

## Step 7: Configure Auth Settings ⏱️ 1 min

1. **Go to** Supabase Dashboard → Authentication → URL Configuration
2. **Set:**
   - **Site URL:** `http://localhost:3001`
   - **Redirect URLs:** Add these one by one:
     ```
     http://localhost:3001/en-US/callback
     http://localhost:3001/ko-KR/callback
     ```
3. **Click** "Save"

---

## Step 8: Test Everything! ⏱️ 5 min

1. **Restart your dev server:**
   ```bash
   # Kill existing server (Ctrl+C)
   npm run dev
   ```

2. **Open browser:** http://localhost:3001/en-US/signup

3. **Test Email Signup:**
   - Enter email and password
   - Click "Create Family Account"
   - Check for errors in console

4. **Test Google OAuth:**
   - Click "Continue with Google"
   - Should redirect to Google login
   - Select your account
   - Should redirect back to http://localhost:3001/en-US/callback
   - Then to onboarding

5. **Verify in Supabase:**
   - Go to Supabase Dashboard → Authentication → Users
   - Should see your new user!
   - Go to Table Editor → `users` table
   - Should see user record!

---

## 🎉 Success!

Your Supabase database is now fully set up! You can now:

- ✅ Sign up and log in
- ✅ Create children profiles
- ✅ Complete onboarding flow
- ✅ Create tasks and rewards (coming in Phase 3)

---

## Troubleshooting

### "Invalid redirect URI" error

**Problem:** OAuth redirect doesn't match

**Solution:**
- Check Google Cloud Console redirect URI matches EXACTLY:
  ```
  https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
  ```
- No trailing slashes!
- Replace `YOUR-PROJECT-REF` with actual ref

### "Email not confirmed" error

**Problem:** Email confirmation required

**Solution:**
- Go to Supabase Dashboard → Authentication → Settings
- Disable "Enable email confirmations"
- Or check your email for confirmation link

### Can't see new user in database

**Problem:** User created in auth but not in `users` table

**Solution:**
- We need to set up a trigger to auto-create user profile
- For now, create manually in Table Editor → `users` table

### Migration fails with "relation already exists"

**Problem:** Table already created

**Solution:**
- Safe to ignore if you're re-running
- Or drop table in SQL Editor: `DROP TABLE table_name CASCADE;`

### "PGRST" or "RLS policy" errors

**Problem:** Row Level Security blocking access

**Solution:**
- RLS policies require authenticated session
- Try signing in first
- Check browser console for auth errors

---

## What's Next?

Now that Supabase is set up, you can:

1. **Test the onboarding flow:**
   - Create account
   - Add a child
   - Select family style
   - Set family values

2. **Proceed to Phase 3:**
   - Child dashboard
   - Task list implementation
   - Task submission and approval

3. **Or continue with database enhancements:**
   - Create auth trigger for auto user creation
   - Test database functions (add_points, etc.)
   - Explore Supabase features

---

## Production Deployment

When you're ready to deploy to Vercel:

1. **Update environment variables in Vercel:**
   - Add all 3 Supabase env vars
   - Set `NEXT_PUBLIC_APP_URL` to your production domain

2. **Update OAuth redirect URIs:**
   - Google Cloud Console: Add `https://yourdomain.com/en-US/callback`
   - Supabase Auth → URL Configuration: Add production URLs

3. **Consider upgrading Supabase:**
   - Free tier has limits
   - Pro tier: $25/month for production apps
