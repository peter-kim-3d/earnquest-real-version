-- ============================================
-- Screen Time Instant Start Migration
-- ============================================
-- Fix: Screen time tickets now start immediately when child clicks "Use"
-- No parent approval needed for screen rewards.
-- This corrects migration 036 which accidentally reverted the instant-start logic.

CREATE OR REPLACE FUNCTION request_ticket_use(
  p_purchase_id UUID,
  p_child_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_purchase reward_purchases%ROWTYPE;
  v_reward rewards%ROWTYPE;
  v_active_screen_time_count INTEGER;
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

  -- Only screen rewards can use this instant-start function
  IF v_reward.category != 'screen' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'This reward type cannot be started. Ask your parent!');
  END IF;

  -- Guardrail: Check if child already has active screen time running
  SELECT COUNT(*)
  INTO v_active_screen_time_count
  FROM reward_purchases
  WHERE child_id = p_child_id
    AND status = 'in_use';

  IF v_active_screen_time_count >= 1 THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Already have screen time running');
  END IF;

  -- Start screen time immediately: set to 'in_use' and start timer
  -- No parent approval needed - child already paid points for this ticket
  UPDATE reward_purchases
  SET status = 'in_use',
      started_at = NOW(),
      fulfilled_at = NOW(),
      elapsed_seconds = 0,
      updated_at = NOW()
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'purchase_id', p_purchase_id,
    'status', 'in_use',
    'screen_minutes', v_reward.screen_minutes,
    'started_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION request_ticket_use IS 'Child starts screen time immediately (no parent approval needed). Timer begins when child clicks Use.';

-- Also fix any existing tickets stuck in use_requested status for screen rewards
-- Move them back to active so children can use the new instant-start flow
UPDATE reward_purchases rp
SET status = 'active',
    auto_refund_at = NULL,
    updated_at = NOW()
FROM rewards r
WHERE rp.reward_id = r.id
  AND rp.status = 'use_requested'
  AND r.category = 'screen';

SELECT 'Screen time instant start migration completed!' AS status;
