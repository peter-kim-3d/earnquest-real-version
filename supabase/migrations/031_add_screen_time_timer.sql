-- Add 'in_use' status for screen time tickets
-- This allows tracking when screen time is actively being used

-- 1. Update status constraint to include 'in_use'
ALTER TABLE reward_purchases
DROP CONSTRAINT IF EXISTS reward_purchases_status_check;

ALTER TABLE reward_purchases
ADD CONSTRAINT reward_purchases_status_check
CHECK (status IN ('active', 'use_requested', 'in_use', 'used', 'cancelled'));

-- 2. Add started_at column to track when screen time usage began
ALTER TABLE reward_purchases
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- 3. Update approve_ticket_use function to set 'in_use' for screen rewards
CREATE OR REPLACE FUNCTION approve_ticket_use(
  p_purchase_id UUID,
  p_parent_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_purchase reward_purchases%ROWTYPE;
  v_reward rewards%ROWTYPE;
  v_parent users%ROWTYPE;
  v_new_status TEXT;
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

  -- Get reward details to check category
  SELECT * INTO v_reward
  FROM rewards
  WHERE id = v_purchase.reward_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Reward not found');
  END IF;

  -- Determine new status based on category
  -- Screen rewards go to 'in_use' (timer starts)
  -- Other rewards go directly to 'used'
  IF v_reward.category = 'screen' THEN
    v_new_status := 'in_use';

    UPDATE reward_purchases
    SET status = 'in_use',
        fulfilled_by = p_parent_id,
        fulfilled_at = NOW(),
        started_at = NOW(),
        updated_at = NOW()
    WHERE id = p_purchase_id;
  ELSE
    v_new_status := 'used';

    UPDATE reward_purchases
    SET status = 'used',
        fulfilled_by = p_parent_id,
        fulfilled_at = NOW(),
        used_at = NOW(),
        updated_at = NOW()
    WHERE id = p_purchase_id;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'purchase_id', p_purchase_id,
    'status', v_new_status,
    'screen_minutes', v_reward.screen_minutes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create complete_screen_time function (called when timer ends)
CREATE OR REPLACE FUNCTION complete_screen_time(
  p_purchase_id UUID,
  p_child_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_purchase reward_purchases%ROWTYPE;
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

  -- Check if ticket is in 'in_use' status
  IF v_purchase.status != 'in_use' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Ticket not in use');
  END IF;

  -- Mark as used
  UPDATE reward_purchases
  SET status = 'used',
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

-- Add comments
COMMENT ON COLUMN reward_purchases.started_at IS 'Timestamp when screen time usage started (for in_use tickets)';
COMMENT ON FUNCTION complete_screen_time IS 'Marks a screen time ticket as used when the timer completes';
