-- Migration: Screen Time Budget System (V1.1)
-- This replaces the point-based screen time purchase with a budget system
-- Screen time is now separate from points: base allocation + bonus from quests

-- ============================================================================
-- 1. Create screen_time_budgets table
-- ============================================================================

CREATE TABLE IF NOT EXISTS screen_time_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,

  -- Budget allocation
  base_minutes INT NOT NULL DEFAULT 180,      -- Parent-set weekly base (default 3 hours)
  bonus_minutes INT NOT NULL DEFAULT 0,       -- Earned from quests
  used_minutes INT NOT NULL DEFAULT 0,        -- Minutes used this week

  -- Daily limits
  daily_limit_minutes INT NOT NULL DEFAULT 60, -- Max per day (default 1 hour)
  cooldown_minutes INT NOT NULL DEFAULT 30,    -- Rest between sessions (default 30 min)

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One budget record per child per week
  UNIQUE(child_id, week_start_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_screen_time_budgets_child_id ON screen_time_budgets(child_id);
CREATE INDEX IF NOT EXISTS idx_screen_time_budgets_family_id ON screen_time_budgets(family_id);
CREATE INDEX IF NOT EXISTS idx_screen_time_budgets_week ON screen_time_budgets(child_id, week_start_date DESC);

-- ============================================================================
-- 2. Add screen_bonus_minutes to tasks table
-- ============================================================================

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS screen_bonus_minutes INT DEFAULT NULL;
COMMENT ON COLUMN tasks.screen_bonus_minutes IS 'Bonus screen time (in minutes) awarded when task is completed. NULL means no screen time bonus.';

-- ============================================================================
-- 3. Create helper function to get current week start date
-- ============================================================================

CREATE OR REPLACE FUNCTION get_week_start_date(
  p_family_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS DATE AS $$
DECLARE
  v_week_starts_on TEXT;
  v_dow INT;
  v_target_dow INT;
BEGIN
  -- Get family's week start preference (default: monday)
  SELECT COALESCE(settings->>'weekStartsOn', 'monday')
  INTO v_week_starts_on
  FROM families
  WHERE id = p_family_id;

  -- Convert day name to day of week (0=Sunday, 1=Monday, etc.)
  v_target_dow := CASE v_week_starts_on
    WHEN 'sunday' THEN 0
    WHEN 'monday' THEN 1
    WHEN 'tuesday' THEN 2
    WHEN 'wednesday' THEN 3
    WHEN 'thursday' THEN 4
    WHEN 'friday' THEN 5
    WHEN 'saturday' THEN 6
    ELSE 1 -- Default to Monday
  END;

  -- Get current day of week
  v_dow := EXTRACT(DOW FROM p_date)::INT;

  -- Calculate week start date
  RETURN p_date - ((v_dow - v_target_dow + 7) % 7);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 4. Create function to get or create current week's budget
-- ============================================================================

CREATE OR REPLACE FUNCTION get_or_create_screen_budget(
  p_child_id UUID
) RETURNS screen_time_budgets AS $$
DECLARE
  v_child RECORD;
  v_week_start DATE;
  v_budget screen_time_budgets;
  v_base_minutes INT;
  v_daily_limit INT;
  v_cooldown INT;
BEGIN
  -- Get child and family info
  SELECT c.*, f.id as fam_id
  INTO v_child
  FROM children c
  JOIN families f ON c.family_id = f.id
  WHERE c.id = p_child_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Child not found: %', p_child_id;
  END IF;

  -- Get week start date for this family
  v_week_start := get_week_start_date(v_child.fam_id);

  -- Try to get existing budget
  SELECT * INTO v_budget
  FROM screen_time_budgets
  WHERE child_id = p_child_id AND week_start_date = v_week_start;

  IF FOUND THEN
    RETURN v_budget;
  END IF;

  -- Create new budget for this week
  -- Get settings from child or use defaults
  v_base_minutes := COALESCE((v_child.settings->>'screenBudgetWeeklyMinutes')::INT, 180);
  v_daily_limit := COALESCE((v_child.settings->>'screenDailyLimitMinutes')::INT, 60);
  v_cooldown := COALESCE((v_child.settings->>'screenCooldownMinutes')::INT, 30);

  INSERT INTO screen_time_budgets (
    child_id, family_id, week_start_date,
    base_minutes, bonus_minutes, used_minutes,
    daily_limit_minutes, cooldown_minutes
  ) VALUES (
    p_child_id, v_child.fam_id, v_week_start,
    v_base_minutes, 0, 0,
    v_daily_limit, v_cooldown
  )
  RETURNING * INTO v_budget;

  RETURN v_budget;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. Create function to add screen time bonus (called on task completion)
-- ============================================================================

CREATE OR REPLACE FUNCTION add_screen_time_bonus(
  p_child_id UUID,
  p_minutes INT,
  p_task_id UUID DEFAULT NULL
) RETURNS INT AS $$
DECLARE
  v_budget screen_time_budgets;
  v_new_bonus INT;
BEGIN
  IF p_minutes <= 0 THEN
    RETURN 0;
  END IF;

  -- Get or create current week's budget
  v_budget := get_or_create_screen_budget(p_child_id);

  -- Add bonus minutes
  UPDATE screen_time_budgets
  SET
    bonus_minutes = bonus_minutes + p_minutes,
    updated_at = now()
  WHERE id = v_budget.id
  RETURNING bonus_minutes INTO v_new_bonus;

  RETURN v_new_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. Create function to use screen time
-- ============================================================================

CREATE OR REPLACE FUNCTION use_screen_time(
  p_child_id UUID,
  p_minutes INT
) RETURNS JSONB AS $$
DECLARE
  v_budget screen_time_budgets;
  v_total_available INT;
  v_today_used INT;
  v_remaining_today INT;
  v_actual_minutes INT;
BEGIN
  -- Get current budget
  v_budget := get_or_create_screen_budget(p_child_id);

  -- Calculate total available this week
  v_total_available := v_budget.base_minutes + v_budget.bonus_minutes - v_budget.used_minutes;

  IF v_total_available <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No screen time remaining this week',
      'remaining_weekly', 0,
      'remaining_today', 0
    );
  END IF;

  -- Calculate today's usage
  SELECT COALESCE(SUM(minutes_used), 0)
  INTO v_today_used
  FROM screen_usage_log
  WHERE child_id = p_child_id
    AND DATE(started_at) = CURRENT_DATE;

  v_remaining_today := v_budget.daily_limit_minutes - v_today_used;

  IF v_remaining_today <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Daily screen time limit reached',
      'remaining_weekly', v_total_available,
      'remaining_today', 0
    );
  END IF;

  -- Use the minimum of requested, remaining weekly, and remaining today
  v_actual_minutes := LEAST(p_minutes, v_total_available, v_remaining_today);

  -- Update budget
  UPDATE screen_time_budgets
  SET
    used_minutes = used_minutes + v_actual_minutes,
    updated_at = now()
  WHERE id = v_budget.id;

  -- Log usage
  INSERT INTO screen_usage_log (child_id, family_id, minutes_used, started_at)
  VALUES (p_child_id, v_budget.family_id, v_actual_minutes, now());

  RETURN jsonb_build_object(
    'success', true,
    'minutes_used', v_actual_minutes,
    'remaining_weekly', v_total_available - v_actual_minutes,
    'remaining_today', v_remaining_today - v_actual_minutes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. Create view for child's current screen budget status
-- ============================================================================

CREATE OR REPLACE VIEW v_child_screen_budget AS
SELECT
  c.id AS child_id,
  c.family_id,
  c.name AS child_name,
  b.week_start_date,
  b.base_minutes,
  b.bonus_minutes,
  b.used_minutes,
  (b.base_minutes + b.bonus_minutes) AS total_budget,
  (b.base_minutes + b.bonus_minutes - b.used_minutes) AS remaining_weekly,
  b.daily_limit_minutes,
  COALESCE(today.today_used, 0) AS today_used,
  (b.daily_limit_minutes - COALESCE(today.today_used, 0)) AS remaining_today,
  b.cooldown_minutes
FROM children c
LEFT JOIN screen_time_budgets b ON c.id = b.child_id
  AND b.week_start_date = get_week_start_date(c.family_id)
LEFT JOIN (
  SELECT child_id, SUM(minutes_used) AS today_used
  FROM screen_usage_log
  WHERE DATE(started_at) = CURRENT_DATE
  GROUP BY child_id
) today ON c.id = today.child_id
WHERE c.deleted_at IS NULL;

-- ============================================================================
-- 8. RLS Policies for screen_time_budgets
-- ============================================================================

ALTER TABLE screen_time_budgets ENABLE ROW LEVEL SECURITY;

-- Parents can view/manage budgets for their family's children
CREATE POLICY "Parents can view family screen budgets"
  ON screen_time_budgets FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Parents can update family screen budgets"
  ON screen_time_budgets FOR UPDATE
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

-- Children can view their own budget (via authenticated session)
CREATE POLICY "Children can view own screen budget"
  ON screen_time_budgets FOR SELECT
  USING (
    child_id IN (
      SELECT id FROM children WHERE family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- Only functions can insert (SECURITY DEFINER)
CREATE POLICY "Service role can insert budgets"
  ON screen_time_budgets FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 9. Update families settings default to include weekStartsOn
-- ============================================================================

-- Add weekStartsOn to families settings if not exists
UPDATE families
SET settings = settings || '{"weekStartsOn": "monday"}'::jsonb
WHERE settings->>'weekStartsOn' IS NULL;

COMMENT ON TABLE screen_time_budgets IS 'Weekly screen time budget tracking per child. Replaces point-based screen time purchase.';
