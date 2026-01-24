-- ============================================
-- Gift Rewards System Migration
-- ============================================
-- This migration adds the ability for parents to gift rewards to children
-- without deducting points from the child's balance.

-- 1. Add gift-related columns to reward_purchases table
ALTER TABLE reward_purchases
ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS gifted_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS gift_message TEXT;

-- 2. Add index for gift queries
CREATE INDEX IF NOT EXISTS idx_reward_purchases_is_gift ON reward_purchases(is_gift) WHERE is_gift = TRUE;

-- 3. Create gift_reward function - Parent gifts a reward to a child
CREATE OR REPLACE FUNCTION gift_reward(
  p_reward_id UUID,
  p_child_id UUID,
  p_parent_id UUID,
  p_message TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_reward rewards%ROWTYPE;
  v_child children%ROWTYPE;
  v_parent users%ROWTYPE;
  v_family_id UUID;
  v_purchase_id UUID;
  v_initial_status TEXT;
  v_used_at TIMESTAMPTZ;
BEGIN
  -- Get parent details
  SELECT * INTO v_parent
  FROM users
  WHERE id = p_parent_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Parent not found');
  END IF;

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

  -- Verify parent belongs to the same family
  IF v_parent.family_id != v_family_id THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Parent and child must be in the same family');
  END IF;

  -- Verify reward belongs to the same family
  IF v_reward.family_id != v_family_id THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Reward does not belong to this family');
  END IF;

  -- Determine initial status based on category (same logic as purchase)
  -- savings and autonomy rewards are instantly completed
  IF v_reward.category IN ('savings', 'autonomy') THEN
    v_initial_status := 'used';
    v_used_at := NOW();
  ELSE
    v_initial_status := 'active';
    v_used_at := NULL;
  END IF;

  -- Create gift purchase record (no points deducted)
  INSERT INTO reward_purchases (
    reward_id,
    child_id,
    family_id,
    points_spent,
    screen_minutes,
    status,
    used_at,
    purchased_at,
    is_gift,
    gifted_by,
    gift_message
  ) VALUES (
    p_reward_id,
    p_child_id,
    v_family_id,
    0, -- No points spent for gifts
    v_reward.screen_minutes,
    v_initial_status,
    v_used_at,
    NOW(),
    TRUE,
    p_parent_id,
    p_message
  )
  RETURNING id INTO v_purchase_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'purchase_id', v_purchase_id,
    'status', v_initial_status,
    'is_instant', v_initial_status = 'used',
    'reward_name', v_reward.name,
    'child_name', v_child.name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helpful comments
COMMENT ON COLUMN reward_purchases.is_gift IS 'Whether this purchase was a gift from a parent (no points spent)';
COMMENT ON COLUMN reward_purchases.gifted_by IS 'The parent who gifted this reward';
COMMENT ON COLUMN reward_purchases.gift_message IS 'Optional message from the parent when gifting';
COMMENT ON FUNCTION gift_reward IS 'Parent gifts a reward to a child without spending points';
