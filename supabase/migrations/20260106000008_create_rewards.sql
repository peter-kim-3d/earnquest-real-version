-- Create rewards table
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  template_id UUID REFERENCES reward_templates(id),

  -- Classification
  category VARCHAR(20) NOT NULL,

  -- Content
  name VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50),

  -- Points
  points INT NOT NULL,

  -- Limits
  weekly_limit INT,
  is_screen_reward BOOLEAN DEFAULT false,
  screen_minutes INT,

  -- Parent action required
  requires_parent_action BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_rewards_family_id ON rewards(family_id);
CREATE INDEX idx_rewards_category ON rewards(category);

-- Enable RLS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family rewards"
  ON rewards FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own family rewards"
  ON rewards FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
