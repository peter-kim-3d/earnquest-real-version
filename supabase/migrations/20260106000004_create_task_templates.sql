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
