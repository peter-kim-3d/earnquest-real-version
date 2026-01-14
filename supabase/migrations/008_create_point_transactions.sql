-- Create point_transactions table
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  amount INTEGER NOT NULL, -- Positive for earnings, negative for spending
  balance_after INTEGER NOT NULL, -- Balance after this transaction
  type TEXT NOT NULL, -- 'task_completion', 'reward_purchase', 'adjustment', 'bonus', 'penalty'

  reference_type TEXT, -- 'task_completion', 'reward_purchase', etc.
  reference_id UUID, -- ID of the related record

  description TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Parent who created (for manual adjustments)

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_type CHECK (type IN ('task_completion', 'reward_purchase', 'adjustment', 'bonus', 'penalty'))
);

-- Indexes
CREATE INDEX idx_point_transactions_child_id ON point_transactions(child_id);
CREATE INDEX idx_point_transactions_family_id ON point_transactions(family_id);
CREATE INDEX idx_point_transactions_type ON point_transactions(type);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX idx_point_transactions_reference ON point_transactions(reference_type, reference_id);

-- RLS Policies
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family's point transactions"
  ON point_transactions FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Only system can insert point transactions"
  ON point_transactions FOR INSERT
  WITH CHECK (FALSE); -- Enforces using the add_points() function

-- Comments
COMMENT ON TABLE point_transactions IS 'Immutable ledger of all point movements';
COMMENT ON COLUMN point_transactions.amount IS 'Positive = earned, negative = spent';
COMMENT ON COLUMN point_transactions.balance_after IS 'Child balance snapshot after this transaction';
COMMENT ON COLUMN point_transactions.reference_type IS 'Type of record that triggered this transaction';
COMMENT ON COLUMN point_transactions.reference_id IS 'ID of the record that triggered this transaction';
