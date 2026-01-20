-- Migration: Double Template Points
-- Doubles all task and reward template points for v2 economy

-- Double task template points
UPDATE task_templates
SET points = points * 2
WHERE is_active = TRUE;

-- Double reward template point costs
UPDATE reward_templates
SET points_cost = points_cost * 2
WHERE is_active = TRUE;

-- Log the change
COMMENT ON TABLE task_templates IS
'Task templates with doubled point values (v2 economy update). Expected daily earnings: ~200-240 pts.';

COMMENT ON TABLE reward_templates IS
'Reward templates with doubled point costs (v2 economy update).';
