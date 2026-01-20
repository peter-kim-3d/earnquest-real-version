-- Migration: Update v_child_goals view with new columns
-- Includes milestone and real value fields

DROP VIEW IF EXISTS v_child_goals;

CREATE OR REPLACE VIEW v_child_goals AS
SELECT
  g.id,
  g.child_id,
  g.family_id,
  g.name,
  g.description,
  g.icon,
  g.target_points,
  g.current_points,
  g.tier,
  g.is_completed,
  g.completed_at,
  g.original_target,
  g.change_log,
  g.real_value_cents,
  g.parent_contribution_cents,
  g.milestone_bonuses,
  g.milestones_completed,
  g.created_at,
  ROUND((g.current_points::NUMERIC / NULLIF(g.target_points, 0)) * 100, 1) AS progress_percent,
  GREATEST(g.target_points - g.current_points, 0) AS points_remaining,
  c.name AS child_name,
  c.points_balance AS available_balance
FROM goals g
JOIN children c ON g.child_id = c.id
WHERE g.deleted_at IS NULL AND c.deleted_at IS NULL;

COMMENT ON VIEW v_child_goals IS
'View for goal progress with milestone support. Real value fields are for parent display only.';
