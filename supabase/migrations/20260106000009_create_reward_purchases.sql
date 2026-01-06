-- Create reward_purchases table (tickets)
CREATE TABLE reward_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Purchase time info
  reward_name VARCHAR(200) NOT NULL,
  points_spent INT NOT NULL,

  -- Ticket status
  status VARCHAR(20) DEFAULT 'purchased',

  -- Fulfillment info
  fulfilled_by UUID REFERENCES users(id),
  fulfilled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Metadata
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reward_purchases_child_id ON reward_purchases(child_id);
CREATE INDEX idx_reward_purchases_family_id ON reward_purchases(family_id);
CREATE INDEX idx_reward_purchases_status ON reward_purchases(status);

-- Enable RLS
ALTER TABLE reward_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family reward purchases"
  ON reward_purchases FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own family reward purchases"
  ON reward_purchases FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
