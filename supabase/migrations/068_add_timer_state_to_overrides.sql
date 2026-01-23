-- Add timer_state to child_task_overrides for per-child task timer persistence
-- This allows each child to have their own timer progress for timer-based tasks

-- Add column to track timer state per child
ALTER TABLE child_task_overrides
ADD COLUMN IF NOT EXISTS timer_state JSONB DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN child_task_overrides.timer_state IS 'Per-child timer state for timer tasks. Structure: { remainingSeconds: number, totalSeconds: number }';

-- Create function to upsert timer state
CREATE OR REPLACE FUNCTION save_task_timer_state(
  p_task_id UUID,
  p_child_id UUID,
  p_remaining_seconds INTEGER,
  p_total_seconds INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_timer_state JSONB;
BEGIN
  v_timer_state := jsonb_build_object(
    'remainingSeconds', p_remaining_seconds,
    'totalSeconds', p_total_seconds
  );

  -- Upsert the override record
  INSERT INTO child_task_overrides (task_id, child_id, timer_state, updated_at)
  VALUES (p_task_id, p_child_id, v_timer_state, NOW())
  ON CONFLICT (task_id, child_id)
  DO UPDATE SET
    timer_state = v_timer_state,
    updated_at = NOW();

  RETURN jsonb_build_object(
    'success', TRUE,
    'task_id', p_task_id,
    'child_id', p_child_id,
    'timer_state', v_timer_state
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get timer state
CREATE OR REPLACE FUNCTION get_task_timer_state(
  p_task_id UUID,
  p_child_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_timer_state JSONB;
BEGIN
  SELECT timer_state INTO v_timer_state
  FROM child_task_overrides
  WHERE task_id = p_task_id AND child_id = p_child_id;

  RETURN COALESCE(v_timer_state, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION save_task_timer_state TO authenticated;
GRANT EXECUTE ON FUNCTION save_task_timer_state TO anon;
GRANT EXECUTE ON FUNCTION get_task_timer_state TO authenticated;
GRANT EXECUTE ON FUNCTION get_task_timer_state TO anon;
