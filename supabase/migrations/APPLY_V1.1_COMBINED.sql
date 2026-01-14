-- ============================================================================
-- EarnQuest V1.1 Combined Migration
-- Run this in Supabase SQL Editor to apply all V1.1 changes
-- ============================================================================

-- ============================================================================
-- PART 1: Screen Time Budget System
-- ============================================================================

CREATE TABLE IF NOT EXISTS screen_time_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  base_minutes INT NOT NULL DEFAULT 180,
  bonus_minutes INT NOT NULL DEFAULT 0,
  used_minutes INT NOT NULL DEFAULT 0,
  daily_limit_minutes INT NOT NULL DEFAULT 60,
  cooldown_minutes INT NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(child_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_screen_time_budgets_child_id ON screen_time_budgets(child_id);
CREATE INDEX IF NOT EXISTS idx_screen_time_budgets_family_id ON screen_time_budgets(family_id);
CREATE INDEX IF NOT EXISTS idx_screen_time_budgets_week ON screen_time_budgets(child_id, week_start_date DESC);

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS screen_bonus_minutes INT DEFAULT NULL;

CREATE OR REPLACE FUNCTION get_week_start_date(
  p_family_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS DATE AS $$
DECLARE
  v_week_starts_on TEXT;
  v_dow INT;
  v_target_dow INT;
BEGIN
  SELECT COALESCE(settings->>'weekStartsOn', 'monday')
  INTO v_week_starts_on
  FROM families
  WHERE id = p_family_id;

  v_target_dow := CASE v_week_starts_on
    WHEN 'sunday' THEN 0
    WHEN 'monday' THEN 1
    WHEN 'tuesday' THEN 2
    WHEN 'wednesday' THEN 3
    WHEN 'thursday' THEN 4
    WHEN 'friday' THEN 5
    WHEN 'saturday' THEN 6
    ELSE 1
  END;

  v_dow := EXTRACT(DOW FROM p_date)::INT;
  RETURN p_date - ((v_dow - v_target_dow + 7) % 7);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_or_create_screen_budget(
  p_child_id UUID,
  p_family_id UUID DEFAULT NULL
) RETURNS screen_time_budgets AS $$
DECLARE
  v_child RECORD;
  v_week_start DATE;
  v_budget screen_time_budgets;
  v_base_minutes INT;
  v_daily_limit INT;
  v_cooldown INT;
BEGIN
  SELECT c.*, f.id as fam_id
  INTO v_child
  FROM children c
  JOIN families f ON c.family_id = f.id
  WHERE c.id = p_child_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Child not found: %', p_child_id;
  END IF;

  v_week_start := get_week_start_date(v_child.fam_id);

  SELECT * INTO v_budget
  FROM screen_time_budgets
  WHERE child_id = p_child_id AND week_start_date = v_week_start;

  IF FOUND THEN
    RETURN v_budget;
  END IF;

  v_base_minutes := COALESCE((v_child.settings->>'screenBudgetWeeklyMinutes')::INT, 180);
  v_daily_limit := COALESCE((v_child.settings->>'screenDailyLimitMinutes')::INT, 60);
  v_cooldown := COALESCE((v_child.settings->>'screenCooldownMinutes')::INT, 30);

  INSERT INTO screen_time_budgets (
    child_id, family_id, week_start_date,
    base_minutes, bonus_minutes, used_minutes,
    daily_limit_minutes, cooldown_minutes
  ) VALUES (
    p_child_id, v_child.fam_id, v_week_start,
    v_base_minutes, 0, 0,
    v_daily_limit, v_cooldown
  )
  RETURNING * INTO v_budget;

  RETURN v_budget;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_screen_time_bonus(
  p_child_id UUID,
  p_minutes INT,
  p_task_id UUID DEFAULT NULL
) RETURNS INT AS $$
DECLARE
  v_budget screen_time_budgets;
  v_new_bonus INT;
BEGIN
  IF p_minutes <= 0 THEN
    RETURN 0;
  END IF;

  v_budget := get_or_create_screen_budget(p_child_id);

  UPDATE screen_time_budgets
  SET
    bonus_minutes = bonus_minutes + p_minutes,
    updated_at = now()
  WHERE id = v_budget.id
  RETURNING bonus_minutes INTO v_new_bonus;

  RETURN v_new_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION use_screen_time(
  p_child_id UUID,
  p_minutes INT
) RETURNS JSONB AS $$
DECLARE
  v_budget screen_time_budgets;
  v_total_available INT;
  v_today_used INT;
  v_remaining_today INT;
  v_actual_minutes INT;
BEGIN
  v_budget := get_or_create_screen_budget(p_child_id);
  v_total_available := v_budget.base_minutes + v_budget.bonus_minutes - v_budget.used_minutes;

  IF v_total_available <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No screen time remaining this week',
      'remaining_weekly', 0,
      'remaining_today', 0
    );
  END IF;

  SELECT COALESCE(SUM(minutes_used), 0)
  INTO v_today_used
  FROM screen_usage_log
  WHERE child_id = p_child_id
    AND DATE(started_at) = CURRENT_DATE;

  v_remaining_today := v_budget.daily_limit_minutes - v_today_used;

  IF v_remaining_today <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Daily screen time limit reached',
      'remaining_weekly', v_total_available,
      'remaining_today', 0
    );
  END IF;

  v_actual_minutes := LEAST(p_minutes, v_total_available, v_remaining_today);

  UPDATE screen_time_budgets
  SET
    used_minutes = used_minutes + v_actual_minutes,
    updated_at = now()
  WHERE id = v_budget.id;

  INSERT INTO screen_usage_log (child_id, family_id, minutes_used, started_at)
  VALUES (p_child_id, v_budget.family_id, v_actual_minutes, now());

  RETURN jsonb_build_object(
    'success', true,
    'minutes_used', v_actual_minutes,
    'remaining_weekly', v_total_available - v_actual_minutes,
    'remaining_today', v_remaining_today - v_actual_minutes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE screen_time_budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view family screen budgets" ON screen_time_budgets;
CREATE POLICY "Parents can view family screen budgets"
  ON screen_time_budgets FOR SELECT
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Parents can update family screen budgets" ON screen_time_budgets;
CREATE POLICY "Parents can update family screen budgets"
  ON screen_time_budgets FOR UPDATE
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Children can view own screen budget" ON screen_time_budgets;
CREATE POLICY "Children can view own screen budget"
  ON screen_time_budgets FOR SELECT
  USING (child_id IN (
    SELECT id FROM children WHERE family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  ));

DROP POLICY IF EXISTS "Service role can insert budgets" ON screen_time_budgets;
CREATE POLICY "Service role can insert budgets"
  ON screen_time_budgets FOR INSERT
  WITH CHECK (true);

UPDATE families
SET settings = COALESCE(settings, '{}'::jsonb) || '{"weekStartsOn": "monday"}'::jsonb
WHERE settings->>'weekStartsOn' IS NULL;

-- ============================================================================
-- PART 2: Goals System
-- ============================================================================

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'target',
  target_points INT NOT NULL CHECK (target_points > 0),
  current_points INT NOT NULL DEFAULT 0 CHECK (current_points >= 0),
  tier TEXT CHECK (tier IN ('small', 'medium', 'large', 'xl')),
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  original_target INT,
  change_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_goals_child_id ON goals(child_id);
CREATE INDEX IF NOT EXISTS idx_goals_family_id ON goals(family_id);
CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(child_id, is_completed) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS goal_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  amount INT NOT NULL CHECK (amount > 0),
  balance_after INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_goal_deposits_goal_id ON goal_deposits(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_deposits_child_id ON goal_deposits(child_id);
CREATE INDEX IF NOT EXISTS idx_goal_deposits_created ON goal_deposits(goal_id, created_at DESC);

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
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  SELECT * INTO v_goal
  FROM goals
  WHERE id = p_goal_id
    AND deleted_at IS NULL
    AND is_completed = FALSE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Goal not found or already completed');
  END IF;

  IF v_goal.child_id != p_child_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Goal does not belong to this child');
  END IF;

  SELECT * INTO v_child
  FROM children
  WHERE id = p_child_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Child not found');
  END IF;

  IF v_child.points_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient points',
      'balance', v_child.points_balance,
      'required', p_amount
    );
  END IF;

  UPDATE children
  SET
    points_balance = points_balance - p_amount,
    updated_at = now()
  WHERE id = p_child_id
  RETURNING points_balance INTO v_new_balance;

  UPDATE goals
  SET
    current_points = current_points + p_amount,
    updated_at = now()
  WHERE id = p_goal_id
  RETURNING current_points INTO v_new_goal_points;

  IF v_new_goal_points >= v_goal.target_points THEN
    v_is_completed := TRUE;
    UPDATE goals
    SET
      is_completed = TRUE,
      completed_at = now()
    WHERE id = p_goal_id;
  END IF;

  INSERT INTO goal_deposits (goal_id, child_id, family_id, amount, balance_after)
  VALUES (p_goal_id, p_child_id, v_goal.family_id, p_amount, v_new_balance);

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

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view family goals" ON goals;
CREATE POLICY "Parents can view family goals"
  ON goals FOR SELECT
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Parents can insert goals" ON goals;
CREATE POLICY "Parents can insert goals"
  ON goals FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Parents can update goals" ON goals;
CREATE POLICY "Parents can update goals"
  ON goals FOR UPDATE
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Parents can delete goals" ON goals;
CREATE POLICY "Parents can delete goals"
  ON goals FOR DELETE
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

ALTER TABLE goal_deposits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents can view family deposits" ON goal_deposits;
CREATE POLICY "Parents can view family deposits"
  ON goal_deposits FOR SELECT
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Service role can insert deposits" ON goal_deposits;
CREATE POLICY "Service role can insert deposits"
  ON goal_deposits FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- PART 3: Tier System & Category Consolidation
-- ============================================================================

ALTER TABLE rewards ADD COLUMN IF NOT EXISTS tier TEXT
  CHECK (tier IN ('small', 'medium', 'large', 'xl'));

ALTER TABLE rewards ADD COLUMN IF NOT EXISTS approval_type TEXT
  DEFAULT 'instant'
  CHECK (approval_type IN ('instant', 'approval_required'));

UPDATE rewards
SET tier = CASE
  WHEN points_cost <= 100 THEN 'small'
  WHEN points_cost <= 200 THEN 'medium'
  WHEN points_cost <= 500 THEN 'large'
  ELSE 'xl'
END
WHERE tier IS NULL;

UPDATE rewards
SET approval_type = CASE
  WHEN category IN ('autonomy', 'savings') THEN 'instant'
  WHEN category IN ('experience', 'item') THEN 'approval_required'
  WHEN category = 'screen' THEN 'instant'
  ELSE 'instant'
END
WHERE approval_type IS NULL OR approval_type = 'instant';

CREATE OR REPLACE FUNCTION calculate_tier(p_points INT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN p_points <= 100 THEN 'small'
    WHEN p_points <= 200 THEN 'medium'
    WHEN p_points <= 500 THEN 'large'
    ELSE 'xl'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION set_reward_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tier IS NULL OR (TG_OP = 'UPDATE' AND OLD.points_cost != NEW.points_cost) THEN
    NEW.tier := calculate_tier(NEW.points_cost);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_set_reward_tier ON rewards;
CREATE TRIGGER tr_set_reward_tier
  BEFORE INSERT OR UPDATE ON rewards
  FOR EACH ROW
  EXECUTE FUNCTION set_reward_tier();

ALTER TABLE reward_purchases ADD COLUMN IF NOT EXISTS auto_refund_at TIMESTAMPTZ;
ALTER TABLE reward_purchases ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE reward_purchases ADD COLUMN IF NOT EXISTS refund_reason TEXT;

CREATE OR REPLACE FUNCTION process_expired_approvals()
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_purchase RECORD;
BEGIN
  FOR v_purchase IN
    SELECT rp.*, r.name AS reward_name, c.family_id
    FROM reward_purchases rp
    JOIN rewards r ON rp.reward_id = r.id
    JOIN children c ON rp.child_id = c.id
    WHERE rp.status IN ('pending_approval', 'use_requested')
      AND rp.auto_refund_at IS NOT NULL
      AND rp.auto_refund_at < NOW()
      AND rp.refunded_at IS NULL
  LOOP
    UPDATE children
    SET points_balance = points_balance + v_purchase.points_spent
    WHERE id = v_purchase.child_id;

    UPDATE reward_purchases
    SET
      status = 'cancelled',
      refunded_at = NOW(),
      refund_reason = 'Auto-refund: Parent did not respond within 48 hours'
    WHERE id = v_purchase.id;

    INSERT INTO point_transactions (
      child_id, family_id, amount, balance_after,
      type, reference_type, reference_id, description
    )
    SELECT
      v_purchase.child_id,
      v_purchase.family_id,
      v_purchase.points_spent,
      c.points_balance,
      'refund',
      'reward_purchase',
      v_purchase.id,
      'Auto-refund: ' || v_purchase.reward_name
    FROM children c WHERE c.id = v_purchase.child_id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 4: Auto-Refund Timeout Setup
-- ============================================================================

-- Update request_ticket_use function to set auto_refund_at
CREATE OR REPLACE FUNCTION request_ticket_use(
  p_purchase_id UUID,
  p_child_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_purchase reward_purchases%ROWTYPE;
  v_reward rewards%ROWTYPE;
  v_pending_count INTEGER;
BEGIN
  -- Get purchase record
  SELECT * INTO v_purchase
  FROM reward_purchases
  WHERE id = p_purchase_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Ticket not found');
  END IF;

  -- Verify ownership
  IF v_purchase.child_id != p_child_id THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Not your ticket');
  END IF;

  -- Check if ticket is in active status
  IF v_purchase.status != 'active' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Ticket not available for use');
  END IF;

  -- Get reward details
  SELECT * INTO v_reward
  FROM rewards
  WHERE id = v_purchase.reward_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Reward not found');
  END IF;

  -- Only screen rewards can be requested
  IF v_reward.category != 'screen' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'This reward type cannot be requested. Ask your parent!');
  END IF;

  -- Guardrail: Check if child already has a pending use request
  SELECT COUNT(*)
  INTO v_pending_count
  FROM reward_purchases
  WHERE child_id = p_child_id
    AND status = 'use_requested';

  IF v_pending_count >= 1 THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Already have a pending request');
  END IF;

  -- Update status to use_requested and set auto_refund timeout (48 hours)
  UPDATE reward_purchases
  SET status = 'use_requested',
      auto_refund_at = NOW() + INTERVAL '48 hours',
      updated_at = NOW()
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'purchase_id', p_purchase_id,
    'status', 'use_requested',
    'auto_refund_at', NOW() + INTERVAL '48 hours'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update approve_ticket_use to clear auto_refund_at on approval
CREATE OR REPLACE FUNCTION approve_ticket_use(
  p_purchase_id UUID,
  p_parent_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_purchase reward_purchases%ROWTYPE;
  v_reward rewards%ROWTYPE;
  v_parent users%ROWTYPE;
  v_child children%ROWTYPE;
BEGIN
  -- Get parent details
  SELECT * INTO v_parent
  FROM users
  WHERE id = p_parent_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Parent not found');
  END IF;

  -- Get purchase record
  SELECT * INTO v_purchase
  FROM reward_purchases
  WHERE id = p_purchase_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Ticket not found');
  END IF;

  -- Verify same family
  IF v_purchase.family_id != v_parent.family_id THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Not your family');
  END IF;

  -- Check if ticket is in use_requested status
  IF v_purchase.status != 'use_requested' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'No pending request for this ticket');
  END IF;

  -- Get reward details
  SELECT * INTO v_reward
  FROM rewards
  WHERE id = v_purchase.reward_id;

  -- Get child details for screen usage logging
  SELECT * INTO v_child
  FROM children
  WHERE id = v_purchase.child_id;

  -- Update status to used and clear auto_refund_at
  UPDATE reward_purchases
  SET status = 'used',
      used_at = NOW(),
      approved_by = p_parent_id,
      auto_refund_at = NULL,
      updated_at = NOW()
  WHERE id = p_purchase_id;

  -- Log screen usage if it's a screen reward
  IF v_reward.category = 'screen' AND v_reward.screen_minutes IS NOT NULL THEN
    INSERT INTO screen_usage_log (child_id, family_id, minutes_used, started_at, reward_purchase_id)
    VALUES (v_purchase.child_id, v_purchase.family_id, v_reward.screen_minutes, NOW(), p_purchase_id);
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'purchase_id', p_purchase_id,
    'status', 'used',
    'screen_minutes', v_reward.screen_minutes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update reject_ticket_use to handle rejection (returns ticket to active, no refund)
CREATE OR REPLACE FUNCTION reject_ticket_use(
  p_purchase_id UUID,
  p_parent_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_purchase reward_purchases%ROWTYPE;
  v_parent users%ROWTYPE;
BEGIN
  -- Get parent details
  SELECT * INTO v_parent
  FROM users
  WHERE id = p_parent_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Parent not found');
  END IF;

  -- Get purchase record
  SELECT * INTO v_purchase
  FROM reward_purchases
  WHERE id = p_purchase_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Ticket not found');
  END IF;

  -- Verify same family
  IF v_purchase.family_id != v_parent.family_id THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Not your family');
  END IF;

  -- Check if ticket is in use_requested status
  IF v_purchase.status != 'use_requested' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'No pending request for this ticket');
  END IF;

  -- Return to active status and clear auto_refund_at
  UPDATE reward_purchases
  SET status = 'active',
      auto_refund_at = NULL,
      updated_at = NOW()
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'purchase_id', p_purchase_id,
    'status', 'active',
    'message', 'Request rejected. Ticket returned to inventory.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set auto_refund_at for any existing use_requested purchases
UPDATE reward_purchases
SET auto_refund_at = NOW() + INTERVAL '48 hours'
WHERE status = 'use_requested'
  AND auto_refund_at IS NULL;

-- Create index for efficient auto-refund queries
CREATE INDEX IF NOT EXISTS idx_reward_purchases_auto_refund
ON reward_purchases(auto_refund_at)
WHERE auto_refund_at IS NOT NULL AND status IN ('use_requested', 'pending_approval');

-- ============================================================================
-- PART 5: Update point_transactions constraint for new types
-- ============================================================================

ALTER TABLE point_transactions DROP CONSTRAINT IF EXISTS valid_type;
ALTER TABLE point_transactions ADD CONSTRAINT valid_type
  CHECK (type IN ('task_completion', 'reward_purchase', 'adjustment', 'bonus', 'penalty', 'goal_deposit', 'refund'));

-- ============================================================================
-- PART 6: Grant Table Permissions
-- ============================================================================

-- Grant permissions on goals table
GRANT ALL ON goals TO authenticated;
GRANT ALL ON goals TO service_role;
GRANT ALL ON goals TO anon;

-- Grant permissions on goal_deposits table
GRANT ALL ON goal_deposits TO authenticated;
GRANT ALL ON goal_deposits TO service_role;
GRANT ALL ON goal_deposits TO anon;

-- Grant permissions on screen_time_budgets table
GRANT ALL ON screen_time_budgets TO authenticated;
GRANT ALL ON screen_time_budgets TO service_role;
GRANT ALL ON screen_time_budgets TO anon;

-- ============================================================================
-- DONE! V1.1 Migration Complete
-- ============================================================================
SELECT 'V1.1 Migration completed successfully!' AS status;
