-- Fix v_child_today_tasks view timezone comparison bug
--
-- Bug: The view compares timestamptz (requested_at in UTC) with timestamp without timezone
-- (date_trunc result). PostgreSQL converts the timestamp to UTC using session timezone,
-- which gives incorrect results.
--
-- Example for America/New_York (UTC-5):
-- - Current: Jan 21, 6 PM EST = Jan 22, 11 PM UTC
-- - Old logic: requested_at >= '2026-01-21 00:00:00' (interpreted as UTC)
-- - Correct: requested_at >= '2026-01-21 05:00:00 UTC' (midnight EST in UTC)
--
-- Fix: Convert the truncated timestamp back to timestamptz in the family's timezone

DROP VIEW IF EXISTS v_child_today_tasks;

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
  -- Instance fields (optional, for future use)
  ti.id AS instance_id,
  ti.status AS instance_status,
  (
    SELECT tc.id
    FROM task_completions tc
    WHERE tc.task_id = t.id
      AND tc.child_id = c.id
      -- Fix: Convert truncated timestamp back to timestamptz for proper comparison
      AND tc.requested_at >= (
        date_trunc('day', NOW() AT TIME ZONE COALESCE(f.settings->>'timezone', 'UTC'))
        AT TIME ZONE COALESCE(f.settings->>'timezone', 'UTC')
      )
    ORDER BY tc.requested_at DESC
    LIMIT 1
  ) AS today_completion_id,
  (
    SELECT tc.status
    FROM task_completions tc
    WHERE tc.task_id = t.id
      AND tc.child_id = c.id
      -- Fix: Convert truncated timestamp back to timestamptz for proper comparison
      AND tc.requested_at >= (
        date_trunc('day', NOW() AT TIME ZONE COALESCE(f.settings->>'timezone', 'UTC'))
        AT TIME ZONE COALESCE(f.settings->>'timezone', 'UTC')
      )
    ORDER BY tc.requested_at DESC
    LIMIT 1
  ) AS today_status
FROM tasks t
CROSS JOIN children c
-- Join families to get timezone setting
JOIN families f ON f.id = t.family_id
LEFT JOIN child_task_overrides cto ON cto.task_id = t.id AND cto.child_id = c.id
-- Left join with task_instances (optional, doesn't filter out tasks)
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
  -- Show tasks based on frequency rules
  -- Use family timezone for day-of-week extraction
  AND (
    t.frequency = 'daily'
    OR (t.frequency = 'weekly' AND (
      t.days_of_week IS NULL
      OR EXTRACT(DOW FROM NOW() AT TIME ZONE COALESCE(f.settings->>'timezone', 'UTC'))::INTEGER = ANY(t.days_of_week)
    ))
    OR t.frequency = 'one_time'
    OR t.frequency = 'monthly'
  );

-- Grant SELECT permissions
GRANT SELECT ON v_child_today_tasks TO authenticated;
GRANT SELECT ON v_child_today_tasks TO anon;
GRANT SELECT ON v_child_today_tasks TO service_role;

COMMENT ON VIEW v_child_today_tasks IS
'Child tasks for today with proper timezone handling. Uses family timezone setting for day boundaries.';
