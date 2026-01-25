-- Add pause functionality to screen time timer
-- This allows pausing and resuming screen time sessions

-- Add columns to track pause state
ALTER TABLE reward_purchases
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paused_seconds INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN reward_purchases.paused_at IS 'Timestamp when screen time was paused. NULL means timer is running.';
COMMENT ON COLUMN reward_purchases.paused_seconds IS 'Total accumulated paused time in seconds.';

-- Function to pause screen time
CREATE OR REPLACE FUNCTION pause_screen_time(
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

  -- Check if already paused
  IF v_purchase.paused_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Already paused');
  END IF;

  -- Set paused_at to current timestamp
  UPDATE reward_purchases
  SET paused_at = NOW(),
      updated_at = NOW()
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'purchase_id', p_purchase_id,
    'paused_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resume screen time
CREATE OR REPLACE FUNCTION resume_screen_time(
  p_purchase_id UUID,
  p_child_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_purchase reward_purchases%ROWTYPE;
  v_pause_duration INTEGER;
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

  -- Check if actually paused
  IF v_purchase.paused_at IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Not paused');
  END IF;

  -- Calculate how long it was paused
  v_pause_duration := EXTRACT(EPOCH FROM (NOW() - v_purchase.paused_at))::INTEGER;

  -- Update: add pause duration to total and clear paused_at
  UPDATE reward_purchases
  SET paused_seconds = COALESCE(paused_seconds, 0) + v_pause_duration,
      paused_at = NULL,
      updated_at = NOW()
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'purchase_id', p_purchase_id,
    'paused_seconds', COALESCE(v_purchase.paused_seconds, 0) + v_pause_duration
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION pause_screen_time TO authenticated;
GRANT EXECUTE ON FUNCTION pause_screen_time TO anon;
GRANT EXECUTE ON FUNCTION resume_screen_time TO authenticated;
GRANT EXECUTE ON FUNCTION resume_screen_time TO anon;
