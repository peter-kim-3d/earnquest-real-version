-- ============================================================================
-- EarnQuest Complete Database Schema
-- Run this entire file in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- MIGRATION 001: Create Families Table
-- ============================================================================

-- Function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create families table
CREATE TABLE IF NOT EXISTS families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  settings JSONB DEFAULT '{
    "timezone": "America/New_York",
    "language": "en-US",
    "autoApprovalHours": 24,
    "screenBudgetWeeklyMinutes": 300
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_families_created_at ON families(created_at);

-- RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own family"
  ON families FOR SELECT
  USING (
    id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own family"
  ON families FOR UPDATE
  USING (
    id IN (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Trigger
CREATE TRIGGER update_families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION 002: Create Users Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'parent',
  notification_settings JSONB DEFAULT '{
    "email": true,
    "push": false,
    "taskApprovals": true,
    "rewardPurchases": true,
    "weeklyReport": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_role CHECK (role IN ('parent', 'admin'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family members"
  ON users FOR SELECT
  USING (
    family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION 003: Create Children Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_group TEXT NOT NULL,
  birth_year INTEGER,
  avatar_url TEXT,
  points_balance INTEGER DEFAULT 0,
  trust_level INTEGER DEFAULT 1,
  settings JSONB DEFAULT '{
    "weeklyGoal": 500,
    "screenBudgetWeeklyMinutes": 300
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT valid_age_group CHECK (age_group IN ('5-7', '8-11', '12-14')),
  CONSTRAINT valid_trust_level CHECK (trust_level >= 1 AND trust_level <= 3),
  CONSTRAINT non_negative_points CHECK (points_balance >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_children_family_id ON children(family_id);
CREATE INDEX IF NOT EXISTS idx_children_age_group ON children(age_group);
CREATE INDEX IF NOT EXISTS idx_children_active ON children(deleted_at) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family's children"
  ON children FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage their family's children"
  ON children FOR ALL
  USING (
    family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Trigger
CREATE TRIGGER update_children_updated_at
  BEFORE UPDATE ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION 004: Create Tasks Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 50,
  icon TEXT,
  frequency TEXT NOT NULL DEFAULT 'daily',
  days_of_week INTEGER[],
  approval_type TEXT NOT NULL DEFAULT 'manual',
  auto_approve_hours INTEGER DEFAULT 24,
  requires_photo BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT valid_category CHECK (category IN ('hygiene', 'chores', 'learning', 'kindness', 'other')),
  CONSTRAINT valid_frequency CHECK (frequency IN ('daily', 'weekly', 'one_time')),
  CONSTRAINT valid_approval_type CHECK (approval_type IN ('manual', 'auto')),
  CONSTRAINT positive_points CHECK (points >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_family_id ON tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_tasks_child_id ON tasks(child_id);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_frequency ON tasks(frequency);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(is_active) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family's tasks"
  ON tasks FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage their family's tasks"
  ON tasks FOR ALL
  USING (
    family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Trigger
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION 005: Create Task Completions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'pending',

  requested_at TIMESTAMPTZ DEFAULT NOW(),
  proof_image_url TEXT,
  note TEXT,

  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  auto_approve_at TIMESTAMPTZ,

  fix_request JSONB,
  fix_request_count INTEGER DEFAULT 0,

  points_awarded INTEGER,

  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'auto_approved', 'fix_requested', 'rejected')),
  CONSTRAINT fix_request_count_positive CHECK (fix_request_count >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_child_id ON task_completions(child_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_family_id ON task_completions(family_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_status ON task_completions(status);
CREATE INDEX IF NOT EXISTS idx_task_completions_requested_at ON task_completions(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_completions_auto_approve_at ON task_completions(auto_approve_at)
  WHERE status = 'pending' AND auto_approve_at IS NOT NULL;

-- RLS
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family's task completions"
  ON task_completions FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Children can create their own task completions"
  ON task_completions FOR INSERT
  WITH CHECK (child_id = auth.uid());

CREATE POLICY "Parents can manage their family's task completions"
  ON task_completions FOR ALL
  USING (
    family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Trigger
CREATE TRIGGER update_task_completions_updated_at
  BEFORE UPDATE ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION 006: Create Rewards Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  points_cost INTEGER NOT NULL,
  icon TEXT,
  image_url TEXT,

  screen_minutes INTEGER,
  weekly_limit INTEGER,

  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT valid_category CHECK (category IN ('screen', 'autonomy', 'experience', 'savings')),
  CONSTRAINT positive_points_cost CHECK (points_cost >= 0),
  CONSTRAINT screen_minutes_required CHECK (
    (category = 'screen' AND screen_minutes IS NOT NULL AND screen_minutes > 0)
    OR category != 'screen'
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rewards_family_id ON rewards(family_id);
CREATE INDEX IF NOT EXISTS idx_rewards_child_id ON rewards(child_id);
CREATE INDEX IF NOT EXISTS idx_rewards_category ON rewards(category);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards(is_active) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family's rewards"
  ON rewards FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage their family's rewards"
  ON rewards FOR ALL
  USING (
    family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Trigger
CREATE TRIGGER update_rewards_updated_at
  BEFORE UPDATE ON rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION 007: Create Reward Purchases Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS reward_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  points_spent INTEGER NOT NULL,
  screen_minutes INTEGER,

  status TEXT NOT NULL DEFAULT 'purchased',

  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ,
  fulfilled_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('purchased', 'fulfilled', 'cancelled')),
  CONSTRAINT positive_points_spent CHECK (points_spent >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reward_purchases_reward_id ON reward_purchases(reward_id);
CREATE INDEX IF NOT EXISTS idx_reward_purchases_child_id ON reward_purchases(child_id);
CREATE INDEX IF NOT EXISTS idx_reward_purchases_family_id ON reward_purchases(family_id);
CREATE INDEX IF NOT EXISTS idx_reward_purchases_status ON reward_purchases(status);
CREATE INDEX IF NOT EXISTS idx_reward_purchases_purchased_at ON reward_purchases(purchased_at DESC);

-- RLS
ALTER TABLE reward_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family's reward purchases"
  ON reward_purchases FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Children can create their own reward purchases"
  ON reward_purchases FOR INSERT
  WITH CHECK (child_id = auth.uid());

CREATE POLICY "Parents can manage their family's reward purchases"
  ON reward_purchases FOR UPDATE
  USING (
    family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Trigger
CREATE TRIGGER update_reward_purchases_updated_at
  BEFORE UPDATE ON reward_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION 008: Create Point Transactions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  type TEXT NOT NULL,

  reference_type TEXT,
  reference_id UUID,

  description TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_type CHECK (type IN ('task_completion', 'reward_purchase', 'adjustment', 'bonus', 'penalty'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_point_transactions_child_id ON point_transactions(child_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_family_id ON point_transactions(family_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(type);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created_at ON point_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_point_transactions_reference ON point_transactions(reference_type, reference_id);

-- RLS
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family's point transactions"
  ON point_transactions FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Only system can insert point transactions"
  ON point_transactions FOR INSERT
  WITH CHECK (FALSE);

-- ============================================================================
-- MIGRATION 009: Create Kindness Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS kindness_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  from_child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  to_child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  message TEXT NOT NULL,
  action_description TEXT,
  theme TEXT DEFAULT 'cosmic',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT has_sender CHECK (from_user_id IS NOT NULL OR from_child_id IS NOT NULL),
  CONSTRAINT valid_theme CHECK (theme IN ('cosmic', 'nature', 'super_hero', 'love'))
);

CREATE TABLE IF NOT EXISTS kindness_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  badge_type TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  cards_required INTEGER NOT NULL,

  earned_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_level CHECK (level >= 1 AND level <= 3)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kindness_cards_family_id ON kindness_cards(family_id);
CREATE INDEX IF NOT EXISTS idx_kindness_cards_to_child_id ON kindness_cards(to_child_id);
CREATE INDEX IF NOT EXISTS idx_kindness_cards_created_at ON kindness_cards(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kindness_badges_child_id ON kindness_badges(child_id);
CREATE INDEX IF NOT EXISTS idx_kindness_badges_family_id ON kindness_badges(family_id);
CREATE INDEX IF NOT EXISTS idx_kindness_badges_earned_at ON kindness_badges(earned_at DESC);

-- RLS
ALTER TABLE kindness_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kindness_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family's kindness cards"
  ON kindness_cards FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Family members can create kindness cards"
  ON kindness_cards FOR INSERT
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view their family's kindness badges"
  ON kindness_badges FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- MIGRATION 010: Create Family Values and Screen Log Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS family_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  value_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(family_id, value_id)
);

CREATE TABLE IF NOT EXISTS screen_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  reward_purchase_id UUID REFERENCES reward_purchases(id) ON DELETE SET NULL,
  minutes_used INTEGER NOT NULL,

  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT positive_minutes CHECK (minutes_used > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_family_values_family_id ON family_values(family_id);
CREATE INDEX IF NOT EXISTS idx_family_values_active ON family_values(is_active);

CREATE INDEX IF NOT EXISTS idx_screen_usage_child_id ON screen_usage_log(child_id);
CREATE INDEX IF NOT EXISTS idx_screen_usage_family_id ON screen_usage_log(family_id);
CREATE INDEX IF NOT EXISTS idx_screen_usage_created_at ON screen_usage_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_screen_usage_started_at ON screen_usage_log(started_at);

-- RLS
ALTER TABLE family_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their family's values"
  ON family_values FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage their family's values"
  ON family_values FOR ALL
  USING (
    family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can view their family's screen usage"
  ON screen_usage_log FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
      UNION
      SELECT family_id FROM children WHERE id = auth.uid()
    )
  );

CREATE POLICY "Parents can manage screen usage"
  ON screen_usage_log FOR ALL
  USING (
    family_id IN (SELECT family_id FROM users WHERE id = auth.uid())
  );

-- Trigger
CREATE TRIGGER update_family_values_updated_at
  BEFORE UPDATE ON family_values
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION 011: Create Template Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 50,
  icon TEXT,

  age_group TEXT NOT NULL,
  style TEXT NOT NULL,

  frequency TEXT NOT NULL DEFAULT 'daily',
  approval_type TEXT NOT NULL DEFAULT 'manual',
  settings JSONB DEFAULT '{}',

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_category CHECK (category IN ('hygiene', 'chores', 'learning', 'kindness', 'other')),
  CONSTRAINT valid_age_group CHECK (age_group IN ('5-7', '8-11', '12-14', 'all')),
  CONSTRAINT valid_style CHECK (style IN ('easy', 'balanced', 'learning', 'all')),
  CONSTRAINT valid_frequency CHECK (frequency IN ('daily', 'weekly', 'one_time')),
  CONSTRAINT valid_approval_type CHECK (approval_type IN ('manual', 'auto'))
);

CREATE TABLE IF NOT EXISTS reward_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  points_cost INTEGER NOT NULL,
  icon TEXT,

  age_group TEXT NOT NULL,
  style TEXT NOT NULL,

  screen_minutes INTEGER,
  weekly_limit INTEGER,
  settings JSONB DEFAULT '{}',

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_category CHECK (category IN ('screen', 'autonomy', 'experience', 'savings')),
  CONSTRAINT valid_age_group CHECK (age_group IN ('5-7', '8-11', '12-14', 'all')),
  CONSTRAINT valid_style CHECK (style IN ('easy', 'balanced', 'learning', 'all'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_templates_category ON task_templates(category);
CREATE INDEX IF NOT EXISTS idx_task_templates_age_group ON task_templates(age_group);
CREATE INDEX IF NOT EXISTS idx_task_templates_style ON task_templates(style);
CREATE INDEX IF NOT EXISTS idx_task_templates_active ON task_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_reward_templates_category ON reward_templates(category);
CREATE INDEX IF NOT EXISTS idx_reward_templates_age_group ON reward_templates(age_group);
CREATE INDEX IF NOT EXISTS idx_reward_templates_style ON reward_templates(style);
CREATE INDEX IF NOT EXISTS idx_reward_templates_active ON reward_templates(is_active);

-- RLS
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view task templates"
  ON task_templates FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can view reward templates"
  ON reward_templates FOR SELECT
  USING (TRUE);

-- ============================================================================
-- MIGRATION 012: Create Functions
-- ============================================================================

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
  SELECT family_id, points_balance
  INTO v_family_id, v_new_balance
  FROM children
  WHERE id = p_child_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Child not found';
  END IF;

  v_new_balance := v_new_balance + p_amount;

  IF v_new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient points';
  END IF;

  UPDATE children
  SET points_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_child_id;

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

CREATE OR REPLACE FUNCTION approve_task_completion(
  p_completion_id UUID,
  p_approved_by UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_completion task_completions%ROWTYPE;
  v_task tasks%ROWTYPE;
  v_result JSONB;
BEGIN
  SELECT * INTO v_completion
  FROM task_completions
  WHERE id = p_completion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task completion not found';
  END IF;

  IF v_completion.status NOT IN ('pending', 'fix_requested') THEN
    RAISE EXCEPTION 'Task completion is not pending';
  END IF;

  SELECT * INTO v_task
  FROM tasks
  WHERE id = v_completion.task_id;

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
  SELECT * INTO v_reward
  FROM rewards
  WHERE id = p_reward_id AND is_active = TRUE AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Reward not found or inactive');
  END IF;

  SELECT * INTO v_child
  FROM children
  WHERE id = p_child_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Child not found');
  END IF;

  v_family_id := v_child.family_id;

  IF v_child.points_balance < v_reward.points_cost THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Insufficient points');
  END IF;

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

  IF v_reward.category = 'screen' THEN
    v_screen_budget := COALESCE((v_child.settings->>'screenBudgetWeeklyMinutes')::INTEGER, 300);

    SELECT COALESCE(SUM(minutes_used), 0)
    INTO v_weekly_screen_usage
    FROM screen_usage_log
    WHERE child_id = p_child_id
      AND created_at >= date_trunc('week', NOW());

    IF (v_weekly_screen_usage + v_reward.screen_minutes) > v_screen_budget THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'Screen budget exceeded');
    END IF;
  END IF;

  v_result := add_points(
    p_child_id => p_child_id,
    p_amount => -v_reward.points_cost,
    p_type => 'reward_purchase',
    p_reference_type => 'reward',
    p_reference_id => p_reward_id,
    p_description => 'Purchased: ' || v_reward.name
  );

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

-- ============================================================================
-- MIGRATION 013: Create Triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION create_kindness_badge_if_earned()
RETURNS TRIGGER AS $$
DECLARE
  v_card_count INTEGER;
  v_badge_level INTEGER;
  v_cards_required INTEGER;
  v_badge_type TEXT;
  v_family_id UUID;
BEGIN
  SELECT COUNT(*), family_id
  INTO v_card_count, v_family_id
  FROM kindness_cards
  WHERE to_child_id = NEW.to_child_id
  GROUP BY family_id;

  v_badge_type := 'kindness';

  IF v_card_count >= 20 THEN
    v_badge_level := 3;
    v_cards_required := 20;
  ELSIF v_card_count >= 10 THEN
    v_badge_level := 2;
    v_cards_required := 10;
  ELSIF v_card_count >= 5 THEN
    v_badge_level := 1;
    v_cards_required := 5;
  ELSE
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM kindness_badges
    WHERE child_id = NEW.to_child_id
      AND badge_type = v_badge_type
      AND level = v_badge_level
  ) THEN
    INSERT INTO kindness_badges (
      child_id,
      family_id,
      badge_type,
      level,
      cards_required,
      earned_at
    ) VALUES (
      NEW.to_child_id,
      v_family_id,
      v_badge_type,
      v_badge_level,
      v_cards_required,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER kindness_card_badge_trigger
  AFTER INSERT ON kindness_cards
  FOR EACH ROW
  EXECUTE FUNCTION create_kindness_badge_if_earned();

-- ============================================================================
-- MIGRATION 014: Create Views
-- ============================================================================

CREATE OR REPLACE VIEW v_child_today_tasks AS
SELECT
  t.id,
  t.family_id,
  t.child_id,
  t.name,
  t.description,
  t.category,
  t.points,
  t.icon,
  t.frequency,
  t.approval_type,
  t.requires_photo,
  c.name AS child_name,
  (
    SELECT tc.id
    FROM task_completions tc
    WHERE tc.task_id = t.id
      AND tc.child_id = COALESCE(t.child_id, c.id)
      AND tc.requested_at >= date_trunc('day', NOW())
    ORDER BY tc.requested_at DESC
    LIMIT 1
  ) AS today_completion_id,
  (
    SELECT tc.status
    FROM task_completions tc
    WHERE tc.task_id = t.id
      AND tc.child_id = COALESCE(t.child_id, c.id)
      AND tc.requested_at >= date_trunc('day', NOW())
    ORDER BY tc.requested_at DESC
    LIMIT 1
  ) AS today_status
FROM tasks t
CROSS JOIN children c
WHERE t.is_active = TRUE
  AND t.deleted_at IS NULL
  AND c.family_id = t.family_id
  AND (t.child_id IS NULL OR t.child_id = c.id)
  AND (
    t.frequency = 'daily'
    OR (t.frequency = 'weekly' AND (t.days_of_week IS NULL OR EXTRACT(DOW FROM NOW())::INTEGER = ANY(t.days_of_week)))
    OR t.frequency = 'one_time'
  );

CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT
  tc.id AS completion_id,
  tc.task_id,
  tc.child_id,
  tc.family_id,
  tc.status,
  tc.requested_at,
  tc.auto_approve_at,
  tc.proof_image_url,
  tc.note,
  tc.fix_request,
  tc.fix_request_count,
  t.name AS task_name,
  t.description AS task_description,
  t.points,
  t.category,
  t.icon AS task_icon,
  c.name AS child_name,
  c.avatar_url AS child_avatar
FROM task_completions tc
JOIN tasks t ON tc.task_id = t.id
JOIN children c ON tc.child_id = c.id
WHERE tc.status IN ('pending', 'fix_requested')
ORDER BY tc.requested_at ASC;

CREATE OR REPLACE VIEW v_weekly_screen_usage AS
SELECT
  c.id AS child_id,
  c.family_id,
  c.name AS child_name,
  COALESCE((c.settings->>'screenBudgetWeeklyMinutes')::INTEGER, 300) AS weekly_budget_minutes,
  COALESCE(SUM(sul.minutes_used), 0) AS minutes_used_this_week,
  COALESCE((c.settings->>'screenBudgetWeeklyMinutes')::INTEGER, 300) - COALESCE(SUM(sul.minutes_used), 0) AS minutes_remaining
FROM children c
LEFT JOIN screen_usage_log sul ON c.id = sul.child_id
  AND sul.created_at >= date_trunc('week', NOW())
GROUP BY c.id, c.family_id, c.name, c.settings;

-- ============================================================================
-- MIGRATION 015: Seed Templates
-- ============================================================================

INSERT INTO task_templates (name, description, category, points, icon, age_group, style, frequency, approval_type, settings) VALUES
('Brush Teeth', 'Brush for at least 2 minutes', 'hygiene', 50, 'dentistry', 'all', 'easy', 'daily', 'manual', '{"reminder_time": "08:00"}'),
('Put Away Toys', 'Clean up toys before bedtime', 'chores', 50, 'toys', 'all', 'easy', 'daily', 'manual', '{"reminder_time": "19:00"}'),
('Say Please & Thank You', 'Use polite words', 'kindness', 30, 'handshake', 'all', 'easy', 'daily', 'auto', '{}');

INSERT INTO task_templates (name, description, category, points, icon, age_group, style, frequency, approval_type, settings) VALUES
('Complete Homework', 'Finish all homework assignments', 'learning', 100, 'school', 'all', 'balanced', 'daily', 'manual', '{}'),
('Feed the Dog', 'Give food and water to pet', 'chores', 50, 'pets', 'all', 'balanced', 'daily', 'manual', '{}'),
('Clear the Table', 'Clear dishes after dinner', 'chores', 50, 'restaurant', 'all', 'balanced', 'daily', 'manual', '{}'),
('Make Your Bed', 'Make bed in the morning', 'chores', 40, 'bed', 'all', 'balanced', 'daily', 'manual', '{}'),
('Practice Instrument', '20 minutes of practice', 'learning', 80, 'piano', '8-11', 'balanced', 'daily', 'manual', '{}'),
('Help with Laundry', 'Fold and put away clothes', 'chores', 60, 'laundry', '8-11', 'balanced', 'weekly', 'manual', '{"days_of_week": [0, 6]}');

INSERT INTO task_templates (name, description, category, points, icon, age_group, style, frequency, approval_type, settings) VALUES
('Read for 30 Minutes', 'Read any book for 30 minutes', 'learning', 100, 'menu_book', 'all', 'learning', 'daily', 'manual', '{}'),
('Math Practice', 'Complete 10 math problems', 'learning', 120, 'calculate', '8-11', 'learning', 'daily', 'manual', '{}'),
('Science Project Work', 'Work on science project', 'learning', 150, 'science', '8-11', 'learning', 'weekly', 'manual', '{}'),
('Write in Journal', 'Write at least one page', 'learning', 80, 'edit_note', '8-11', 'learning', 'daily', 'manual', '{}'),
('Learn New Vocabulary', 'Learn 5 new words', 'learning', 70, 'translate', 'all', 'learning', 'daily', 'manual', '{}'),
('Practice Typing', '15 minutes typing practice', 'learning', 60, 'keyboard', '8-11', 'learning', 'daily', 'auto', '{}'),
('Brain Teaser Challenge', 'Solve puzzles or brain teasers', 'learning', 90, 'psychology', 'all', 'learning', 'daily', 'manual', '{}'),
('Clean Study Space', 'Organize desk and materials', 'chores', 50, 'desk', 'all', 'learning', 'weekly', 'manual', '{}');

INSERT INTO reward_templates (name, description, category, points_cost, icon, age_group, style, screen_minutes, weekly_limit, settings) VALUES
('30 Minutes Screen Time', 'Watch TV or play games', 'screen', 150, 'tv', 'all', 'all', 30, 6, '{"color": "#3b82f6"}'),
('1 Hour Screen Time', 'Extended screen time', 'screen', 280, 'videogame_asset', 'all', 'all', 60, 3, '{"color": "#2563eb"}'),
('Weekend Movie Night', 'Pick and watch a movie', 'screen', 400, 'movie', 'all', 'all', 120, 2, '{"color": "#1e40af"}');

INSERT INTO reward_templates (name, description, category, points_cost, icon, age_group, style, weekly_limit, settings) VALUES
('Pick Tonight''s Dinner', 'Choose what family eats', 'autonomy', 200, 'restaurant_menu', 'all', 'all', 1, '{"color": "#f97316"}'),
('Stay Up 30 Min Late', 'Extra 30 minutes before bed', 'autonomy', 180, 'bedtime', 'all', 'all', 2, '{"color": "#ea580c"}'),
('Choose Weekend Activity', 'Pick what family does together', 'autonomy', 300, 'celebration', 'all', 'all', 1, '{"color": "#c2410c"}'),
('Skip One Chore', 'Skip a chore of your choice', 'autonomy', 250, 'close', 'all', 'all', 1, '{"color": "#9a3412"}');

INSERT INTO reward_templates (name, description, category, points_cost, icon, age_group, style, settings) VALUES
('Ice Cream Trip', 'Go out for ice cream', 'experience', 300, 'icecream', 'all', 'all', '{"color": "#ec4899"}'),
('Park Playdate', 'Invite friend to park', 'experience', 350, 'park', 'all', 'all', '{"color": "#db2777"}'),
('Movie Theater', 'See a movie in theater', 'experience', 600, 'local_movies', 'all', 'all', '{"color": "#be185d"}'),
('Mini Golf Outing', 'Family mini golf trip', 'experience', 500, 'golf_course', '8-11', 'all', '{"color": "#9f1239"}'),
('Museum Visit', 'Visit museum of choice', 'experience', 550, 'museum', '8-11', 'learning', '{"color": "#881337"}');

INSERT INTO reward_templates (name, description, category, points_cost, icon, age_group, style, settings) VALUES
('Save Towards Lego Set', 'Put points towards big goal', 'savings', 1000, 'toys', 'all', 'all', '{"color": "#14b8a6"}'),
('Save Towards Bike', 'Save for new bicycle', 'savings', 2000, 'pedal_bike', 'all', 'all', '{"color": "#0d9488"}'),
('Save Towards Game', 'Save for video game', 'savings', 800, 'sports_esports', '8-11', 'all', '{"color": "#0f766e"}');

-- ============================================================================
-- Setup Complete!
-- ============================================================================

-- Verify tables were created
SELECT 'Setup complete! Tables created:' AS status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
