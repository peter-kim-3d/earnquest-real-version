-- ============================================
-- Auto-Refund Timeout Migration
-- ============================================
-- Sets auto_refund_at to 48 hours from now when a purchase
-- enters 'use_requested' status (child asks parent)

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

SELECT 'Auto-refund timeout migration completed!' AS status;
