# Database Migration Instructions

## Option 1: Automated Migration (Recommended)

### Step 1: Login to Supabase CLI

```bash
npx supabase login
```

This will open your browser to authenticate. Follow the prompts to log in with your Supabase account.

### Step 2: Link Your Project

```bash
npx supabase link --project-ref blstphkvdrrhtdxrllvx
```

### Step 3: Run Migrations

```bash
npx supabase db push
```

This will apply all migration files in the `supabase/migrations/` folder to your remote database.

---

## Option 2: Manual Migration via SQL Editor

If you prefer to run migrations manually or encounter CLI issues:

### Step 1: Open Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/blstphkvdrrhtdxrllvx
2. Click on "SQL Editor" in the left sidebar

### Step 2: Execute Combined Migration

1. Open the file `supabase/combined-migration.sql` in your code editor
2. Copy all contents (1043 lines)
3. Paste into the SQL Editor in Supabase Dashboard
4. Click "Run" button (or press Cmd/Ctrl + Enter)

### Step 3: Verify Tables Created

After running the migration, verify in the Table Editor:

**Expected tables:**
- families
- users
- children
- task_templates
- tasks
- task_completions
- reward_templates
- rewards
- reward_purchases
- kindness_cards
- kindness_badges
- app_integrations
- app_integration_events
- weekly_summaries
- point_transactions
- family_values

**Expected views:**
- v_child_today_tasks
- v_pending_approvals
- v_weekly_screen_usage
- v_child_dashboard

**Expected functions:**
- add_points()
- auto_approve_tasks()
- get_weekly_screen_usage()
- can_purchase_reward()
- update_updated_at_column()
- set_auto_approve_at()

---

## Troubleshooting

### CLI Connection Issues

If you encounter connection errors with the CLI:

1. Make sure you're logged in: `npx supabase login`
2. Verify project is linked: `npx supabase projects list`
3. Check your .env.local has correct credentials

### SQL Editor Errors

If you encounter errors in the SQL Editor:

1. Run migrations in order (they're numbered 001-017)
2. Check if tables already exist
3. Look for specific error messages and fix syntax if needed

### Row Level Security

All tables have RLS enabled. After migration, you'll need to add RLS policies in Phase 2 for:
- Parent access to family data
- Child access to their own data
- Public access restrictions

---

## Next Steps After Migration

1. ✅ Verify all tables created successfully
2. Set up OAuth providers (Google, Apple) in Supabase Auth settings
3. Configure auth redirect URLs
4. Add RLS policies
5. Test database connection from Next.js app
