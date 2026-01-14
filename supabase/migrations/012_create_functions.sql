-- Function to add points to a child's balance
CREATE OR REPLACE FUNCTION add_points(
  p_child_id UUID,
  p_amount INTEGER,
  p_type TEXT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_family_id UUID;
  v_new_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  -- Get family_id and current balance
  SELECT family_id, points_balance
  INTO v_family_id, v_new_balance
  FROM children
  WHERE id = p_child_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Child not found';
  END IF;

  -- Calculate new balance
  v_new_balance := v_new_balance + p_amount;

  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;

  -- Update child's balance
  UPDATE children
  SET points_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_child_id;

  -- Create transaction record
  INSERT INTO point_transactions (
    child_id,
    family_id,
    amount,
    balance_after,
    type,
    reference_type,
    reference_id,
    description
  ) VALUES (
    p_child_id,
    v_family_id,
    p_amount,
    v_new_balance,
    p_type,
    p_reference_type,
    p_reference_id,
    COALESCE(p_description, p_type)
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'new_balance', v_new_balance,
    'transaction_id', v_transaction_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve a task completion
CREATE OR REPLACE FUNCTION approve_task_completion(
  p_completion_id UUID,
  p_approved_by UUID DEFAULT NULL -- NULL for auto-approval
) RETURNS JSONB AS $$
DECLARE
  v_completion task_completions%ROWTYPE;
  v_task tasks%ROWTYPE;
  v_result JSONB;
BEGIN
  -- Get the completion record
  SELECT * INTO v_completion
  FROM task_completions
  WHERE id = p_completion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task completion not found';
  END IF;

  IF v_completion.status NOT IN ('pending', 'fix_requested') THEN
    RAISE EXCEPTION 'Task completion is not pending';
  END IF;

  -- Get the task
  SELECT * INTO v_task
  FROM tasks
  WHERE id = v_completion.task_id;

  -- Update completion status
  UPDATE task_completions
  SET status = CASE
      WHEN p_approved_by IS NULL THEN 'auto_approved'
      ELSE 'approved'
    END,
    approved_by = p_approved_by,
    approved_at = NOW(),
    completed_at = NOW(),
    points_awarded = v_task.points,
    updated_at = NOW()
  WHERE id = p_completion_id;

  -- Add points to child's balance
  v_result := add_points(
    p_child_id => v_completion.child_id,
    p_amount => v_task.points,
    p_type => 'task_completion',
    p_reference_type => 'task_completion',
    p_reference_id => p_completion_id,
    p_description => 'Completed: ' || v_task.name
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'points_awarded', v_task.points,
    'new_balance', v_result->'new_balance'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to purchase a reward
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

  -- Deduct points
  v_result := add_points(
    p_child_id => p_child_id,
    p_amount => -v_reward.points_cost,
    p_type => 'reward_purchase',
    p_reference_type => 'reward',
    p_reference_id => p_reward_id,
    p_description => 'Purchased: ' || v_reward.name
  );

  -- Create purchase record
  INSERT INTO reward_purchases (
    reward_id,
    child_id,
    family_id,
    points_spent,
    screen_minutes,
    status,
    purchased_at
  ) VALUES (
    p_reward_id,
    p_child_id,
    v_family_id,
    v_reward.points_cost,
    v_reward.screen_minutes,
    'purchased',
    NOW()
  )
  RETURNING id INTO v_purchase_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'purchase_id', v_purchase_id,
    'new_balance', v_result->'new_balance'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION add_points IS 'Atomically adds points to a child and creates a transaction record';
COMMENT ON FUNCTION approve_task_completion IS 'Approves a task completion and credits points';
COMMENT ON FUNCTION purchase_reward IS 'Purchases a reward, checking limits and deducting points';
