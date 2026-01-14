-- Create children table
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  age_group VARCHAR(10) NOT NULL,  -- '5-7', '8-11', '12-14'
  birth_year INT,
  avatar_url TEXT,
  pin_code VARCHAR(4),  -- Optional PIN for child login

  -- Points
  points_balance INT DEFAULT 0,
  points_lifetime_earned INT DEFAULT 0,

  -- Trust Level (Phase 2 feature)
  trust_level INT DEFAULT 1,
  trust_streak_days INT DEFAULT 0,

  -- Settings
  settings JSONB DEFAULT '{
    "weeklyGoal": 500,
    "screenBudgetUsedThisWeek": 0
  }'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT valid_age_group CHECK (age_group IN ('5-7', '8-11', '12-14')),
  CONSTRAINT valid_trust_level CHECK (trust_level BETWEEN 1 AND 3),
  CONSTRAINT valid_points CHECK (points_balance >= 0)
);

-- Indexes
CREATE INDEX idx_children_family_id ON children(family_id);
CREATE INDEX idx_children_age_group ON children(age_group);

-- Enable Row Level Security
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own children"
  ON children FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own children"
  ON children FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- Comments
COMMENT ON TABLE children IS 'Child profiles belonging to families';
COMMENT ON COLUMN children.age_group IS 'Age group for age-appropriate content: 5-7 (kids), 8-11 (default), 12-14 (teens)';
COMMENT ON COLUMN children.trust_level IS 'Trust level 1-3 for auto-approval features (Phase 2)';
COMMENT ON COLUMN children.points_balance IS 'Current QuestPoints balance';
