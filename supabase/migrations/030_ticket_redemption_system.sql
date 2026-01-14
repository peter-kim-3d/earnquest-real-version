-- ============================================
-- Ticket Redemption System Migration
-- ============================================
-- This migration implements category-based reward redemption:
-- - savings/autonomy → instant 'used' status
-- - screen → child requests use → parent approves
-- - item/experience → parent marks as given

-- 1. Add used_at column to track when tickets are actually used
ALTER TABLE reward_purchases
ADD COLUMN IF NOT EXISTS used_at TIMESTAMPTZ;

-- 2. Add 'item' as a valid reward category
ALTER TABLE rewards
DROP CONSTRAINT IF EXISTS valid_category;

ALTER TABLE rewards
ADD CONSTRAINT valid_category
CHECK (category IN ('screen', 'autonomy', 'experience', 'savings', 'item'));

-- 3. Migrate existing status values
-- purchased → active (tickets waiting to be used)
UPDATE reward_purchases
SET status = 'active'
WHERE status = 'purchased';

-- fulfilled → used (tickets that have been completed)
UPDATE reward_purchases
SET status = 'used',
    used_at = COALESCE(fulfilled_at, updated_at)
WHERE status = 'fulfilled';

-- 4. Update status constraint to include new values
ALTER TABLE reward_purchases
DROP CONSTRAINT IF EXISTS reward_purchases_status_check;

ALTER TABLE reward_purchases
ADD CONSTRAINT reward_purchases_status_check
CHECK (status IN ('active', 'use_requested', 'used', 'cancelled'));

-- 5. Create index for guardrail query optimization
CREATE INDEX IF NOT EXISTS idx_reward_purchases_use_requested
ON reward_purchases(child_id, status)
WHERE status = 'use_requested';

-- 6. Update purchase_reward function for instant completion logic
CREATE OR REPLACE FUNCTION purchase_reward(
  p_reward_id UUID,
  p_child_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_reward rewards%ROWTYPE;
  v_child children%ROWTYPE;
  v_family_id UUID;
  v_weekly_purchases INTEGER;
  v_weekly_screen_usage INTEGER;
  v_screen_budget INTEGER;
  v_purchase_id UUID;
  v_result JSONB;
  v_initial_status TEXT;
  v_used_at TIMESTAMPTZ;
BEGIN
  -- Get reward details
  SELECT * INTO v_reward
  FROM rewards
  WHERE id = p_reward_id AND is_active = TRUE AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Reward not found or inactive');
  END IF;

  -- Get child details
  SELECT * INTO v_child
  FROM children
  WHERE id = p_child_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Child not found');
  END IF;

  v_family_id := v_child.family_id;

  -- Check points balance
  IF v_child.points_balance < v_reward.points_cost THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Insufficient points');
  END IF;

  -- Check weekly limit
  IF v_reward.weekly_limit IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_weekly_purchases
    FROM reward_purchases
    WHERE reward_id = p_reward_id
      AND child_id = p_child_id
      AND status != 'cancelled'
      AND purchased_at >= date_trunc('week', NOW());

    IF v_weekly_purchases >= v_reward.weekly_limit THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'Weekly limit reached');
    END IF;
  END IF;

  -- Check screen budget (for screen rewards)
  IF v_reward.category = 'screen' THEN
    -- Get weekly screen budget from child settings
    v_screen_budget := COALESCE((v_child.settings->>'screenBudgetWeeklyMinutes')::INTEGER, 300);

    -- Get this week's screen usage
    SELECT COALESCE(SUM(minutes_used), 0)
    INTO v_weekly_screen_usage
    FROM screen_usage_log
    WHERE child_id = p_child_id
      AND created_at >= date_trunc('week', NOW());

    IF (v_weekly_screen_usage + v_reward.screen_minutes) > v_screen_budget THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'Screen budget exceeded');
    END IF;
  END IF;

  -- Determine initial status based on category
  -- savings and autonomy rewards are instantly completed
  IF v_reward.category IN ('savings', 'autonomy') THEN
    v_initial_status := 'used';
    v_used_at := NOW();
  ELSE
    v_initial_status := 'active';
    v_used_at := NULL;
  END IF;

  -- Deduct points
  v_result := add_points(
    p_child_id => p_child_id,
    p_amount => -v_reward.points_cost,
    p_type => 'reward_purchase',
    p_reference_type => 'reward',
    p_reference_id => p_reward_id,
    p_description => 'Purchased: ' || v_reward.name
  );

  -- Create purchase record with computed status
  INSERT INTO reward_purchases (
    reward_id,
    child_id,
    family_id,
    points_spent,
    screen_minutes,
    status,
    used_at,
    purchased_at
  ) VALUES (
    p_reward_id,
    p_child_id,
    v_family_id,
    v_reward.points_cost,
    v_reward.screen_minutes,
    v_initial_status,
    v_used_at,
    NOW()
  )
  RETURNING id INTO v_purchase_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'purchase_id', v_purchase_id,
    'new_balance', v_result->'new_balance',
    'status', v_initial_status,
    'is_instant', v_initial_status = 'used'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Function: request_ticket_use (Child requests to use a screen reward)
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

  -- Update status to use_requested
  UPDATE reward_purchases
  SET status = 'use_requested',
      updated_at = NOW()
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'purchase_id', p_purchase_id,
    'status', 'use_requested'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function: approve_ticket_use (Parent approves screen reward use)
CREATE OR REPLACE FUNCTION approve_ticket_use(
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
    RETURN jsonb_build_object('success', FALSE, 'error', 'Ticket not pending approval');
  END IF;

  -- Update to used status
  UPDATE reward_purchases
  SET status = 'used',
      fulfilled_by = p_parent_id,
      fulfilled_at = NOW(),
      used_at = NOW(),
      updated_at = NOW()
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'purchase_id', p_purchase_id,
    'status', 'used'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function: fulfill_ticket (Parent marks item/experience as given)
CREATE OR REPLACE FUNCTION fulfill_ticket(
  p_purchase_id UUID,
  p_parent_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_purchase reward_purchases%ROWTYPE;
  v_reward rewards%ROWTYPE;
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

  -- Check if ticket is in active status
  IF v_purchase.status != 'active' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Ticket not available');
  END IF;

  -- Get reward details
  SELECT * INTO v_reward
  FROM rewards
  WHERE id = v_purchase.reward_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Reward not found');
  END IF;

  -- Screen rewards must use the request flow
  IF v_reward.category = 'screen' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Screen rewards require use request flow');
  END IF;

  -- Update to used status
  UPDATE reward_purchases
  SET status = 'used',
      fulfilled_by = p_parent_id,
      fulfilled_at = NOW(),
      used_at = NOW(),
      updated_at = NOW()
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'purchase_id', p_purchase_id,
    'status', 'used'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON COLUMN reward_purchases.used_at IS 'Timestamp when the ticket was actually used/redeemed';
COMMENT ON FUNCTION request_ticket_use IS 'Child requests to use a screen reward ticket';
COMMENT ON FUNCTION approve_ticket_use IS 'Parent approves a screen reward use request';
COMMENT ON FUNCTION fulfill_ticket IS 'Parent marks an item/experience reward as given';
