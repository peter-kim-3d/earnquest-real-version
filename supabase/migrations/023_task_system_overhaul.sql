-- Migration 023: Task System Query-Based Overhaul
-- Transition to a strict Query-Based model using v_child_today_tasks view
-- as the single source of truth for "today's active tasks".

-- 1. Create child_task_overrides table
-- Allows disabling specific global tasks for individual children
CREATE TABLE IF NOT EXISTS child_task_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  
  is_enabled BOOLEAN DEFAULT true, -- If false, task is hidden for this child
  points_override INTEGER,         -- Future proofing: child-specific points
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(task_id, child_id)
);

-- Indexes for overrides
CREATE INDEX IF NOT EXISTS idx_child_task_overrides_task ON child_task_overrides(task_id);
CREATE INDEX IF NOT EXISTS idx_child_task_overrides_child ON child_task_overrides(child_id);

-- RLS for overrides
ALTER TABLE child_task_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view/manage their family's overrides"
  ON child_task_overrides FOR ALL
  USING (
    child_id IN (
      SELECT id FROM children WHERE family_id IN (
        SELECT family_id FROM users WHERE id = auth.uid()
        UNION
        SELECT family_id FROM children WHERE id = auth.uid()
      )
    )
  );

-- 2. Redefine v_child_today_tasks view
-- This view encapsulates ALL logic for "what tasks should this child see right now?"
DROP VIEW IF EXISTS v_child_today_tasks;

CREATE OR REPLACE VIEW v_child_today_tasks AS
SELECT 
  t.id,
  t.family_id,
  t.child_id AS assigned_child_id, -- Original assigned child (NULL = all)
  t.name,
  t.description,
  t.category,
  t.points,
  t.icon,
  t.frequency,
  t.approval_type,
  t.timer_minutes,
  t.checklist,
  t.metadata,
  t.days_of_week,
  t.monthly_mode,
  t.monthly_day,
  
  -- Resolved Child Context
  c.id as child_id, -- The child seeing this task
  
  -- Effective Overrides
  COALESCE(o.is_enabled, true) as is_enabled_for_child,
  COALESCE(o.points_override, t.points) as effective_points,
  
  -- Completion Status for TODAY
  EXISTS (
    SELECT 1 FROM task_completions tc 
    WHERE tc.task_id = t.id 
    AND tc.child_id = c.id
    AND DATE(tc.requested_at) = CURRENT_DATE
    AND tc.status IN ('pending', 'approved', 'auto_approved')
  ) as completed_today

FROM tasks t
CROSS JOIN children c
LEFT JOIN child_task_overrides o 
  ON o.task_id = t.id AND o.child_id = c.id

WHERE 
  -- 1. Base Active Check
  t.is_active = true 
  AND t.deleted_at IS NULL
  
  -- 2. Family Match
  AND c.family_id = t.family_id
  
  -- 3. Assignment Match (Global or Specific Child)
  AND (t.child_id IS NULL OR t.child_id = c.id)
  
  -- 4. Override Check (Not disabled for this child)
  AND COALESCE(o.is_enabled, true) = true
  
  -- 5. Schedule / Frequency Logic
  AND (
    -- One-time tasks: Always show if active (managed by API setting is_active=false upon completion)
    t.frequency = 'one_time'
    
    OR
    
    -- Daily: Always show
    t.frequency = 'daily'
    
    OR
    
    -- Weekly: Check day of week (0-6)
    (
      t.frequency = 'weekly' 
      AND (
        t.days_of_week IS NULL -- Fallback if empty
        OR 
        EXTRACT(DOW FROM CURRENT_DATE)::INTEGER = ANY(t.days_of_week)
      )
    )
    
    OR
    
    -- Monthly: Check rules
    (
      t.frequency = 'monthly'
      AND (
        (t.monthly_mode = 'any_day') -- Show every day until completed? (Current logic shows always)
        OR (t.monthly_mode = 'specific_day' AND EXTRACT(DAY FROM CURRENT_DATE)::INTEGER = t.monthly_day)
        OR (t.monthly_mode = 'first_day' AND EXTRACT(DAY FROM CURRENT_DATE)::INTEGER = 1)
        OR (t.monthly_mode = 'last_day' AND EXTRACT(DAY FROM CURRENT_DATE)::INTEGER = 
            EXTRACT(DAY FROM (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day'))::INTEGER)
      )
    )
  );

-- Comments
COMMENT ON VIEW v_child_today_tasks IS 'Authoritative source for child dashboard tasks. Handles schedule filtering and overrides.';
