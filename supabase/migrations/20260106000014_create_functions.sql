-- Function: Add points to a child (with transaction safety)
CREATE OR REPLACE FUNCTION add_points(
  p_child_id UUID,
  p_amount INT,
  p_type VARCHAR(30),
  p_reference_type VARCHAR(30) DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  v_new_balance INT;
  v_family_id UUID;
BEGIN
  -- Get family_id
  SELECT family_id INTO v_family_id FROM children WHERE id = p_child_id;

  -- Update points
  UPDATE children
  SET
    points_balance = points_balance + p_amount,
    points_lifetime_earned = CASE
      WHEN p_amount > 0 THEN points_lifetime_earned + p_amount
      ELSE points_lifetime_earned
    END,
    updated_at = NOW()
  WHERE id = p_child_id
  RETURNING points_balance INTO v_new_balance;

  -- Record transaction
  INSERT INTO point_transactions (
    child_id,
    family_id,
    type,
    amount,
    balance_after,
    reference_type,
    reference_id,
    description
  ) VALUES (
    p_child_id,
    v_family_id,
    p_type,
    p_amount,
    v_new_balance,
    p_reference_type,
    p_reference_id,
    p_description
  );

  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-approve pending tasks
CREATE OR REPLACE FUNCTION auto_approve_tasks()
RETURNS INT AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE task_completions
  SET
    status = 'auto_approved',
    approved_at = NOW(),
    completed_at = NOW(),
    updated_at = NOW()
  WHERE
    status = 'pending'
    AND auto_approve_at IS NOT NULL
    AND auto_approve_at <= NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate weekly screen usage
CREATE OR REPLACE FUNCTION get_weekly_screen_usage(
  p_child_id UUID,
  p_week_start DATE DEFAULT DATE_TRUNC('week', CURRENT_DATE)::DATE
)
RETURNS INT AS $$
DECLARE
  v_total_minutes INT;
BEGIN
  SELECT COALESCE(SUM(r.screen_minutes), 0)
  INTO v_total_minutes
  FROM reward_purchases rp
  JOIN rewards r ON rp.reward_id = r.id
  WHERE
    rp.child_id = p_child_id
    AND r.is_screen_reward = true
    AND rp.status != 'cancelled'
    AND DATE_TRUNC('week', rp.purchased_at)::DATE = p_week_start;

  RETURN v_total_minutes;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if child can purchase reward
CREATE OR REPLACE FUNCTION can_purchase_reward(
  p_child_id UUID,
  p_reward_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_child_points INT;
  v_reward_points INT;
  v_weekly_limit INT;
  v_purchases_this_week INT;
  v_is_screen_reward BOOLEAN;
  v_screen_budget INT;
  v_screen_used INT;
  v_screen_minutes INT;
BEGIN
  -- Get child points
  SELECT points_balance INTO v_child_points
  FROM children WHERE id = p_child_id;

  -- Get reward info
  SELECT points, weekly_limit, is_screen_reward, screen_minutes
  INTO v_reward_points, v_weekly_limit, v_is_screen_reward, v_screen_minutes
  FROM rewards WHERE id = p_reward_id;

  -- Check points
  IF v_child_points < v_reward_points THEN
    RETURN FALSE;
  END IF;

  -- Check weekly limit
  IF v_weekly_limit IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_purchases_this_week
    FROM reward_purchases
    WHERE
      child_id = p_child_id
      AND reward_id = p_reward_id
      AND DATE_TRUNC('week', purchased_at) = DATE_TRUNC('week', CURRENT_DATE)
      AND status != 'cancelled';

    IF v_purchases_this_week >= v_weekly_limit THEN
      RETURN FALSE;
    END IF;
  END IF;

  -- Check screen budget
  IF v_is_screen_reward THEN
    SELECT (settings->>'screenBudgetWeeklyMinutes')::INT
    INTO v_screen_budget
    FROM children WHERE id = p_child_id;

    v_screen_used := get_weekly_screen_usage(p_child_id);

    IF v_screen_used + v_screen_minutes > v_screen_budget THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
