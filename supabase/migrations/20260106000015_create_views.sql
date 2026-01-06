-- View: Child's today tasks
CREATE VIEW v_child_today_tasks AS
SELECT
  t.id,
  t.family_id,
  t.child_id,
  t.name,
  t.category,
  t.points,
  t.approval_type,
  t.is_trust_task,
  c.name as child_name,
  c.trust_level,
  -- Check if completed today
  EXISTS (
    SELECT 1 FROM task_completions tc
    WHERE tc.task_id = t.id
    AND tc.child_id = COALESCE(t.child_id, tc.child_id)
    AND DATE(tc.requested_at) = CURRENT_DATE
    AND tc.status IN ('pending', 'approved', 'auto_approved')
  ) as completed_today
FROM tasks t
LEFT JOIN children c ON t.child_id = c.id
WHERE t.is_active = true
AND t.deleted_at IS NULL;

-- View: Pending approvals (for parents)
CREATE VIEW v_pending_approvals AS
SELECT
  tc.id,
  tc.task_id,
  tc.child_id,
  tc.family_id,
  tc.status,
  tc.requested_at,
  tc.auto_approve_at,
  tc.fix_request_count,
  t.name as task_name,
  t.points,
  c.name as child_name,
  c.avatar_url as child_avatar
FROM task_completions tc
JOIN tasks t ON tc.task_id = t.id
JOIN children c ON tc.child_id = c.id
WHERE tc.status IN ('pending', 'fix_requested')
ORDER BY tc.requested_at DESC;

-- View: Weekly screen usage
CREATE VIEW v_weekly_screen_usage AS
SELECT
  rp.child_id,
  rp.family_id,
  DATE_TRUNC('week', rp.purchased_at)::DATE as week_start,
  SUM(r.screen_minutes) as total_screen_minutes,
  COUNT(*) as screen_purchases
FROM reward_purchases rp
JOIN rewards r ON rp.reward_id = r.id
WHERE r.is_screen_reward = true
AND rp.status != 'cancelled'
GROUP BY rp.child_id, rp.family_id, DATE_TRUNC('week', rp.purchased_at)::DATE;

-- View: Child dashboard stats
CREATE VIEW v_child_dashboard AS
SELECT
  c.id as child_id,
  c.family_id,
  c.name,
  c.avatar_url,
  c.points_balance,
  c.points_lifetime_earned,
  c.trust_level,
  c.trust_streak_days,
  -- Today's completed tasks
  (SELECT COUNT(*)
   FROM task_completions tc
   WHERE tc.child_id = c.id
   AND DATE(tc.requested_at) = CURRENT_DATE
   AND tc.status IN ('approved', 'auto_approved')) as tasks_completed_today,
  -- Pending approvals
  (SELECT COUNT(*)
   FROM task_completions tc
   WHERE tc.child_id = c.id
   AND tc.status = 'pending') as tasks_pending_approval,
  -- This week's points
  (SELECT COALESCE(SUM(amount), 0)
   FROM point_transactions pt
   WHERE pt.child_id = c.id
   AND pt.amount > 0
   AND DATE_TRUNC('week', pt.created_at) = DATE_TRUNC('week', CURRENT_DATE)) as points_earned_this_week,
  -- Screen time this week
  (SELECT COALESCE(SUM(r.screen_minutes), 0)
   FROM reward_purchases rp
   JOIN rewards r ON rp.reward_id = r.id
   WHERE rp.child_id = c.id
   AND r.is_screen_reward = true
   AND rp.status != 'cancelled'
   AND DATE_TRUNC('week', rp.purchased_at) = DATE_TRUNC('week', CURRENT_DATE)) as screen_minutes_this_week,
  -- Kindness cards received this week
  (SELECT COUNT(*)
   FROM kindness_cards kc
   WHERE kc.to_child_id = c.id
   AND DATE_TRUNC('week', kc.created_at) = DATE_TRUNC('week', CURRENT_DATE)) as kindness_cards_this_week
FROM children c
WHERE c.deleted_at IS NULL;
