-- Fix v_child_today_tasks view to respect child_task_overrides
-- This ensures tasks disabled for specific children don't appear in their dashboard

-- Drop the old view first to avoid column mismatch errors
DROP VIEW IF EXISTS v_child_today_tasks;

-- Recreate with proper override support
CREATE VIEW v_child_today_tasks AS
SELECT
  t.id,
  t.family_id,
  c.id AS child_id, -- The actual child this task applies to (not task's child_id)
  t.child_id AS task_child_id, -- Original task assignment (NULL = global)
  t.name,
  t.description,
  t.category,
  t.points,
  t.icon,
  t.frequency,
  t.approval_type,
  t.requires_photo,
  -- v2 fields for timer and checklist
  t.timer_minutes,
  t.checklist,
  t.metadata,
  c.name AS child_name,
  (
    SELECT tc.id
    FROM task_completions tc
    WHERE tc.task_id = t.id
      AND tc.child_id = c.id
      AND tc.requested_at >= date_trunc('day', NOW())
    ORDER BY tc.requested_at DESC
    LIMIT 1
  ) AS today_completion_id,
  (
    SELECT tc.status
    FROM task_completions tc
    WHERE tc.task_id = t.id
      AND tc.child_id = c.id
      AND tc.requested_at >= date_trunc('day', NOW())
    ORDER BY tc.requested_at DESC
    LIMIT 1
  ) AS today_status
FROM tasks t
CROSS JOIN children c
LEFT JOIN child_task_overrides cto ON cto.task_id = t.id AND cto.child_id = c.id
WHERE t.is_active = TRUE
  AND t.deleted_at IS NULL
  AND c.family_id = t.family_id
  AND c.deleted_at IS NULL
  AND (t.child_id IS NULL OR t.child_id = c.id)
  -- CRITICAL: Check that the task is not disabled for this specific child
  AND (cto.is_enabled IS NULL OR cto.is_enabled = TRUE)
  AND (
    t.frequency = 'daily'
    OR (t.frequency = 'weekly' AND (t.days_of_week IS NULL OR EXTRACT(DOW FROM NOW())::INTEGER = ANY(t.days_of_week)))
    OR t.frequency = 'one_time'
  );

-- Grant SELECT permission to authenticated users
GRANT SELECT ON v_child_today_tasks TO authenticated;
GRANT SELECT ON v_child_today_tasks TO anon;
