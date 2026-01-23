-- Add elapsed_seconds to track screen time progress
-- This allows timer state to persist across page refreshes

-- Add column to track elapsed seconds
ALTER TABLE reward_purchases
ADD COLUMN IF NOT EXISTS elapsed_seconds INTEGER DEFAULT 0;

-- Add comment
COMMENT ON COLUMN reward_purchases.elapsed_seconds IS 'Elapsed seconds for screen time timer. Periodically saved to preserve progress across refreshes.';

-- Create function to update elapsed time
CREATE OR REPLACE FUNCTION update_screen_time_elapsed(
  p_purchase_id UUID,
  p_child_id UUID,
  p_elapsed_seconds INTEGER
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

  -- Update elapsed seconds
  UPDATE reward_purchases
  SET elapsed_seconds = p_elapsed_seconds,
      updated_at = NOW()
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'purchase_id', p_purchase_id,
    'elapsed_seconds', p_elapsed_seconds
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_screen_time_elapsed TO authenticated;
GRANT EXECUTE ON FUNCTION update_screen_time_elapsed TO anon;
