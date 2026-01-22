-- Weekly tasks: Show until completed for each scheduled slot
--
-- Previous behavior: Only show on the exact scheduled day(s)
-- New behavior: Show until completed, then hide until next scheduled day
--
-- Logic:
-- 1. Count how many scheduled days have passed this week (including today)
-- 2. Count how many completions (pending/approved) this week
-- 3. If completions < passed scheduled days → Show the task
--
-- Example with days_of_week = [1, 3, 5] (Mon, Wed, Fri):
-- - Monday: passed=1, completions=0 → Show
-- - Monday (after done): passed=1, completions=1 → Hide
-- - Tuesday: passed=1, completions=1 → Hide
-- - Wednesday: passed=2, completions=1 → Show (new slot)
-- - Thursday (not done Wed): passed=2, completions=1 → Still show
-- - Friday: passed=3, completions=2 → Show

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
      AND tc.requested_at >= (
        date_trunc('day', NOW() AT TIME ZONE COALESCE(f.settings->>'timezone', 'UTC'))
        AT TIME ZONE COALESCE(f.settings->>'timezone', 'UTC')
      )
    ORDER BY tc.requested_at DESC
    LIMIT 1
  ) AS today_status
FROM tasks t
CROSS JOIN children c
JOIN families f ON f.id = t.family_id
LEFT JOIN child_task_overrides cto ON cto.task_id = t.id AND cto.child_id = c.id
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
    -- Daily tasks: always show
    t.frequency = 'daily'

    -- Weekly tasks: show until completed for each scheduled slot
    OR (t.frequency = 'weekly' AND (
      -- If days_of_week is NULL, treat as daily (backward compat)
      t.days_of_week IS NULL
      OR (
        -- Count scheduled days that have passed (including today)
        -- compared to completions this week
        --
        -- Note: days_of_week uses 0=Sun, 1=Mon, ..., 6=Sat
        -- PostgreSQL date_trunc('week') starts Monday (ISO 8601)
        -- We convert Sunday (0) to 7 for proper comparison
        (
          SELECT COUNT(*)
          FROM unnest(t.days_of_week) AS dow
          WHERE (CASE WHEN dow = 0 THEN 7 ELSE dow END) <= (
            CASE
              WHEN EXTRACT(DOW FROM NOW() AT TIME ZONE COALESCE(f.settings->>'timezone', 'UTC'))::INTEGER = 0
              THEN 7
              ELSE EXTRACT(DOW FROM NOW() AT TIME ZONE COALESCE(f.settings->>'timezone', 'UTC'))::INTEGER
            END
          )
        ) > (
          SELECT COUNT(*)
          FROM task_completions tc
          WHERE tc.task_id = t.id
            AND tc.child_id = c.id
            AND tc.status IN ('pending', 'approved')
            AND tc.requested_at >= (
              -- Start of current week (Monday per ISO 8601)
              date_trunc('week', NOW() AT TIME ZONE COALESCE(f.settings->>'timezone', 'UTC'))
              AT TIME ZONE COALESCE(f.settings->>'timezone', 'UTC')
            )
        )
      )
    ))

    -- One-time tasks: always show until completed
    OR t.frequency = 'one_time'

    -- Monthly tasks: show on scheduled days
    OR t.frequency = 'monthly'
  );

-- Grant SELECT permissions
GRANT SELECT ON v_child_today_tasks TO authenticated;
GRANT SELECT ON v_child_today_tasks TO anon;
GRANT SELECT ON v_child_today_tasks TO service_role;

COMMENT ON VIEW v_child_today_tasks IS
'Child tasks for today. Weekly tasks show until completed for each scheduled slot within the week.';
