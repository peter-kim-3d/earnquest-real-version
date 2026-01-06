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
