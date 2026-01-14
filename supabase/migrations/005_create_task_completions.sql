-- Create task_completions table
CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'auto_approved', 'fix_requested', 'rejected'

  -- Submission data
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  proof_image_url TEXT,
  note TEXT, -- Child's note with submission

  -- Approval data
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Parent who approved
  approved_at TIMESTAMPTZ,
  auto_approve_at TIMESTAMPTZ, -- When auto-approval should trigger

  -- Fix request data
  fix_request JSONB, -- { "items": ["More soap", "Dry plates"], "message": "Please dry the plates too" }
  fix_request_count INTEGER DEFAULT 0,

  -- Points
  points_awarded INTEGER,

  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'auto_approved', 'fix_requested', 'rejected')),
  CONSTRAINT fix_request_count_positive CHECK (fix_request_count >= 0)
);

-- Indexes
CREATE INDEX idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX idx_task_completions_child_id ON task_completions(child_id);
CREATE INDEX idx_task_completions_family_id ON task_completions(family_id);
CREATE INDEX idx_task_completions_status ON task_completions(status);
CREATE INDEX idx_task_completions_requested_at ON task_completions(requested_at DESC);
CREATE INDEX idx_task_completions_auto_approve_at ON task_completions(auto_approve_at)
  WHERE status = 'pending' AND auto_approve_at IS NOT NULL;

-- RLS Policies
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
  WITH CHECK (
    child_id = auth.uid()
  );

CREATE POLICY "Parents can manage their family's task completions"
  ON task_completions FOR ALL
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_task_completions_updated_at
  BEFORE UPDATE ON task_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE task_completions IS 'Records of tasks completed by children, pending or approved';
COMMENT ON COLUMN task_completions.status IS 'pending = waiting for approval, approved/auto_approved = done, fix_requested = needs corrections';
COMMENT ON COLUMN task_completions.auto_approve_at IS 'Timestamp when task should be auto-approved if still pending';
