-- Fix v_child_today_tasks view to include auto_assign and task instance fields
-- This fixes the 400 error when completing auto_assign tasks

-- Drop the old view first
DROP VIEW IF EXISTS v_child_today_tasks;

-- Recreate with auto_assign and instance fields
CREATE VIEW v_child_today_tasks AS
SELECT
  t.id,
  t.family_id,
  c.id AS child_id,
  t.child_id AS task_child_id,
  t.name,
  t.description,
  t.category,
  t.time_context,
  t.points,
  t.icon,
  t.image_url,
  t.frequency,
  t.approval_type,
  t.requires_photo,
  t.timer_minutes,
  t.checklist,
  t.metadata,
  t.auto_assign,
  c.name AS child_name,
  -- Instance fields for auto_assign tasks
  ti.id AS instance_id,
  ti.status AS instance_status,
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
-- Left join with task_instances to get instance info for auto_assign tasks
LEFT JOIN task_instances ti ON ti.task_id = t.id
  AND ti.child_id = c.id
  AND ti.status = 'pending'
  AND ti.scheduled_date = CURRENT_DATE
WHERE t.is_active = TRUE
  AND t.deleted_at IS NULL
  AND c.family_id = t.family_id
  AND c.deleted_at IS NULL
  AND (t.child_id IS NULL OR t.child_id = c.id)
  AND (cto.is_enabled IS NULL OR cto.is_enabled = TRUE)
  AND (
    t.frequency = 'daily'
    OR (t.frequency = 'weekly' AND (t.days_of_week IS NULL OR EXTRACT(DOW FROM NOW())::INTEGER = ANY(t.days_of_week)))
    OR t.frequency = 'one_time'
  )
  -- For auto_assign tasks, only show if there's a pending instance
  AND (t.auto_assign = FALSE OR ti.id IS NOT NULL);

-- Grant SELECT permission
GRANT SELECT ON v_child_today_tasks TO authenticated;
GRANT SELECT ON v_child_today_tasks TO anon;
