-- Migration: Update deposit_to_goal function with milestone support
-- Checks for milestone achievements and awards bonus points

CREATE OR REPLACE FUNCTION deposit_to_goal(
  p_goal_id UUID,
  p_child_id UUID,
  p_amount INT
) RETURNS JSONB AS $$
DECLARE
  v_goal goals;
  v_child children;
  v_new_balance INT;
  v_new_goal_points INT;
  v_old_goal_points INT;
  v_is_completed BOOLEAN := FALSE;
  v_milestone_reached INT := NULL;
  v_milestone_bonus INT := 0;
  v_milestones JSONB;
  v_completed_milestones JSONB;
  v_old_progress NUMERIC;
  v_new_progress NUMERIC;
  v_milestone_key TEXT;
  v_bonus_value INT;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Get goal
  SELECT * INTO v_goal
  FROM goals
  WHERE id = p_goal_id
    AND deleted_at IS NULL
    AND is_completed = FALSE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Goal not found or already completed');
  END IF;

  -- Verify child owns this goal
  IF v_goal.child_id != p_child_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Goal does not belong to this child');
  END IF;

  -- Get child's current balance
  SELECT * INTO v_child
  FROM children
  WHERE id = p_child_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Child not found');
  END IF;

  -- Check sufficient balance
  IF v_child.points_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient points',
      'balance', v_child.points_balance,
      'required', p_amount
    );
  END IF;

  -- Store old goal points for milestone calculation
  v_old_goal_points := v_goal.current_points;
  v_milestones := COALESCE(v_goal.milestone_bonuses, '{}');
  v_completed_milestones := COALESCE(v_goal.milestones_completed, '[]');

  -- Deduct points from child
  UPDATE children
  SET
    points_balance = points_balance - p_amount,
    updated_at = now()
  WHERE id = p_child_id
  RETURNING points_balance INTO v_new_balance;

  -- Add points to goal
  UPDATE goals
  SET
    current_points = current_points + p_amount,
    updated_at = now()
  WHERE id = p_goal_id
  RETURNING current_points INTO v_new_goal_points;

  -- Create deposit record
  INSERT INTO goal_deposits (goal_id, child_id, family_id, amount, balance_after, type)
  VALUES (p_goal_id, p_child_id, v_goal.family_id, p_amount, v_new_balance, 'deposit');

  -- Create point transaction for the deposit
  INSERT INTO point_transactions (
    child_id, family_id, amount, balance_after,
    type, reference_type, reference_id, description
  ) VALUES (
    p_child_id, v_goal.family_id, -p_amount, v_new_balance,
    'goal_deposit', 'goal', p_goal_id, 'Deposit to goal: ' || v_goal.name
  );

  -- Calculate progress percentages for milestone check
  v_old_progress := (v_old_goal_points::NUMERIC / v_goal.target_points) * 100;
  v_new_progress := (v_new_goal_points::NUMERIC / v_goal.target_points) * 100;

  -- Check for milestone achievements (25%, 50%, 75%)
  FOR v_milestone_key IN SELECT * FROM jsonb_object_keys(v_milestones)
  LOOP
    -- Check if milestone was crossed and not already completed
    IF v_old_progress < v_milestone_key::NUMERIC
       AND v_new_progress >= v_milestone_key::NUMERIC
       AND NOT (v_completed_milestones @> to_jsonb(v_milestone_key::INT))
    THEN
      -- Get bonus value for this milestone
      v_bonus_value := (v_milestones->>v_milestone_key)::INT;

      IF v_bonus_value > 0 THEN
        -- Award milestone bonus to child
        UPDATE children
        SET
          points_balance = points_balance + v_bonus_value,
          updated_at = now()
        WHERE id = p_child_id
        RETURNING points_balance INTO v_new_balance;

        -- Create deposit record for bonus
        INSERT INTO goal_deposits (goal_id, child_id, family_id, amount, balance_after, type)
        VALUES (p_goal_id, p_child_id, v_goal.family_id, v_bonus_value, v_new_balance, 'milestone_bonus');

        -- Create point transaction for milestone bonus
        INSERT INTO point_transactions (
          child_id, family_id, amount, balance_after,
          type, reference_type, reference_id, description
        ) VALUES (
          p_child_id, v_goal.family_id, v_bonus_value, v_new_balance,
          'milestone_bonus', 'goal', p_goal_id,
          'Milestone bonus (' || v_milestone_key || '%) for goal: ' || v_goal.name
        );

        v_milestone_reached := v_milestone_key::INT;
        v_milestone_bonus := v_bonus_value;
      END IF;

      -- Update completed milestones
      v_completed_milestones := v_completed_milestones || to_jsonb(v_milestone_key::INT);
    END IF;
  END LOOP;

  -- Update milestones_completed if any milestone was reached
  IF v_milestone_reached IS NOT NULL THEN
    UPDATE goals
    SET milestones_completed = v_completed_milestones
    WHERE id = p_goal_id;
  END IF;

  -- Check if goal is completed
  IF v_new_goal_points >= v_goal.target_points THEN
    v_is_completed := TRUE;
    UPDATE goals
    SET
      is_completed = TRUE,
      completed_at = now()
    WHERE id = p_goal_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'goal_progress', v_new_goal_points,
    'goal_target', v_goal.target_points,
    'is_completed', v_is_completed,
    'milestone_reached', v_milestone_reached,
    'milestone_bonus', v_milestone_bonus
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
