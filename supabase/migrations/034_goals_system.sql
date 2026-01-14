-- Migration: Goals System (V1.1)
-- Dedicated goals with deposit tracking, replacing simple savings category

-- ============================================================================
-- 1. Create goals table
-- ============================================================================

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Goal details
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'target',

  -- Point tracking
  target_points INT NOT NULL CHECK (target_points > 0),
  current_points INT NOT NULL DEFAULT 0 CHECK (current_points >= 0),

  -- Tier classification
  tier TEXT CHECK (tier IN ('small', 'medium', 'large', 'xl')),

  -- Status
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Change tracking (for transparency)
  original_target INT,  -- Original target when created
  change_log JSONB DEFAULT '[]'::jsonb,  -- Array of changes with reasons

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ  -- Soft delete
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goals_child_id ON goals(child_id);
CREATE INDEX IF NOT EXISTS idx_goals_family_id ON goals(family_id);
CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(child_id, is_completed) WHERE deleted_at IS NULL;

-- ============================================================================
-- 2. Create goal_deposits table
-- ============================================================================

CREATE TABLE IF NOT EXISTS goal_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Deposit details
  amount INT NOT NULL CHECK (amount > 0),
  balance_after INT NOT NULL,  -- Child's balance after this deposit

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goal_deposits_goal_id ON goal_deposits(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_deposits_child_id ON goal_deposits(child_id);
CREATE INDEX IF NOT EXISTS idx_goal_deposits_created ON goal_deposits(goal_id, created_at DESC);

-- ============================================================================
-- 3. Create function to deposit points to goal
-- ============================================================================

CREATE OR REPLACE FUNCTION deposit_to_goal(
  p_goal_id UUID,
  p_child_id UUID,
  p_amount INT
) RETURNS JSONB AS $$
DECLARE
  v_goal goals;
  v_child children;
  v_new_balance INT;
  v_new_goal_points INT;
  v_is_completed BOOLEAN := FALSE;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Get goal
  SELECT * INTO v_goal
  FROM goals
  WHERE id = p_goal_id
    AND deleted_at IS NULL
    AND is_completed = FALSE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Goal not found or already completed');
  END IF;

  -- Verify child owns this goal
  IF v_goal.child_id != p_child_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Goal does not belong to this child');
  END IF;

  -- Get child's current balance
  SELECT * INTO v_child
  FROM children
  WHERE id = p_child_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Child not found');
  END IF;

  -- Check sufficient balance
  IF v_child.points_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient points',
      'balance', v_child.points_balance,
      'required', p_amount
    );
  END IF;

  -- Deduct points from child
  UPDATE children
  SET
    points_balance = points_balance - p_amount,
    updated_at = now()
  WHERE id = p_child_id
  RETURNING points_balance INTO v_new_balance;

  -- Add points to goal
  UPDATE goals
  SET
    current_points = current_points + p_amount,
    updated_at = now()
  WHERE id = p_goal_id
  RETURNING current_points INTO v_new_goal_points;

  -- Check if goal is completed
  IF v_new_goal_points >= v_goal.target_points THEN
    v_is_completed := TRUE;
    UPDATE goals
    SET
      is_completed = TRUE,
      completed_at = now()
    WHERE id = p_goal_id;
  END IF;

  -- Create deposit record
  INSERT INTO goal_deposits (goal_id, child_id, family_id, amount, balance_after)
  VALUES (p_goal_id, p_child_id, v_goal.family_id, p_amount, v_new_balance);

  -- Create point transaction
  INSERT INTO point_transactions (
    child_id, family_id, amount, balance_after,
    type, reference_type, reference_id, description
  ) VALUES (
    p_child_id, v_goal.family_id, -p_amount, v_new_balance,
    'goal_deposit', 'goal', p_goal_id, 'Deposit to goal: ' || v_goal.name
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'goal_progress', v_new_goal_points,
    'goal_target', v_goal.target_points,
    'is_completed', v_is_completed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. Create function to withdraw from goal (if needed)
-- ============================================================================

CREATE OR REPLACE FUNCTION withdraw_from_goal(
  p_goal_id UUID,
  p_child_id UUID,
  p_amount INT,
  p_reason TEXT DEFAULT 'Withdrawal'
) RETURNS JSONB AS $$
DECLARE
  v_goal goals;
  v_child children;
  v_new_balance INT;
  v_new_goal_points INT;
BEGIN
  -- Get goal
  SELECT * INTO v_goal
  FROM goals
  WHERE id = p_goal_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Goal not found');
  END IF;

  -- Verify ownership
  IF v_goal.child_id != p_child_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Goal does not belong to this child');
  END IF;

  -- Validate amount
  IF p_amount <= 0 OR p_amount > v_goal.current_points THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid withdrawal amount',
      'available', v_goal.current_points
    );
  END IF;

  -- Return points to child
  UPDATE children
  SET
    points_balance = points_balance + p_amount,
    updated_at = now()
  WHERE id = p_child_id
  RETURNING points_balance INTO v_new_balance;

  -- Deduct from goal
  UPDATE goals
  SET
    current_points = current_points - p_amount,
    is_completed = FALSE,  -- Un-complete if was completed
    completed_at = NULL,
    change_log = change_log || jsonb_build_array(jsonb_build_object(
      'action', 'withdrawal',
      'amount', p_amount,
      'reason', p_reason,
      'timestamp', now()
    )),
    updated_at = now()
  WHERE id = p_goal_id
  RETURNING current_points INTO v_new_goal_points;

  -- Create point transaction
  INSERT INTO point_transactions (
    child_id, family_id, amount, balance_after,
    type, reference_type, reference_id, description
  ) VALUES (
    p_child_id, v_goal.family_id, p_amount, v_new_balance,
    'goal_withdrawal', 'goal', p_goal_id, 'Withdrawal from goal: ' || v_goal.name
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'goal_progress', v_new_goal_points,
    'goal_target', v_goal.target_points
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. Create function to update goal target (with transparency)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_goal_target(
  p_goal_id UUID,
  p_new_target INT,
  p_reason TEXT
) RETURNS JSONB AS $$
DECLARE
  v_goal goals;
BEGIN
  IF p_new_target <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Target must be positive');
  END IF;

  IF p_reason IS NULL OR p_reason = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reason is required for target changes');
  END IF;

  SELECT * INTO v_goal
  FROM goals
  WHERE id = p_goal_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Goal not found');
  END IF;

  -- Update with change log
  UPDATE goals
  SET
    target_points = p_new_target,
    tier = CASE
      WHEN p_new_target <= 100 THEN 'small'
      WHEN p_new_target <= 200 THEN 'medium'
      WHEN p_new_target <= 500 THEN 'large'
      ELSE 'xl'
    END,
    change_log = change_log || jsonb_build_array(jsonb_build_object(
      'action', 'target_change',
      'old_target', v_goal.target_points,
      'new_target', p_new_target,
      'reason', p_reason,
      'timestamp', now()
    )),
    is_completed = current_points >= p_new_target,
    completed_at = CASE WHEN current_points >= p_new_target THEN now() ELSE NULL END,
    updated_at = now()
  WHERE id = p_goal_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_target', p_new_target,
    'message', 'Target updated. Child will see the change reason.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Create view for goal progress
-- ============================================================================

CREATE OR REPLACE VIEW v_child_goals AS
SELECT
  g.id,
  g.child_id,
  g.family_id,
  g.name,
  g.description,
  g.icon,
  g.target_points,
  g.current_points,
  g.tier,
  g.is_completed,
  g.completed_at,
  g.original_target,
  g.change_log,
  g.created_at,
  ROUND((g.current_points::NUMERIC / g.target_points) * 100, 1) AS progress_percent,
  (g.target_points - g.current_points) AS points_remaining,
  c.name AS child_name,
  c.points_balance AS available_balance
FROM goals g
JOIN children c ON g.child_id = c.id
WHERE g.deleted_at IS NULL AND c.deleted_at IS NULL;

-- ============================================================================
-- 7. RLS Policies for goals
-- ============================================================================

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view family goals"
  ON goals FOR SELECT
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can insert goals"
  ON goals FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can update goals"
  ON goals FOR UPDATE
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can delete goals"
  ON goals FOR DELETE
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

-- ============================================================================
-- 8. RLS Policies for goal_deposits
-- ============================================================================

ALTER TABLE goal_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view family deposits"
  ON goal_deposits FOR SELECT
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

-- Deposits are created via SECURITY DEFINER function
CREATE POLICY "Service role can insert deposits"
  ON goal_deposits FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 9. Add goal_deposit type to point_transactions
-- ============================================================================

-- The type column in point_transactions already accepts various types
-- Just ensure 'goal_deposit' and 'goal_withdrawal' are handled

COMMENT ON TABLE goals IS 'Long-term saving goals for children. Points deposited are locked until goal completion.';
COMMENT ON TABLE goal_deposits IS 'Individual deposit records for goals, maintaining audit trail.';
