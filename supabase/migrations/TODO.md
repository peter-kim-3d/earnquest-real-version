# Remaining Migrations to Create

The following migration files need to be created based on the data model in `docs/earnquest-data-model.md`:

## ✅ Completed
- [x] 001_create_families.sql
- [x] 002_create_users.sql
- [x] 003_create_children.sql

## 📝 To Create

### Task System
- [ ] 004_create_task_templates.sql - System-provided task templates
- [ ] 005_create_tasks.sql - Family-specific tasks
- [ ] 006_create_task_completions.sql - Task completion records with approval workflow

### Reward System
- [ ] 007_create_reward_templates.sql - System-provided reward templates
- [ ] 008_create_rewards.sql - Family-specific rewards
- [ ] 009_create_reward_purchases.sql - Reward purchase tickets

### Kindness System
- [ ] 010_create_kindness_cards.sql - Gratitude cards
- [ ] 011_create_kindness_badges.sql - Kindness achievement badges

### Integrations (Phase 3)
- [ ] 012_create_app_integrations.sql - Third-party app connections
- [ ] 013_create_app_integration_events.sql - Integration event logs

### Analytics
- [ ] 014_create_weekly_summaries.sql - Weekly family reports
- [ ] 015_create_point_transactions.sql - Point transaction audit log

### Configuration
- [ ] 016_create_family_values.sql - No-point zone family values

### Database Functions & Views
- [ ] 017_create_views.sql - Common query views
  - v_child_today_tasks
  - v_pending_approvals
  - v_weekly_screen_usage

- [ ] 018_create_functions.sql - PostgreSQL functions
  - add_points()
  - approve_task_completion()
  - purchase_reward()
  - process_auto_approvals()

- [ ] 019_create_triggers.sql - Database triggers
  - update_updated_at trigger
  - check_kindness_badge trigger

- [ ] 020_create_rls_policies.sql - Additional RLS policies for all tables

### Seed Data
- [ ] 021_seed_templates.sql - Initial task and reward templates

## Quick Reference

Each migration should follow this pattern:

```sql
-- Drop existing (for development)
DROP TABLE IF EXISTS table_name CASCADE;

-- Create table
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- columns...
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_table_column ON table_name(column);

-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "policy_name" ON table_name
  FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- Comments
COMMENT ON TABLE table_name IS 'Description';
```

## When You're Ready

1. Copy SQL from `docs/earnquest-data-model.md` (starting at line 45)
2. Create each migration file in numerical order
3. Test each migration individually
4. Run `npx supabase db push` or manually execute in SQL Editor

Reference: See `docs/earnquest-data-model.md` for complete table definitions, functions, triggers, and seed data.
