-- Migration: Tier System & Category Consolidation (V1.1)
-- Adds effort tiers to rewards and consolidates categories

-- ============================================================================
-- 1. Add tier column to rewards
-- ============================================================================

ALTER TABLE rewards ADD COLUMN IF NOT EXISTS tier TEXT
  CHECK (tier IN ('small', 'medium', 'large', 'xl'));

COMMENT ON COLUMN rewards.tier IS 'Effort tier: small (50-100p), medium (100-200p), large (200-500p), xl (500+p)';

-- ============================================================================
-- 2. Add approval_type for V1.1 simplified categories
-- ============================================================================

ALTER TABLE rewards ADD COLUMN IF NOT EXISTS approval_type TEXT
  DEFAULT 'instant'
  CHECK (approval_type IN ('instant', 'approval_required'));

COMMENT ON COLUMN rewards.approval_type IS 'V1.1 simplified: instant (immediate effect) or approval_required (parent must confirm)';

-- ============================================================================
-- 3. Auto-assign tiers to existing rewards based on points
-- ============================================================================

UPDATE rewards
SET tier = CASE
  WHEN points_cost <= 100 THEN 'small'
  WHEN points_cost <= 200 THEN 'medium'
  WHEN points_cost <= 500 THEN 'large'
  ELSE 'xl'
END
WHERE tier IS NULL;

-- ============================================================================
-- 4. Migrate approval_type based on existing category
-- ============================================================================

UPDATE rewards
SET approval_type = CASE
  WHEN category IN ('autonomy', 'savings') THEN 'instant'
  WHEN category IN ('experience', 'item') THEN 'approval_required'
  WHEN category = 'screen' THEN 'instant'  -- Screen will be deprecated
  ELSE 'instant'
END
WHERE approval_type IS NULL OR approval_type = 'instant';

-- ============================================================================
-- 5. Create tier calculation function
-- ============================================================================

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

-- ============================================================================
-- 6. Create trigger to auto-set tier on reward insert/update
-- ============================================================================

CREATE OR REPLACE FUNCTION set_reward_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-calculate tier if not provided or points changed
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

-- ============================================================================
-- 7. Create view for rewards with tier info (for child store)
-- ============================================================================

CREATE OR REPLACE VIEW v_rewards_with_tiers AS
SELECT
  r.*,
  CASE r.tier
    WHEN 'small' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'large' THEN 3
    WHEN 'xl' THEN 4
  END AS tier_stars,
  CASE r.tier
    WHEN 'small' THEN '50-100'
    WHEN 'medium' THEN '100-200'
    WHEN 'large' THEN '200-500'
    WHEN 'xl' THEN '500+'
  END AS tier_range,
  CASE r.approval_type
    WHEN 'instant' THEN true
    ELSE false
  END AS is_instant
FROM rewards r
WHERE r.deleted_at IS NULL AND r.is_active = true;

-- ============================================================================
-- 8. Add auto_refund_at to reward_purchases for 48h timeout
-- ============================================================================

ALTER TABLE reward_purchases ADD COLUMN IF NOT EXISTS auto_refund_at TIMESTAMPTZ;
ALTER TABLE reward_purchases ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE reward_purchases ADD COLUMN IF NOT EXISTS refund_reason TEXT;

COMMENT ON COLUMN reward_purchases.auto_refund_at IS 'Timestamp when auto-refund will occur if not approved (48h timeout)';

-- ============================================================================
-- 9. Create function to process auto-refunds
-- ============================================================================

CREATE OR REPLACE FUNCTION process_expired_approvals()
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_purchase RECORD;
BEGIN
  -- Find purchases pending approval that have expired
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
    -- Refund points to child
    UPDATE children
    SET points_balance = points_balance + v_purchase.points_spent
    WHERE id = v_purchase.child_id;

    -- Update purchase status
    UPDATE reward_purchases
    SET
      status = 'cancelled',
      refunded_at = NOW(),
      refund_reason = 'Auto-refund: Parent did not respond within 48 hours'
    WHERE id = v_purchase.id;

    -- Create refund transaction
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
-- 10. Update purchase_reward to set auto_refund_at for approval_required
-- ============================================================================

-- This should be handled in the API layer when creating purchases
-- for approval_required rewards, set: auto_refund_at = NOW() + INTERVAL '48 hours'

COMMENT ON FUNCTION process_expired_approvals() IS 'Called by cron job to auto-refund purchases not approved within 48 hours';
