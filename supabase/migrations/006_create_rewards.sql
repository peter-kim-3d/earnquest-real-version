-- Create rewards table
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL, -- NULL means reward is for all children

  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'screen', 'autonomy', 'experience', 'savings'
  points_cost INTEGER NOT NULL,
  icon TEXT, -- Material Symbol icon name
  image_url TEXT,

  -- Screen time specific
  screen_minutes INTEGER, -- Only for screen rewards

  -- Purchase limits
  weekly_limit INTEGER, -- Max purchases per week, NULL = unlimited

  settings JSONB DEFAULT '{}', -- { "color": "#3b82f6", "requires_parent_approval": true, etc. }
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT valid_category CHECK (category IN ('screen', 'autonomy', 'experience', 'savings')),
  CONSTRAINT positive_points_cost CHECK (points_cost >= 0),
  CONSTRAINT screen_minutes_required CHECK (
    (category = 'screen' AND screen_minutes IS NOT NULL AND screen_minutes > 0)
    OR category != 'screen'
  )
);

-- Indexes
CREATE INDEX idx_rewards_family_id ON rewards(family_id);
CREATE INDEX idx_rewards_child_id ON rewards(child_id);
CREATE INDEX idx_rewards_category ON rewards(category);
CREATE INDEX idx_rewards_active ON rewards(is_active) WHERE deleted_at IS NULL;

-- RLS Policies
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family's rewards"
  ON rewards FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage their family's rewards"
  ON rewards FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE rewards IS 'Rewards that children can purchase with their points';
COMMENT ON COLUMN rewards.category IS 'screen = screen time, autonomy = freedoms, experience = activities, savings = save towards a goal';
COMMENT ON COLUMN rewards.screen_minutes IS 'Minutes of screen time granted (only for screen category)';
COMMENT ON COLUMN rewards.weekly_limit IS 'Maximum purchases per week per child. NULL = unlimited';
