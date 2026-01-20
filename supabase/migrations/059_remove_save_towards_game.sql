-- Migration: Remove "Save Towards Game" reward template
-- This is now replaced by the Goals system

-- Delete from reward templates
DELETE FROM reward_templates
WHERE name = 'Save Towards Game' OR name = 'Save for Later';

-- Soft delete any existing rewards with this name
UPDATE rewards
SET deleted_at = now()
WHERE name = 'Save Towards Game' OR name = 'Save for Later';
