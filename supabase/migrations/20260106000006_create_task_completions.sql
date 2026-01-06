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
