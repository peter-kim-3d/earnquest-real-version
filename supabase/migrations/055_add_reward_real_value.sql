-- Migration: Add Real Value to Rewards
-- Stores the real dollar value in cents for parent reference

-- Add real_value_cents to rewards table
ALTER TABLE rewards
ADD COLUMN IF NOT EXISTS real_value_cents INTEGER;

-- Add real_value_cents to reward_templates table
ALTER TABLE reward_templates
ADD COLUMN IF NOT EXISTS real_value_cents INTEGER;

COMMENT ON COLUMN rewards.real_value_cents IS
'Real dollar value in cents (e.g., 500 = $5.00). For parent reference only.';

COMMENT ON COLUMN reward_templates.real_value_cents IS
'Real dollar value in cents for reward templates. For parent reference only.';
