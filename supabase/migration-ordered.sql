-- ============================================================================
-- EARNQUEST DATABASE SCHEMA
-- Properly ordered migration with dependencies resolved
-- ============================================================================

-- ============================================================================
-- PART 1: CREATE ALL TABLES (without RLS policies)
-- ============================================================================

-- Table: families
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  settings JSONB DEFAULT '{
    "timezone": "America/New_York",
    "language": "en",
    "weekStartsOn": "sunday",
    "autoApprovalHours": 24,
    "screenBudgetWeeklyMinutes": 300
  }'::jsonb,
  subscription_tier VARCHAR(20) DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_families_deleted_at ON families(deleted_at) WHERE deleted_at IS NULL;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Table: users
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'parent',
  avatar_url TEXT,
  settings JSONB DEFAULT '{
    "notifications": true,
    "emailDigest": "daily"
  }'::jsonb,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Table: children
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  age_group VARCHAR(10) NOT NULL,
  avatar_url TEXT,
  points_balance INT DEFAULT 0 CHECK (points_balance >= 0),
  points_lifetime_earned INT DEFAULT 0,
  trust_level INT DEFAULT 1 CHECK (trust_level BETWEEN 1 AND 3),
  trust_streak_days INT DEFAULT 0,
  settings JSONB DEFAULT '{
    "screenBudgetWeeklyMinutes": 300,
    "allowSelfTaskCompletion": false
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_children_family_id ON children(family_id);
CREATE INDEX idx_children_deleted_at ON children(deleted_at) WHERE deleted_at IS NULL;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Table: task_templates
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(20) NOT NULL,
  age_group VARCHAR(10) NOT NULL,
  name_key VARCHAR(100) NOT NULL,
  name_default VARCHAR(200) NOT NULL,
  description_key VARCHAR(100),
  description_default TEXT,
  default_points INT NOT NULL,
  default_approval_type VARCHAR(20) DEFAULT 'parent',
  icon TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_templates_category_age ON task_templates(category, age_group);

-- Table: tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  template_id UUID REFERENCES task_templates(id),
  category VARCHAR(20) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  points INT NOT NULL CHECK (points >= 0),
  approval_type VARCHAR(20) DEFAULT 'parent',
  is_trust_task BOOLEAN DEFAULT false,
  recurrence JSONB DEFAULT '{
    "type": "daily"
  }'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_family_id ON tasks(family_id);
CREATE INDEX idx_tasks_child_id ON tasks(child_id);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_active ON tasks(is_active) WHERE is_active = true;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Table: task_completions
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  completed_at TIMESTAMPTZ,
  auto_approve_at TIMESTAMPTZ,
  fix_request_count INT DEFAULT 0,
  fix_request_message TEXT,
  proof JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX idx_task_completions_child_id ON task_completions(child_id);
CREATE INDEX idx_task_completions_family_id ON task_completions(family_id);
CREATE INDEX idx_task_completions_status ON task_completions(status);
CREATE INDEX idx_task_completions_requested_at ON task_completions(requested_at DESC);
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- Table: reward_templates
CREATE TABLE reward_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(20) NOT NULL,
  age_group VARCHAR(10) NOT NULL,
  name_key VARCHAR(100) NOT NULL,
  name_default VARCHAR(200) NOT NULL,
  description_key VARCHAR(100),
  description_default TEXT,
  default_points INT NOT NULL,
  is_screen_reward BOOLEAN DEFAULT false,
  screen_minutes INT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reward_templates_category_age ON reward_templates(category, age_group);

-- Table: rewards
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  template_id UUID REFERENCES reward_templates(id),
  category VARCHAR(20) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  points INT NOT NULL CHECK (points >= 0),
  is_screen_reward BOOLEAN DEFAULT false,
  screen_minutes INT,
  weekly_limit INT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_rewards_family_id ON rewards(family_id);
CREATE INDEX idx_rewards_category ON rewards(category);
CREATE INDEX idx_rewards_active ON rewards(is_active) WHERE is_active = true;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Table: reward_purchases
CREATE TABLE reward_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  points_spent INT NOT NULL,
  status VARCHAR(20) DEFAULT 'purchased',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  redeemed_by UUID REFERENCES users(id),
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reward_purchases_child_id ON reward_purchases(child_id);
CREATE INDEX idx_reward_purchases_family_id ON reward_purchases(family_id);
CREATE INDEX idx_reward_purchases_status ON reward_purchases(status);
CREATE INDEX idx_reward_purchases_purchased_at ON reward_purchases(purchased_at DESC);
ALTER TABLE reward_purchases ENABLE ROW LEVEL SECURITY;

-- Table: kindness_cards
CREATE TABLE kindness_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id),
  from_child_id UUID REFERENCES children(id),
  to_child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kindness_cards_family_id ON kindness_cards(family_id);
CREATE INDEX idx_kindness_cards_to_child ON kindness_cards(to_child_id);
CREATE INDEX idx_kindness_cards_created_at ON kindness_cards(created_at DESC);
ALTER TABLE kindness_cards ENABLE ROW LEVEL SECURITY;

-- Table: kindness_badges
CREATE TABLE kindness_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_kindness_badges_child_id ON kindness_badges(child_id);
CREATE INDEX idx_kindness_badges_family_id ON kindness_badges(family_id);
ALTER TABLE kindness_badges ENABLE ROW LEVEL SECURITY;

-- Table: app_integrations
CREATE TABLE app_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  app_name VARCHAR(50) NOT NULL,
  integration_data JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_integrations_family_id ON app_integrations(family_id);
CREATE INDEX idx_app_integrations_child_id ON app_integrations(child_id);
CREATE UNIQUE INDEX idx_app_integrations_unique ON app_integrations(child_id, app_name);
ALTER TABLE app_integrations ENABLE ROW LEVEL SECURITY;

-- Table: app_integration_events
CREATE TABLE app_integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES app_integrations(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_integration_events_integration_id ON app_integration_events(integration_id);
CREATE INDEX idx_app_integration_events_processed ON app_integration_events(processed) WHERE processed = false;
ALTER TABLE app_integration_events ENABLE ROW LEVEL SECURITY;

-- Table: weekly_summaries
CREATE TABLE weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  summary_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weekly_summaries_family_id ON weekly_summaries(family_id);
CREATE INDEX idx_weekly_summaries_child_id ON weekly_summaries(child_id);
CREATE INDEX idx_weekly_summaries_week ON weekly_summaries(week_start_date DESC);
CREATE UNIQUE INDEX idx_weekly_summaries_unique ON weekly_summaries(family_id, child_id, week_start_date);
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

-- Table: point_transactions
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  reference_type VARCHAR(30),
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_point_transactions_child_id ON point_transactions(child_id);
CREATE INDEX idx_point_transactions_family_id ON point_transactions(family_id);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at DESC);
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- Table: family_values
CREATE TABLE family_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  value_text VARCHAR(200) NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_values_family_id ON family_values(family_id);
ALTER TABLE family_values ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: CREATE VIEWS
-- ============================================================================

-- View: Child's today tasks
CREATE VIEW v_child_today_tasks AS
SELECT
  t.id,
  t.family_id,
  t.child_id,
  t.name,
  t.category,
  t.points,
  t.approval_type,
  t.is_trust_task,
  c.name as child_name,
  c.trust_level,
  EXISTS (
    SELECT 1 FROM task_completions tc
    WHERE tc.task_id = t.id
    AND tc.child_id = COALESCE(t.child_id, tc.child_id)
    AND DATE(tc.requested_at) = CURRENT_DATE
    AND tc.status IN ('pending', 'approved', 'auto_approved')
  ) as completed_today
FROM tasks t
LEFT JOIN children c ON t.child_id = c.id
WHERE t.is_active = true
AND t.deleted_at IS NULL;

-- View: Pending approvals (for parents)
CREATE VIEW v_pending_approvals AS
SELECT
  tc.id,
  tc.task_id,
  tc.child_id,
  tc.family_id,
  tc.status,
  tc.requested_at,
  tc.auto_approve_at,
  tc.fix_request_count,
  t.name as task_name,
  t.points,
  c.name as child_name,
  c.avatar_url as child_avatar
FROM task_completions tc
JOIN tasks t ON tc.task_id = t.id
JOIN children c ON tc.child_id = c.id
WHERE tc.status IN ('pending', 'fix_requested')
ORDER BY tc.requested_at DESC;

-- View: Weekly screen usage
CREATE VIEW v_weekly_screen_usage AS
SELECT
  rp.child_id,
  rp.family_id,
  DATE_TRUNC('week', rp.purchased_at)::DATE as week_start,
  SUM(r.screen_minutes) as total_screen_minutes,
  COUNT(*) as screen_purchases
FROM reward_purchases rp
JOIN rewards r ON rp.reward_id = r.id
WHERE r.is_screen_reward = true
AND rp.status != 'cancelled'
GROUP BY rp.child_id, rp.family_id, DATE_TRUNC('week', rp.purchased_at)::DATE;

-- View: Child dashboard stats
CREATE VIEW v_child_dashboard AS
SELECT
  c.id as child_id,
  c.family_id,
  c.name,
  c.avatar_url,
  c.points_balance,
  c.points_lifetime_earned,
  c.trust_level,
  c.trust_streak_days,
  (SELECT COUNT(*)
   FROM task_completions tc
   WHERE tc.child_id = c.id
   AND DATE(tc.requested_at) = CURRENT_DATE
   AND tc.status IN ('approved', 'auto_approved')) as tasks_completed_today,
  (SELECT COUNT(*)
   FROM task_completions tc
   WHERE tc.child_id = c.id
   AND tc.status = 'pending') as tasks_pending_approval,
  (SELECT COALESCE(SUM(amount), 0)
   FROM point_transactions pt
   WHERE pt.child_id = c.id
   AND pt.amount > 0
   AND DATE_TRUNC('week', pt.created_at) = DATE_TRUNC('week', CURRENT_DATE)) as points_earned_this_week,
  (SELECT COALESCE(SUM(r.screen_minutes), 0)
   FROM reward_purchases rp
   JOIN rewards r ON rp.reward_id = r.id
   WHERE rp.child_id = c.id
   AND r.is_screen_reward = true
   AND rp.status != 'cancelled'
   AND DATE_TRUNC('week', rp.purchased_at) = DATE_TRUNC('week', CURRENT_DATE)) as screen_minutes_this_week,
  (SELECT COUNT(*)
   FROM kindness_cards kc
   WHERE kc.to_child_id = c.id
   AND DATE_TRUNC('week', kc.created_at) = DATE_TRUNC('week', CURRENT_DATE)) as kindness_cards_this_week
FROM children c
WHERE c.deleted_at IS NULL;

-- ============================================================================
-- PART 3: CREATE FUNCTIONS
-- ============================================================================

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
  SELECT family_id INTO v_family_id FROM children WHERE id = p_child_id;

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
  SELECT points_balance INTO v_child_points
  FROM children WHERE id = p_child_id;

  SELECT points, weekly_limit, is_screen_reward, screen_minutes
  INTO v_reward_points, v_weekly_limit, v_is_screen_reward, v_screen_minutes
  FROM rewards WHERE id = p_reward_id;

  IF v_child_points < v_reward_points THEN
    RETURN FALSE;
  END IF;

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

-- Function: Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-set auto_approve_at when task completion is created
CREATE OR REPLACE FUNCTION set_auto_approve_at()
RETURNS TRIGGER AS $$
DECLARE
  v_auto_approval_hours INT;
BEGIN
  SELECT (settings->>'autoApprovalHours')::INT
  INTO v_auto_approval_hours
  FROM families f
  JOIN children c ON c.family_id = f.id
  WHERE c.id = NEW.child_id;

  IF NEW.auto_approve_at IS NULL AND NEW.status = 'pending' THEN
    NEW.auto_approve_at := NEW.requested_at + (v_auto_approval_hours || ' hours')::INTERVAL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 4: CREATE TRIGGERS
-- ============================================================================

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

CREATE TRIGGER set_task_completion_auto_approve
  BEFORE INSERT ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION set_auto_approve_at();

-- ============================================================================
-- PART 5: CREATE RLS POLICIES
-- ============================================================================

-- RLS Policies: families
CREATE POLICY "Users can view own family"
  ON families FOR SELECT
  USING (id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own family"
  ON families FOR UPDATE
  USING (id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- RLS Policies: users
CREATE POLICY "Users can view own user data"
  ON users FOR SELECT
  USING (id = auth.uid() OR family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own user data"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- RLS Policies: children
CREATE POLICY "Users can view children in own family"
  ON children FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage children in own family"
  ON children FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- RLS Policies: tasks
CREATE POLICY "Users can view tasks in own family"
  ON tasks FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage tasks in own family"
  ON tasks FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- RLS Policies: task_completions
CREATE POLICY "Users can view task completions in own family"
  ON task_completions FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage task completions in own family"
  ON task_completions FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- RLS Policies: rewards
CREATE POLICY "Users can view rewards in own family"
  ON rewards FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage rewards in own family"
  ON rewards FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- RLS Policies: reward_purchases
CREATE POLICY "Users can view reward purchases in own family"
  ON reward_purchases FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage reward purchases in own family"
  ON reward_purchases FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- RLS Policies: kindness_cards
CREATE POLICY "Users can view kindness cards in own family"
  ON kindness_cards FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create kindness cards in own family"
  ON kindness_cards FOR INSERT
  WITH CHECK (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- RLS Policies: kindness_badges
CREATE POLICY "Users can view kindness badges in own family"
  ON kindness_badges FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage kindness badges in own family"
  ON kindness_badges FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- RLS Policies: app_integrations
CREATE POLICY "Users can view integrations in own family"
  ON app_integrations FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage integrations in own family"
  ON app_integrations FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- RLS Policies: app_integration_events
CREATE POLICY "Users can view integration events in own family"
  ON app_integration_events FOR SELECT
  USING (integration_id IN (
    SELECT id FROM app_integrations
    WHERE family_id = (SELECT family_id FROM users WHERE id = auth.uid())
  ));

-- RLS Policies: weekly_summaries
CREATE POLICY "Users can view summaries in own family"
  ON weekly_summaries FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage summaries in own family"
  ON weekly_summaries FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- RLS Policies: point_transactions
CREATE POLICY "Users can view point transactions in own family"
  ON point_transactions FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- RLS Policies: family_values
CREATE POLICY "Users can view family values in own family"
  ON family_values FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can manage family values in own family"
  ON family_values FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- ============================================================================
-- PART 6: SEED DATA
-- ============================================================================

-- Seed task templates (English)
INSERT INTO task_templates (category, age_group, name_key, name_default, description_key, default_points, default_approval_type, icon, sort_order) VALUES
  ('learning', '8-11', 'task.homework', 'Complete homework', 'task.homework_desc', 50, 'parent', '📚', 1),
  ('learning', '8-11', 'task.reading', 'Read for 30 minutes', 'task.reading_desc', 30, 'timer', '📖', 2),
  ('learning', '8-11', 'task.practice_instrument', 'Practice instrument', 'task.practice_instrument_desc', 40, 'timer', '🎵', 3),

  ('life', '8-11', 'task.clean_room', 'Clean room', 'task.clean_room_desc', 30, 'parent', '🧹', 10),
  ('life', '8-11', 'task.make_bed', 'Make bed', 'task.make_bed_desc', 10, 'auto', '🛏️', 11),
  ('life', '8-11', 'task.dishes', 'Help with dishes', 'task.dishes_desc', 20, 'parent', '🍽️', 12),
  ('life', '8-11', 'task.laundry', 'Put away laundry', 'task.laundry_desc', 15, 'checklist', '👕', 13),

  ('health', '8-11', 'task.exercise', 'Exercise for 30 min', 'task.exercise_desc', 40, 'timer', '🏃', 20),
  ('health', '8-11', 'task.brush_teeth', 'Brush teeth (morning)', 'task.brush_teeth_desc', 5, 'auto', '🦷', 21),
  ('health', '8-11', 'task.vegetables', 'Eat vegetables', 'task.vegetables_desc', 10, 'parent', '🥦', 22),

  ('creativity', '8-11', 'task.draw', 'Draw or paint', 'task.draw_desc', 20, 'timer', '🎨', 30),
  ('creativity', '8-11', 'task.write_story', 'Write a story', 'task.write_story_desc', 30, 'parent', '✍️', 31);

-- Seed reward templates (English)
INSERT INTO reward_templates (category, age_group, name_key, name_default, description_key, description_default, default_points, is_screen_reward, screen_minutes, icon, sort_order) VALUES
  ('screen', '8-11', 'reward.screen_30', '30 min screen time', 'reward.screen_30_desc', 'Enjoy 30 minutes of your favorite show or game', 50, true, 30, '📱', 1),
  ('screen', '8-11', 'reward.screen_60', '1 hour screen time', 'reward.screen_60_desc', 'Enjoy 1 hour of your favorite show or game', 90, true, 60, '📺', 2),

  ('experience', '8-11', 'reward.park', 'Trip to the park', 'reward.park_desc', 'Special trip to your favorite park', 100, false, null, '🏞️', 10),
  ('experience', '8-11', 'reward.ice_cream', 'Ice cream outing', 'reward.ice_cream_desc', 'Choose your favorite ice cream flavor', 80, false, null, '🍦', 11),
  ('experience', '8-11', 'reward.movie', 'Movie night', 'reward.movie_desc', 'Family movie night with popcorn', 120, false, null, '🎬', 12),

  ('autonomy', '8-11', 'reward.late_bedtime', '30 min later bedtime', 'reward.late_bedtime_desc', 'Stay up 30 minutes later tonight', 60, false, null, '🌙', 20),
  ('autonomy', '8-11', 'reward.choose_dinner', 'Choose dinner', 'reward.choose_dinner_desc', 'Pick what we eat for dinner', 70, false, null, '🍕', 21),
  ('autonomy', '8-11', 'reward.sleepover', 'Sleepover with friend', 'reward.sleepover_desc', 'Invite a friend for a sleepover', 200, false, null, '🏠', 22),

  ('item', '8-11', 'reward.small_toy', 'Small toy or book', 'reward.small_toy_desc', 'Choose a small toy or book ($10-15)', 150, false, null, '🎁', 30),
  ('item', '8-11', 'reward.medium_toy', 'Medium toy or game', 'reward.medium_toy_desc', 'Choose a medium toy or game ($20-30)', 300, false, null, '🎮', 31);

-- Add default family values comment
COMMENT ON TABLE family_values IS 'Default family values (No-Point Zone): Greeting family members, Being honest, Saying please and thank you, Helping without being asked, Being kind to siblings';
