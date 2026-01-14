-- Migration 019: Hybrid Task System
-- Adds support for auto-assigned tasks, monthly tasks, and task archiving
-- Creates task_instances table for date-specific task tracking

-- Add new columns to tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS auto_assign BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS monthly_day INTEGER,
  ADD COLUMN IF NOT EXISTS monthly_mode TEXT DEFAULT 'any_day';

-- Add constraints
ALTER TABLE tasks ADD CONSTRAINT valid_monthly_mode
  CHECK (monthly_mode IN ('any_day', 'specific_day', 'first_day', 'last_day'));

ALTER TABLE tasks ADD CONSTRAINT valid_monthly_day
  CHECK (monthly_day IS NULL OR (monthly_day >= 1 AND monthly_day <= 31));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived_at)
  WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_auto_assign ON tasks(auto_assign, frequency)
  WHERE is_active = TRUE AND deleted_at IS NULL;

-- Add comments
COMMENT ON COLUMN tasks.auto_assign IS
  'If true, system auto-creates task instances daily. If false, child submits template anytime.';
COMMENT ON COLUMN tasks.archived_at IS
  'When task was archived (soft archive, parent can unarchive)';
COMMENT ON COLUMN tasks.monthly_day IS
  'Day of month (1-31) when task appears if monthly_mode is specific_day';
COMMENT ON COLUMN tasks.monthly_mode IS
  'How monthly tasks appear: any_day (anytime in month), specific_day (15th), first_day, last_day';

-- Create task_instances table for auto-assigned tasks
CREATE TABLE IF NOT EXISTS task_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Instance metadata
  scheduled_date DATE NOT NULL, -- The date this instance is for (2026-01-09)
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'submitted', 'completed', 'skipped'

  -- Link to completion
  completion_id UUID REFERENCES task_completions(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'submitted', 'completed', 'skipped')),
  CONSTRAINT unique_task_instance UNIQUE(task_id, child_id, scheduled_date)
);

-- Indexes for task_instances
CREATE INDEX IF NOT EXISTS idx_task_instances_task_id ON task_instances(task_id);
CREATE INDEX IF NOT EXISTS idx_task_instances_child_id ON task_instances(child_id);
CREATE INDEX IF NOT EXISTS idx_task_instances_family_id ON task_instances(family_id);
CREATE INDEX IF NOT EXISTS idx_task_instances_scheduled_date ON task_instances(scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_task_instances_status ON task_instances(status);
CREATE INDEX IF NOT EXISTS idx_task_instances_pending ON task_instances(child_id, scheduled_date)
  WHERE status = 'pending';

-- RLS Policies for task_instances
ALTER TABLE task_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family's task instances"
  ON task_instances FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "System can manage task instances"
  ON task_instances FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- Trigger for updated_at
CREATE TRIGGER update_task_instances_updated_at
  BEFORE UPDATE ON task_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for task_instances
COMMENT ON TABLE task_instances IS
  'Individual instances of auto-assigned tasks for specific dates';
COMMENT ON COLUMN task_instances.scheduled_date IS
  'The date this task instance is assigned for';
COMMENT ON COLUMN task_instances.status IS
  'pending=not started, submitted=waiting approval, completed=done, skipped=missed';

-- Archive/Unarchive functions
CREATE OR REPLACE FUNCTION archive_task(p_task_id UUID)
RETURNS JSONB AS $$
BEGIN
  UPDATE tasks
  SET archived_at = NOW(),
      updated_at = NOW()
  WHERE id = p_task_id;

  RETURN jsonb_build_object('success', TRUE, 'archived', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION unarchive_task(p_task_id UUID)
RETURNS JSONB AS $$
BEGIN
  UPDATE tasks
  SET archived_at = NULL,
      updated_at = NOW()
  WHERE id = p_task_id;

  RETURN jsonb_build_object('success', TRUE, 'archived', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing view to recreate with new columns
DROP VIEW IF EXISTS v_child_today_tasks CASCADE;

-- Create updated view for monthly logic and auto-assigned tasks
CREATE VIEW v_child_today_tasks AS
SELECT
  t.*,
  c.id AS child_id_resolved,

  -- For auto-assigned: get instance info
  CASE WHEN t.auto_assign = TRUE THEN (
    SELECT ti.id FROM task_instances ti
    WHERE ti.task_id = t.id
      AND ti.child_id = c.id
      AND ti.scheduled_date = CURRENT_DATE
    LIMIT 1
  ) END AS instance_id,

  CASE WHEN t.auto_assign = TRUE THEN (
    SELECT ti.status FROM task_instances ti
    WHERE ti.task_id = t.id
      AND ti.child_id = c.id
      AND ti.scheduled_date = CURRENT_DATE
    LIMIT 1
  ) END AS instance_status

FROM tasks t
CROSS JOIN children c
WHERE t.is_active = TRUE
  AND t.deleted_at IS NULL
  AND t.archived_at IS NULL
  AND c.family_id = t.family_id
  AND (t.child_id IS NULL OR t.child_id = c.id)
  AND (
    -- Auto-assigned: must have instance for today
    (t.auto_assign = TRUE AND EXISTS (
      SELECT 1 FROM task_instances ti
      WHERE ti.task_id = t.id
        AND ti.child_id = c.id
        AND ti.scheduled_date = CURRENT_DATE
    ))
    OR
    -- Manual: show based on frequency rules
    (t.auto_assign = FALSE AND (
      t.frequency = 'daily'
      OR (t.frequency = 'weekly' AND (
        t.days_of_week IS NULL
        OR EXTRACT(DOW FROM NOW())::INTEGER = ANY(t.days_of_week)
      ))
      OR (t.frequency = 'monthly' AND (
        (t.monthly_mode = 'any_day')
        OR (t.monthly_mode = 'specific_day' AND EXTRACT(DAY FROM NOW())::INTEGER = t.monthly_day)
        OR (t.monthly_mode = 'first_day' AND EXTRACT(DAY FROM NOW())::INTEGER = 1)
        OR (t.monthly_mode = 'last_day' AND EXTRACT(DAY FROM NOW())::INTEGER =
            EXTRACT(DAY FROM (date_trunc('month', NOW()) + interval '1 month - 1 day'))::INTEGER)
      ))
      OR t.frequency = 'one_time'
    ))
  );

-- Migrate existing tasks to default behavior
-- Daily and weekly tasks will auto-assign by default
-- One-time tasks remain manual
UPDATE tasks
SET auto_assign = CASE
  WHEN frequency IN ('daily', 'weekly') THEN TRUE
  ELSE FALSE
END
WHERE auto_assign IS NULL;

-- Ensure monthly_mode is set for all tasks
UPDATE tasks
SET monthly_mode = 'any_day'
WHERE frequency = 'monthly' AND monthly_mode IS NULL;
