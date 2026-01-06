-- Create children table
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  age_group VARCHAR(10) NOT NULL,
  birth_year INT,
  avatar_url TEXT,
  pin_code VARCHAR(4),

  -- Points
  points_balance INT DEFAULT 0,
  points_lifetime_earned INT DEFAULT 0,

  -- Trust level
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
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_children_family_id ON children(family_id);
CREATE INDEX idx_children_age_group ON children(age_group);

-- Enable RLS
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own children"
  ON children FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own children"
  ON children FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
