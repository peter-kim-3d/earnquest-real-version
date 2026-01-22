-- Fix approve_ticket_use function to use fulfilled_by instead of approved_by
-- The reward_purchases table has fulfilled_by column, not approved_by

CREATE OR REPLACE FUNCTION approve_ticket_use(
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

  -- Check if ticket is in use_requested status
  IF v_purchase.status != 'use_requested' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'No pending request for this ticket');
  END IF;

  -- Get reward details
  SELECT * INTO v_reward
  FROM rewards
  WHERE id = v_purchase.reward_id;

  -- Update status to used and clear auto_refund_at
  -- Use fulfilled_by instead of approved_by (correct column name)
  UPDATE reward_purchases
  SET status = 'used',
      used_at = NOW(),
      fulfilled_by = p_parent_id,
      fulfilled_at = NOW(),
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
