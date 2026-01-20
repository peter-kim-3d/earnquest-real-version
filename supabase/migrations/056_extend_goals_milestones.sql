-- Migration: Extend Goals System with Milestones
-- Adds milestone bonuses, real value tracking, and parent contribution

-- Add new columns to goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS real_value_cents INTEGER;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS parent_contribution_cents INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS milestone_bonuses JSONB DEFAULT '{}';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS milestones_completed JSONB DEFAULT '[]';

-- Add type column to goal_deposits
ALTER TABLE goal_deposits ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'deposit'
  CHECK (type IN ('deposit', 'milestone_bonus', 'parent_match', 'withdrawal'));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_goals_milestones ON goals USING GIN (milestone_bonuses);

COMMENT ON COLUMN goals.real_value_cents IS
'Real dollar value in cents (e.g., 2000 = $20.00). For parent reference only, not shown to children.';

COMMENT ON COLUMN goals.parent_contribution_cents IS
'Parent contribution in cents. For parent reference only.';

COMMENT ON COLUMN goals.milestone_bonuses IS
'Milestone bonus configuration: { "25": 10, "50": 20, "75": 30 } means 10 pts at 25%, 20 pts at 50%, etc.';

COMMENT ON COLUMN goals.milestones_completed IS
'Array of completed milestone percentages: [25, 50] means 25% and 50% milestones reached.';

COMMENT ON COLUMN goal_deposits.type IS
'Type of deposit: deposit (child savings), milestone_bonus (auto-awarded), parent_match, or withdrawal.';
