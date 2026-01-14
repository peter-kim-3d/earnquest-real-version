-- ============================================================================
-- Rollback Migration: Task System v2 → v1
-- ============================================================================
-- This migration rolls back the v2 changes from migration 020
-- ONLY run this if you need to rollback to v1 schema
--
-- WARNING: This will restore old category/approval_type values
-- New v2 data (timer_minutes, checklist, metadata) will be lost
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify rollback columns exist
-- ============================================================================

-- Check that category_old and approval_type_old columns still exist
-- If they were already dropped, this rollback will fail (which is expected)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'category_old'
  ) THEN
    RAISE EXCEPTION 'Rollback failed: category_old column does not exist. Rollback window has passed.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'approval_type_old'
  ) THEN
    RAISE EXCEPTION 'Rollback failed: approval_type_old column does not exist. Rollback window has passed.';
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Drop v2 constraints
-- ============================================================================

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS valid_category_v2;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS valid_approval_type_v2;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS timer_minutes_required_for_timer;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS checklist_required_for_checklist;

-- ============================================================================
-- STEP 3: Swap columns back (v2 → old, old → current)
-- ============================================================================

-- Rename current v2 columns
ALTER TABLE tasks RENAME COLUMN category TO category_v2;
ALTER TABLE tasks RENAME COLUMN approval_type TO approval_type_v2;

-- Restore old columns
ALTER TABLE tasks RENAME COLUMN category_old TO category;
ALTER TABLE tasks RENAME COLUMN approval_type_old TO approval_type;

-- ============================================================================
-- STEP 4: Restore v1 constraints
-- ============================================================================

ALTER TABLE tasks ADD CONSTRAINT valid_category
  CHECK (category IN ('hygiene', 'chores', 'learning', 'kindness', 'other', 'exercise', 'creativity'));

ALTER TABLE tasks ADD CONSTRAINT valid_approval_type
  CHECK (approval_type IN ('manual', 'auto'));

-- ============================================================================
-- STEP 5: Drop v2-specific columns
-- ============================================================================

-- Drop v2 columns (data will be lost!)
ALTER TABLE tasks DROP COLUMN IF EXISTS metadata;
ALTER TABLE tasks DROP COLUMN IF EXISTS timer_minutes;
ALTER TABLE tasks DROP COLUMN IF EXISTS checklist;

-- Drop v2 renamed columns
ALTER TABLE tasks DROP COLUMN IF EXISTS category_v2;
ALTER TABLE tasks DROP COLUMN IF EXISTS approval_type_v2;

-- ============================================================================
-- STEP 6: Drop v2 indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_tasks_metadata_gin;
DROP INDEX IF EXISTS idx_tasks_approval_type;

-- Restore old index
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category) WHERE is_active = true;

-- ============================================================================
-- STEP 7: Restore old comments
-- ============================================================================

COMMENT ON COLUMN tasks.category IS 'v1: Task category - hygiene, chores, learning, kindness, other';
COMMENT ON COLUMN tasks.approval_type IS 'v1: Approval type - manual (parent check) or auto (24h auto-approve)';

-- ============================================================================
-- Rollback Complete
-- ============================================================================
-- WARNING: You are now back on v1 schema
-- All v2 features (timer, checklist, metadata) are removed
-- task_templates are still v2 - you may need to manually restore old templates
-- task_completions still have v2 columns (timer_completed, checklist_state, fix_request)
--
-- If you want to fully rollback, you also need to:
-- 1. Rollback task_templates (restore old templates manually)
-- 2. Rollback task_completions v2 columns (drop timer_completed, checklist_state)
-- ============================================================================
