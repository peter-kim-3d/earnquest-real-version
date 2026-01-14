-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL, -- NULL means task is for all children
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'hygiene', 'chores', 'learning', 'kindness', etc.
  points INTEGER NOT NULL DEFAULT 50,
  icon TEXT, -- Material Symbol icon name
  frequency TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'one_time'
  days_of_week INTEGER[], -- Array of day numbers (0=Sunday, 6=Saturday), NULL means all days
  approval_type TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'auto'
  auto_approve_hours INTEGER DEFAULT 24, -- Hours until auto-approval
  requires_photo BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}', -- { "reminder_time": "08:00", "checklist": [...], etc. }
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
CREATE INDEX idx_tasks_family_id ON tasks(family_id);
CREATE INDEX idx_tasks_child_id ON tasks(child_id);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_frequency ON tasks(frequency);
CREATE INDEX idx_tasks_active ON tasks(is_active) WHERE deleted_at IS NULL;

-- RLS Policies
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
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE tasks IS 'Tasks that children can complete to earn points';
COMMENT ON COLUMN tasks.approval_type IS 'manual = requires parent approval, auto = auto-approves after N hours';
COMMENT ON COLUMN tasks.days_of_week IS 'Array of days when task is available (0=Sunday, 6=Saturday). NULL means all days';
