-- Add RLS policies for ALL tables
-- Run this in Supabase SQL Editor

-- Disable RLS on all tables temporarily
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE reward_purchases DISABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kindness_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE kindness_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE family_values DISABLE ROW LEVEL SECURITY;
ALTER TABLE screen_usage_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE reward_templates DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('tasks', 'task_completions', 'rewards', 'reward_purchases',
                         'point_transactions', 'kindness_cards', 'kindness_badges',
                         'family_values', 'screen_usage_log', 'task_templates', 'reward_templates')
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kindness_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kindness_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_templates ENABLE ROW LEVEL SECURITY;

-- Create simple policies for all tables (allow all authenticated users)
CREATE POLICY "tasks_authenticated" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "task_completions_authenticated" ON task_completions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rewards_authenticated" ON rewards FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "reward_purchases_authenticated" ON reward_purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "point_transactions_authenticated" ON point_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "kindness_cards_authenticated" ON kindness_cards FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "kindness_badges_authenticated" ON kindness_badges FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "family_values_authenticated" ON family_values FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "screen_usage_log_authenticated" ON screen_usage_log FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "task_templates_public" ON task_templates FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "reward_templates_public" ON reward_templates FOR SELECT TO authenticated, anon USING (true);

SELECT 'All RLS policies added!' as status;
