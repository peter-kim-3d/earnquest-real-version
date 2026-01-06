-- Create kindness_cards table
CREATE TABLE kindness_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- From/To
  from_user_id UUID REFERENCES users(id),
  from_child_id UUID REFERENCES children(id),
  to_child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  -- Content
  message TEXT NOT NULL,
  action_description TEXT,

  -- Weekly bonus selection
  is_weekly_bonus BOOLEAN DEFAULT false,
  bonus_points INT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_kindness_cards_to_child ON kindness_cards(to_child_id);
CREATE INDEX idx_kindness_cards_family_id ON kindness_cards(family_id);
CREATE INDEX idx_kindness_cards_created_at ON kindness_cards(created_at);

-- Enable RLS
ALTER TABLE kindness_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family kindness cards"
  ON kindness_cards FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own family kindness cards"
  ON kindness_cards FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- Create kindness_badges table
CREATE TABLE kindness_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Badge info
  badge_type VARCHAR(50) DEFAULT 'kindness',
  badge_number INT NOT NULL,

  -- Earning criteria (5 kindness cards)
  cards_counted INT DEFAULT 5,

  -- Metadata
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_kindness_badges_child_id ON kindness_badges(child_id);

-- Enable RLS
ALTER TABLE kindness_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family kindness badges"
  ON kindness_badges FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own family kindness badges"
  ON kindness_badges FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
