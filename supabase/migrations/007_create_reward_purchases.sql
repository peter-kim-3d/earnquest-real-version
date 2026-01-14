-- Create reward_purchases table
CREATE TABLE IF NOT EXISTS reward_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  points_spent INTEGER NOT NULL,
  screen_minutes INTEGER, -- Copied from reward at purchase time

  status TEXT NOT NULL DEFAULT 'purchased', -- 'purchased', 'fulfilled', 'cancelled'

  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Parent who granted the reward

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('purchased', 'fulfilled', 'cancelled')),
  CONSTRAINT positive_points_spent CHECK (points_spent >= 0)
);

-- Indexes
CREATE INDEX idx_reward_purchases_reward_id ON reward_purchases(reward_id);
CREATE INDEX idx_reward_purchases_child_id ON reward_purchases(child_id);
CREATE INDEX idx_reward_purchases_family_id ON reward_purchases(family_id);
CREATE INDEX idx_reward_purchases_status ON reward_purchases(status);
CREATE INDEX idx_reward_purchases_purchased_at ON reward_purchases(purchased_at DESC);

-- RLS Policies
ALTER TABLE reward_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family's reward purchases"
  ON reward_purchases FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Children can create their own reward purchases"
  ON reward_purchases FOR INSERT
  WITH CHECK (
    child_id = auth.uid()
  );

CREATE POLICY "Parents can manage their family's reward purchases"
  ON reward_purchases FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_reward_purchases_updated_at
  BEFORE UPDATE ON reward_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE reward_purchases IS 'Records of rewards purchased by children';
COMMENT ON COLUMN reward_purchases.status IS 'purchased = waiting for parent to grant, fulfilled = parent granted, cancelled = refunded';
COMMENT ON COLUMN reward_purchases.screen_minutes IS 'Snapshot of screen minutes at purchase time (for screen rewards)';
