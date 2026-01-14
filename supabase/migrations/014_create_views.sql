-- View for today's tasks for a child
CREATE OR REPLACE VIEW v_child_today_tasks AS
SELECT
  t.id,
  t.family_id,
  t.child_id,
  t.name,
  t.description,
  t.category,
  t.points,
  t.icon,
  t.frequency,
  t.approval_type,
  t.requires_photo,
  c.name AS child_name,
  -- Check if task was completed today
  (
    SELECT tc.id
    FROM task_completions tc
    WHERE tc.task_id = t.id
      AND tc.child_id = COALESCE(t.child_id, c.id)
      AND tc.requested_at >= date_trunc('day', NOW())
    ORDER BY tc.requested_at DESC
    LIMIT 1
  ) AS today_completion_id,
  (
    SELECT tc.status
    FROM task_completions tc
    WHERE tc.task_id = t.id
      AND tc.child_id = COALESCE(t.child_id, c.id)
      AND tc.requested_at >= date_trunc('day', NOW())
    ORDER BY tc.requested_at DESC
    LIMIT 1
  ) AS today_status
FROM tasks t
CROSS JOIN children c
WHERE t.is_active = TRUE
  AND t.deleted_at IS NULL
  AND c.family_id = t.family_id
  AND (t.child_id IS NULL OR t.child_id = c.id) -- Task for all children or specific child
  AND (
    t.frequency = 'daily'
    OR (t.frequency = 'weekly' AND (t.days_of_week IS NULL OR EXTRACT(DOW FROM NOW())::INTEGER = ANY(t.days_of_week)))
    OR t.frequency = 'one_time'
  );

-- View for pending task approvals
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT
  tc.id AS completion_id,
  tc.task_id,
  tc.child_id,
  tc.family_id,
  tc.status,
  tc.requested_at,
  tc.auto_approve_at,
  tc.proof_image_url,
  tc.note,
  tc.fix_request,
  tc.fix_request_count,
  t.name AS task_name,
  t.description AS task_description,
  t.points,
  t.category,
  t.icon AS task_icon,
  c.name AS child_name,
  c.avatar_url AS child_avatar
FROM task_completions tc
JOIN tasks t ON tc.task_id = t.id
JOIN children c ON tc.child_id = c.id
WHERE tc.status IN ('pending', 'fix_requested')
ORDER BY tc.requested_at ASC;

-- View for weekly screen usage by child
CREATE OR REPLACE VIEW v_weekly_screen_usage AS
SELECT
  c.id AS child_id,
  c.family_id,
  c.name AS child_name,
  COALESCE((c.settings->>'screenBudgetWeeklyMinutes')::INTEGER, 300) AS weekly_budget_minutes,
  COALESCE(SUM(sul.minutes_used), 0) AS minutes_used_this_week,
  COALESCE((c.settings->>'screenBudgetWeeklyMinutes')::INTEGER, 300) - COALESCE(SUM(sul.minutes_used), 0) AS minutes_remaining
FROM children c
LEFT JOIN screen_usage_log sul ON c.id = sul.child_id
  AND sul.created_at >= date_trunc('week', NOW())
GROUP BY c.id, c.family_id, c.name, c.settings;

-- Comments
COMMENT ON VIEW v_child_today_tasks IS 'Shows all tasks for each child today with completion status';
COMMENT ON VIEW v_pending_approvals IS 'Shows all task completions pending parent approval';
COMMENT ON VIEW v_weekly_screen_usage IS 'Shows screen time usage vs budget for current week';
