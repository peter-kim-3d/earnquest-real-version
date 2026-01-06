-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_completions_updated_at
  BEFORE UPDATE ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reward_purchases_updated_at
  BEFORE UPDATE ON reward_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_integrations_updated_at
  BEFORE UPDATE ON app_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-set auto_approve_at when task completion is created
CREATE OR REPLACE FUNCTION set_auto_approve_at()
RETURNS TRIGGER AS $$
DECLARE
  v_auto_approval_hours INT;
BEGIN
  -- Get family's auto approval hours
  SELECT (settings->>'autoApprovalHours')::INT
  INTO v_auto_approval_hours
  FROM families f
  JOIN children c ON c.family_id = f.id
  WHERE c.id = NEW.child_id;

  -- Set auto_approve_at if not already set
  IF NEW.auto_approve_at IS NULL AND NEW.status = 'pending' THEN
    NEW.auto_approve_at := NEW.requested_at + (v_auto_approval_hours || ' hours')::INTERVAL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_task_completion_auto_approve
  BEFORE INSERT ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION set_auto_approve_at();
