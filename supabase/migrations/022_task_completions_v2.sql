-- ============================================================================
-- Migration 022: Task System v2 - task_completions Updates
-- ============================================================================
-- This migration updates task_completions table to support v2 features:
-- - Adds: timer_completed BOOLEAN for timer-based task completion tracking
-- - Adds: checklist_state JSONB for checklist item completion tracking
-- - Ensures: fix_request JSONB column exists (may already exist from previous migrations)
-- - Updates: status enum to include 'fix_requested' if not already present
-- ============================================================================

-- ============================================================================
-- STEP 1: Add new columns for timer and checklist support
-- ============================================================================

-- Timer completion tracking
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS timer_completed BOOLEAN DEFAULT FALSE;

-- Checklist state tracking (array of booleans matching task.checklist)
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS checklist_state JSONB;

-- Fix request details (may already exist, ensure it's there)
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS fix_request JSONB;

-- ============================================================================
-- STEP 2: Update status constraint to include 'fix_requested'
-- ============================================================================

-- Drop old constraint if it exists
ALTER TABLE task_completions DROP CONSTRAINT IF EXISTS valid_status;
ALTER TABLE task_completions DROP CONSTRAINT IF EXISTS task_completions_status_check;

-- Add new constraint with all v2 statuses
ALTER TABLE task_completions ADD CONSTRAINT valid_status_v2
  CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved', 'fix_requested'));

-- ============================================================================
-- STEP 3: Add validation constraints
-- ============================================================================

-- Timer validation: if timer_completed is true, task should be timer-based
-- (This is informational, not enforced as FK constraint)

-- Checklist validation: checklist_state should be a valid JSON array when present
ALTER TABLE task_completions ADD CONSTRAINT checklist_state_is_array
  CHECK (
    checklist_state IS NULL OR
    jsonb_typeof(checklist_state) = 'array'
  );

-- Fix request validation: fix_request should be a valid JSON object when present
ALTER TABLE task_completions ADD CONSTRAINT fix_request_is_object
  CHECK (
    fix_request IS NULL OR
    jsonb_typeof(fix_request) = 'object'
  );

-- ============================================================================
-- STEP 4: Create indexes for query performance
-- ============================================================================

-- Index for filtering fix_requested tasks
CREATE INDEX IF NOT EXISTS idx_task_completions_fix_requested
  ON task_completions(status)
  WHERE status = 'fix_requested';

-- GIN index for fix_request JSONB queries
CREATE INDEX IF NOT EXISTS idx_task_completions_fix_request_gin
  ON task_completions USING gin(fix_request)
  WHERE fix_request IS NOT NULL;

-- Index for timer completions
CREATE INDEX IF NOT EXISTS idx_task_completions_timer
  ON task_completions(timer_completed)
  WHERE timer_completed = TRUE;

-- ============================================================================
-- STEP 5: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN task_completions.timer_completed IS 'v2: TRUE when timer-based task timer has completed successfully';
COMMENT ON COLUMN task_completions.checklist_state IS 'v2: Array of booleans matching task.checklist items completion state (e.g., [true, true] for 2-item checklist)';
COMMENT ON COLUMN task_completions.fix_request IS 'v2: Fix request details {items: string[], message?: string, requestedAt: timestamp, requestedBy: uuid}';

-- ============================================================================
-- STEP 6: Update existing pending completions (optional data migration)
-- ============================================================================

-- Set timer_completed to FALSE for all existing records if NULL
UPDATE task_completions
SET timer_completed = FALSE
WHERE timer_completed IS NULL;

-- Ensure timer_completed is NOT NULL going forward
ALTER TABLE task_completions ALTER COLUMN timer_completed SET NOT NULL;
ALTER TABLE task_completions ALTER COLUMN timer_completed SET DEFAULT FALSE;

-- ============================================================================
-- STEP 7: Update RLS policies if needed
-- ============================================================================

-- Existing RLS policies should work as-is since they're based on family_id and user context
-- No changes needed

-- Verify existing policies still apply:
-- - Children can only create their own task completions
-- - Parents can manage their family's completions
-- - Both can view family completions

-- ============================================================================
-- Migration complete!
-- ============================================================================
-- Verification queries:
-- 1. Check new columns exist:
--    SELECT column_name, data_type, is_nullable
--    FROM information_schema.columns
--    WHERE table_name = 'task_completions'
--    AND column_name IN ('timer_completed', 'checklist_state', 'fix_request');
--
-- 2. Check status constraint includes fix_requested:
--    SELECT conname, pg_get_constraintdef(oid)
--    FROM pg_constraint
--    WHERE conrelid = 'task_completions'::regclass
--    AND conname = 'valid_status_v2';
--
-- 3. Test fix_requested status:
--    SELECT COUNT(*) FROM task_completions WHERE status = 'fix_requested';
--    -- Should not error
-- ============================================================================
