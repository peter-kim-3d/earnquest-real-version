-- Create families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,

  -- Settings (JSONB for flexibility)
  settings JSONB DEFAULT '{
    "timezone": "America/New_York",
    "language": "en",
    "weekStartsOn": "sunday",
    "autoApprovalHours": 24,
    "screenBudgetWeeklyMinutes": 300
  }'::jsonb,

  -- Subscription info
  subscription_tier VARCHAR(20) DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_families_deleted_at ON families(deleted_at) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own family"
  ON families FOR SELECT
  USING (id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own family"
  ON families FOR UPDATE
  USING (id = (SELECT family_id FROM users WHERE id = auth.uid()));
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,

  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'parent',
  avatar_url TEXT,

  -- Settings
  settings JSONB DEFAULT '{
    "notifications": {
      "taskCompletion": true,
      "weeklyReport": true,
      "rewardPurchase": true
    }
  }'::jsonb,

  -- Metadata
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_users_email ON users(email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own family members"
  ON users FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());
-- Create children table
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  name VARCHAR(100) NOT NULL,
  age_group VARCHAR(10) NOT NULL,
  birth_year INT,
  avatar_url TEXT,
  pin_code VARCHAR(4),

  -- Points
  points_balance INT DEFAULT 0,
  points_lifetime_earned INT DEFAULT 0,

  -- Trust level
  trust_level INT DEFAULT 1,
  trust_streak_days INT DEFAULT 0,

  -- Settings
  settings JSONB DEFAULT '{
    "weeklyGoal": 500,
    "screenBudgetUsedThisWeek": 0
  }'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_children_family_id ON children(family_id);
CREATE INDEX idx_children_age_group ON children(age_group);

-- Enable RLS
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own children"
  ON children FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own children"
  ON children FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
-- Create task_templates table
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Classification
  category VARCHAR(20) NOT NULL,
  age_group VARCHAR(10),

  -- Content
  name_key VARCHAR(100) NOT NULL,
  name_default VARCHAR(200) NOT NULL,
  description_key VARCHAR(100),
  icon VARCHAR(50),

  -- Points default
  default_points INT NOT NULL,

  -- Approval settings
  default_approval_type VARCHAR(20) DEFAULT 'parent',
  default_timer_minutes INT,
  default_checklist JSONB,

  -- Metadata
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Task templates are system-wide, no RLS needed
-- Seed data will be added in a separate migration
-- Create tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  template_id UUID REFERENCES task_templates(id),

  -- Target child (null means all children)
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,

  -- Classification
  category VARCHAR(20) NOT NULL,

  -- Content
  name VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50),

  -- Points
  points INT NOT NULL,

  -- Approval settings
  approval_type VARCHAR(20) DEFAULT 'parent',
  timer_minutes INT,
  checklist JSONB,
  photo_required BOOLEAN DEFAULT false,

  -- Trust task
  is_trust_task BOOLEAN DEFAULT false,
  min_trust_level INT DEFAULT 1,

  -- Schedule (for future use)
  schedule JSONB,

  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_tasks_family_id ON tasks(family_id);
CREATE INDEX idx_tasks_child_id ON tasks(child_id);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_is_active ON tasks(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family tasks"
  ON tasks FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own family tasks"
  ON tasks FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
-- Create task_completions table
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Status
  status VARCHAR(20) DEFAULT 'pending',

  -- Points (saved at approval time)
  points_awarded INT,

  -- Evidence
  evidence JSONB,

  -- Fix request
  fix_request JSONB,
  fix_request_count INT DEFAULT 0,

  -- Approval info
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  auto_approve_at TIMESTAMPTZ,

  -- Timestamps
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_completions_child_id ON task_completions(child_id);
CREATE INDEX idx_task_completions_family_id ON task_completions(family_id);
CREATE INDEX idx_task_completions_status ON task_completions(status);
CREATE INDEX idx_task_completions_requested_at ON task_completions(requested_at);
CREATE INDEX idx_task_completions_auto_approve ON task_completions(auto_approve_at)
  WHERE status = 'pending';

-- Enable RLS
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family task completions"
  ON task_completions FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own family task completions"
  ON task_completions FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
-- Create reward_templates table
CREATE TABLE reward_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Classification
  category VARCHAR(20) NOT NULL,
  age_group VARCHAR(10),

  -- Content
  name_key VARCHAR(100) NOT NULL,
  name_default VARCHAR(200) NOT NULL,
  description_key VARCHAR(100),
  description_default TEXT,
  icon VARCHAR(50),

  -- Points default
  default_points INT NOT NULL,

  -- Limits
  default_weekly_limit INT,
  is_screen_reward BOOLEAN DEFAULT false,
  screen_minutes INT,

  -- Metadata
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: Reward templates are system-wide, no RLS needed
-- Seed data will be added in a separate migration
-- Create rewards table
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  template_id UUID REFERENCES reward_templates(id),

  -- Classification
  category VARCHAR(20) NOT NULL,

  -- Content
  name VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50),

  -- Points
  points INT NOT NULL,

  -- Limits
  weekly_limit INT,
  is_screen_reward BOOLEAN DEFAULT false,
  screen_minutes INT,

  -- Parent action required
  requires_parent_action BOOLEAN DEFAULT true,

  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_rewards_family_id ON rewards(family_id);
CREATE INDEX idx_rewards_category ON rewards(category);

-- Enable RLS
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family rewards"
  ON rewards FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own family rewards"
  ON rewards FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
-- Create reward_purchases table (tickets)
CREATE TABLE reward_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Purchase time info
  reward_name VARCHAR(200) NOT NULL,
  points_spent INT NOT NULL,

  -- Ticket status
  status VARCHAR(20) DEFAULT 'purchased',

  -- Fulfillment info
  fulfilled_by UUID REFERENCES users(id),
  fulfilled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Metadata
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reward_purchases_child_id ON reward_purchases(child_id);
CREATE INDEX idx_reward_purchases_family_id ON reward_purchases(family_id);
CREATE INDEX idx_reward_purchases_status ON reward_purchases(status);

-- Enable RLS
ALTER TABLE reward_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family reward purchases"
  ON reward_purchases FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own family reward purchases"
  ON reward_purchases FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
-- Create kindness_cards table
CREATE TABLE kindness_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- From/To
  from_user_id UUID REFERENCES users(id),
  from_child_id UUID REFERENCES children(id),
  to_child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  -- Content
  message TEXT NOT NULL,
  action_description TEXT,

  -- Weekly bonus selection
  is_weekly_bonus BOOLEAN DEFAULT false,
  bonus_points INT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_kindness_cards_to_child ON kindness_cards(to_child_id);
CREATE INDEX idx_kindness_cards_family_id ON kindness_cards(family_id);
CREATE INDEX idx_kindness_cards_created_at ON kindness_cards(created_at);

-- Enable RLS
ALTER TABLE kindness_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family kindness cards"
  ON kindness_cards FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own family kindness cards"
  ON kindness_cards FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- Create kindness_badges table
CREATE TABLE kindness_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Badge info
  badge_type VARCHAR(50) DEFAULT 'kindness',
  badge_number INT NOT NULL,

  -- Earning criteria (5 kindness cards)
  cards_counted INT DEFAULT 5,

  -- Metadata
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_kindness_badges_child_id ON kindness_badges(child_id);

-- Enable RLS
ALTER TABLE kindness_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family kindness badges"
  ON kindness_badges FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own family kindness badges"
  ON kindness_badges FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
-- Create app_integrations table
CREATE TABLE app_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- App info
  app_name VARCHAR(100) NOT NULL,
  app_display_name VARCHAR(100) NOT NULL,

  -- Integration settings
  is_enabled BOOLEAN DEFAULT true,
  points_per_completion INT NOT NULL,
  daily_limit INT,

  -- Credentials (encrypted)
  credentials JSONB,

  -- Metadata
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_app_integrations_family_id ON app_integrations(family_id);
CREATE INDEX idx_app_integrations_app_name ON app_integrations(app_name);

-- Enable RLS
ALTER TABLE app_integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family app integrations"
  ON app_integrations FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own family app integrations"
  ON app_integrations FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- Create app_integration_events table
CREATE TABLE app_integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES app_integrations(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Event info
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  external_event_id VARCHAR(255),

  -- Points
  points_awarded INT NOT NULL,

  -- Metadata
  event_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_app_events_child_id ON app_integration_events(child_id);
CREATE INDEX idx_app_events_integration_id ON app_integration_events(integration_id);
CREATE INDEX idx_app_events_external_id ON app_integration_events(external_event_id);

-- Enable RLS
ALTER TABLE app_integration_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family app integration events"
  ON app_integration_events FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
-- Create weekly_summaries table
CREATE TABLE weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,

  -- Period
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,

  -- Statistics
  stats JSONB NOT NULL,
  /*
  Example stats structure:
  {
    "tasksCompleted": 15,
    "pointsEarned": 520,
    "pointsSpent": 300,
    "screenMinutesUsed": 180,
    "topTask": "Complete homework",
    "kindnessCardsReceived": 3,
    "trustLevelChange": 0,
    "streakDays": 5
  }
  */

  -- Weekly kindness bonus
  kindness_bonus_card_id UUID REFERENCES kindness_cards(id),
  kindness_bonus_points INT,

  -- Parent note
  parent_note TEXT,

  -- Metadata
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_weekly_summaries_child_id ON weekly_summaries(child_id);
CREATE INDEX idx_weekly_summaries_week ON weekly_summaries(week_start);

-- Unique constraint
ALTER TABLE weekly_summaries ADD CONSTRAINT unique_child_week
  UNIQUE (child_id, week_start);

-- Enable RLS
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family weekly summaries"
  ON weekly_summaries FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own family weekly summaries"
  ON weekly_summaries FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- Create point_transactions table (audit trail)
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Transaction type
  type VARCHAR(30) NOT NULL,

  -- Amount (positive = earned, negative = spent)
  amount INT NOT NULL,
  balance_after INT NOT NULL,

  -- Reference
  reference_type VARCHAR(30),
  reference_id UUID,

  -- Description
  description TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_point_transactions_child_id ON point_transactions(child_id);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at);
CREATE INDEX idx_point_transactions_type ON point_transactions(type);

-- Enable RLS
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family point transactions"
  ON point_transactions FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
-- Create family_values table (No-Point Zone)
CREATE TABLE family_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Content
  value_key VARCHAR(100),
  value_text VARCHAR(200) NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_family_values_family_id ON family_values(family_id);

-- Enable RLS
ALTER TABLE family_values ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Parents can view own family values"
  ON family_values FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own family values"
  ON family_values FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));
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
  -- Check if completed today
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
  -- Today's completed tasks
  (SELECT COUNT(*)
   FROM task_completions tc
   WHERE tc.child_id = c.id
   AND DATE(tc.requested_at) = CURRENT_DATE
   AND tc.status IN ('approved', 'auto_approved')) as tasks_completed_today,
  -- Pending approvals
  (SELECT COUNT(*)
   FROM task_completions tc
   WHERE tc.child_id = c.id
   AND tc.status = 'pending') as tasks_pending_approval,
  -- This week's points
  (SELECT COALESCE(SUM(amount), 0)
   FROM point_transactions pt
   WHERE pt.child_id = c.id
   AND pt.amount > 0
   AND DATE_TRUNC('week', pt.created_at) = DATE_TRUNC('week', CURRENT_DATE)) as points_earned_this_week,
  -- Screen time this week
  (SELECT COALESCE(SUM(r.screen_minutes), 0)
   FROM reward_purchases rp
   JOIN rewards r ON rp.reward_id = r.id
   WHERE rp.child_id = c.id
   AND r.is_screen_reward = true
   AND rp.status != 'cancelled'
   AND DATE_TRUNC('week', rp.purchased_at) = DATE_TRUNC('week', CURRENT_DATE)) as screen_minutes_this_week,
  -- Kindness cards received this week
  (SELECT COUNT(*)
   FROM kindness_cards kc
   WHERE kc.to_child_id = c.id
   AND DATE_TRUNC('week', kc.created_at) = DATE_TRUNC('week', CURRENT_DATE)) as kindness_cards_this_week
FROM children c
WHERE c.deleted_at IS NULL;
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

-- Add default family values (optional, families can customize)
-- Note: These will be copied when a family is created, not inserted directly
-- This is just for reference
COMMENT ON TABLE family_values IS 'Default family values (No-Point Zone): Greeting family members, Being honest, Saying please and thank you, Helping without being asked, Being kind to siblings';
-- Combined migration file created at Tue Jan  6 02:48:31 EST 2026
