# EarnQuest Quick Start Guide

## ✅ Completed Steps
- [x] Supabase project created
- [x] Credentials added to .env.local
- [x] Migration SQL file prepared

## 🚀 Next Steps

### Step 1: Run Database Migration (5 minutes)

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `earnquest` or `blstphkvdrrhtdxrllvx`
3. **Go to SQL Editor**:
   - Click "SQL Editor" in left sidebar
   - Click "+ New query"
4. **Copy the migration**:
   - Open: `supabase/migrations/000_all_migrations_combined_FIXED.sql`
   - Select all (Cmd+A)
   - Copy (Cmd+C)
5. **Paste and run**:
   - Paste into SQL Editor
   - Click "Run" (or Cmd+Enter)
   - Wait ~10 seconds
6. **Look for success**:
   - Should see "Success. No rows returned"
   - If error, copy error message and let me know

### Step 2: Verify Tables (2 minutes)

1. **Go to Table Editor** in Supabase dashboard
2. **Check these 14 tables exist**:
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
   - ✅ task_templates
   - ✅ reward_templates

3. **Check seed data**:
   - Click on `task_templates` table
   - Should see ~17 rows (tasks like "Brush Teeth", etc.)
   - Click on `reward_templates` table
   - Should see ~15 rows (rewards like "30 Minutes Screen Time", etc.)

### Step 3: Configure Google OAuth (5 minutes)

**Part A: Google Cloud Console**

1. Go to: https://console.cloud.google.com
2. Create new project:
   - Name: "EarnQuest"
   - Click "Create"
3. Enable Google+ API:
   - Search "Google+ API"
   - Click "Enable"
4. Create OAuth credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "+ Create Credentials" → "OAuth client ID"
   - Configure consent screen if needed:
     - User Type: External
     - App name: "EarnQuest"
     - Your email for support
   - Application type: **Web application**
   - Name: "EarnQuest Web Client"
   - **Authorized redirect URIs**:
     ```
     https://blstphkvdrrhtdxrllvx.supabase.co/auth/v1/callback
     ```
   - Click "Create"
   - **Copy** Client ID and Client Secret

**Part B: Supabase Dashboard**

1. Go to: Authentication → Providers
2. Find "Google"
3. Toggle to enable
4. Paste:
   - Client ID (from Google)
   - Client Secret (from Google)
5. Click "Save"

### Step 4: Configure Redirect URLs (1 minute)

1. **In Supabase Dashboard**:
   - Go to: Authentication → URL Configuration
2. **Set Site URL**:
   ```
   http://localhost:3001
   ```
3. **Add Redirect URLs**:
   ```
   http://localhost:3001/en-US/callback
   http://localhost:3001/ko-KR/callback
   ```
4. Click "Save"

### Step 5: Test Authentication (3 minutes)

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Open browser**:
   ```
   http://localhost:3001/en-US/signup
   ```

3. **Test signup flow**:
   - Click "Continue with Google"
   - Select your Google account
   - Should redirect back to callback
   - Then to onboarding page

4. **Check Supabase**:
   - Dashboard → Authentication → Users
   - Should see your user!
   - Table Editor → `users` table
   - Should see user record!

## 🎉 Success!

If all steps work, you now have:
- ✅ Complete database with 14 tables
- ✅ 30+ task and reward templates
- ✅ Google OAuth working
- ✅ Ready to test onboarding flow

## 🐛 Troubleshooting

**Migration fails**:
- Copy exact error message
- Most common: RLS policy issues (should be fixed in FIXED version)

**OAuth redirect error**:
- Verify Google Cloud Console redirect URI matches exactly
- No trailing slashes!

**"No rows" in templates**:
- Migration seed data might not have run
- Check SQL Editor for errors in PART 10

**Need help?**
- Check: `supabase/SETUP_GUIDE.md` for detailed troubleshooting
- Or let me know the specific error!
