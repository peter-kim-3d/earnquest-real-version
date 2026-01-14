-- Create task_templates table
CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 50,
  icon TEXT,

  age_group TEXT NOT NULL, -- '5-7', '8-11', '12-14', 'all'
  style TEXT NOT NULL, -- 'easy', 'balanced', 'learning', 'all'

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

-- Create reward_templates table
CREATE TABLE IF NOT EXISTS reward_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  points_cost INTEGER NOT NULL,
  icon TEXT,

  age_group TEXT NOT NULL, -- '5-7', '8-11', '12-14', 'all'
  style TEXT NOT NULL, -- 'easy', 'balanced', 'learning', 'all'

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
CREATE INDEX idx_task_templates_category ON task_templates(category);
CREATE INDEX idx_task_templates_age_group ON task_templates(age_group);
CREATE INDEX idx_task_templates_style ON task_templates(style);
CREATE INDEX idx_task_templates_active ON task_templates(is_active);

CREATE INDEX idx_reward_templates_category ON reward_templates(category);
CREATE INDEX idx_reward_templates_age_group ON reward_templates(age_group);
CREATE INDEX idx_reward_templates_style ON reward_templates(style);
CREATE INDEX idx_reward_templates_active ON reward_templates(is_active);

-- RLS Policies (public read-only)
ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view task templates"
  ON task_templates FOR SELECT
  USING (TRUE);

CREATE POLICY "Anyone can view reward templates"
  ON reward_templates FOR SELECT
  USING (TRUE);

-- Comments
COMMENT ON TABLE task_templates IS 'System-provided task templates for onboarding';
COMMENT ON TABLE reward_templates IS 'System-provided reward templates for onboarding';
COMMENT ON COLUMN task_templates.age_group IS 'Target age group (5-7, 8-11, 12-14, all)';
COMMENT ON COLUMN task_templates.style IS 'Family style (easy, balanced, learning, all)';
COMMENT ON COLUMN reward_templates.age_group IS 'Target age group (5-7, 8-11, 12-14, all)';
COMMENT ON COLUMN reward_templates.style IS 'Family style (easy, balanced, learning, all)';
