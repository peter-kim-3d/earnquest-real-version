-- Create kindness_cards table
CREATE TABLE IF NOT EXISTS kindness_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  from_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Parent sender
  from_child_id UUID REFERENCES children(id) ON DELETE SET NULL, -- Child sender
  to_child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE, -- Recipient

  message TEXT NOT NULL,
  action_description TEXT, -- What kind act did the child do?
  theme TEXT DEFAULT 'cosmic', -- 'cosmic', 'nature', 'super_hero', 'love'

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT has_sender CHECK (from_user_id IS NOT NULL OR from_child_id IS NOT NULL),
  CONSTRAINT valid_theme CHECK (theme IN ('cosmic', 'nature', 'super_hero', 'love'))
);

-- Create kindness_badges table
CREATE TABLE IF NOT EXISTS kindness_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  badge_type TEXT NOT NULL, -- 'helper', 'friend', 'caring', 'sharing', etc.
  level INTEGER NOT NULL DEFAULT 1, -- 1, 2, 3 (bronze, silver, gold)
  cards_required INTEGER NOT NULL, -- 5, 10, 20

  earned_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_level CHECK (level >= 1 AND level <= 3)
);

-- Indexes
CREATE INDEX idx_kindness_cards_family_id ON kindness_cards(family_id);
CREATE INDEX idx_kindness_cards_to_child_id ON kindness_cards(to_child_id);
CREATE INDEX idx_kindness_cards_created_at ON kindness_cards(created_at DESC);

CREATE INDEX idx_kindness_badges_child_id ON kindness_badges(child_id);
CREATE INDEX idx_kindness_badges_family_id ON kindness_badges(family_id);
CREATE INDEX idx_kindness_badges_earned_at ON kindness_badges(earned_at DESC);

-- RLS Policies
ALTER TABLE kindness_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kindness_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family's kindness cards"
  ON kindness_cards FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Family members can create kindness cards"
  ON kindness_cards FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view their family's kindness badges"
  ON kindness_badges FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

-- Comments
COMMENT ON TABLE kindness_cards IS 'Gratitude cards sent between family members';
COMMENT ON TABLE kindness_badges IS 'Badges earned by children for receiving kindness cards';
COMMENT ON COLUMN kindness_cards.theme IS 'Visual theme of the card (cosmic, nature, super_hero, love)';
COMMENT ON COLUMN kindness_badges.level IS '1=bronze (5 cards), 2=silver (10 cards), 3=gold (20 cards)';
