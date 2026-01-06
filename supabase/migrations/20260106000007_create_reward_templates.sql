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
