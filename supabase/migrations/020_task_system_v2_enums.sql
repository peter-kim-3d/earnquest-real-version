-- ============================================================================
-- Migration 020: Task System v2 - Category & Approval Type Migration
-- ============================================================================
-- This migration upgrades the task system from v1 to v2:
-- - Categories: hygiene, chores, learning, kindness, other → learning, household, health
-- - Approval Types: manual, auto → parent, auto, timer, checklist
-- - Adds: metadata JSONB, timer_minutes INT, checklist JSONB
-- - Auto-approval restricted to whitelist only
--
-- Migration Strategy: Add new columns, migrate data, swap columns, apply constraints
-- Rollback: See 020_rollback_task_system_v2_enums.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: Add new columns (nullable initially for safe migration)
-- ============================================================================

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category_v2 TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS approval_type_v2 TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS timer_minutes INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checklist JSONB;

-- ============================================================================
-- STEP 2: Migrate existing category data
-- ============================================================================

UPDATE tasks SET category_v2 = CASE
  WHEN category = 'hygiene' THEN 'health'
  WHEN category = 'chores' THEN 'household'
  WHEN category = 'learning' THEN 'learning'
  WHEN category = 'kindness' THEN 'household'  -- Kindness is now separate system
  WHEN category = 'other' THEN 'household'
  WHEN category = 'exercise' THEN 'health'     -- If exists from TaskFormDialog
  WHEN category = 'creativity' THEN 'household' -- If exists from TaskFormDialog
  ELSE 'household'  -- Default fallback
END;

-- ============================================================================
-- STEP 3: Migrate approval_type (restrict auto to whitelist)
-- ============================================================================
-- Auto-approval whitelist: backpack, get_dressed, set_alarm
-- All other tasks default to 'parent' approval

UPDATE tasks SET approval_type_v2 = CASE
  -- Whitelist: only these tasks keep auto approval
  WHEN (
    name ILIKE '%backpack%' OR
    name ILIKE '%put away%backpack%' OR
    name ILIKE '%put away%shoes%' OR
    name ILIKE '%get dressed%' OR
    name ILIKE '%dress%yourself%' OR
    name ILIKE '%set alarm%' OR
    name ILIKE '%alarm%set%'
  ) THEN 'auto'
  -- Everything else becomes parent approval
  ELSE 'parent'
END;

-- ============================================================================
-- STEP 4: Drop old constraints
-- ============================================================================

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS valid_category;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS valid_approval_type;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_category_check;
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_approval_type_check;

-- ============================================================================
-- STEP 5: Swap columns (preserve old data for rollback safety)
-- ============================================================================

-- Rename old columns with _old suffix
ALTER TABLE tasks RENAME COLUMN category TO category_old;
ALTER TABLE tasks RENAME COLUMN approval_type TO approval_type_old;

-- Rename new columns to official names
ALTER TABLE tasks RENAME COLUMN category_v2 TO category;
ALTER TABLE tasks RENAME COLUMN approval_type_v2 TO approval_type;

-- ============================================================================
-- STEP 6: Apply new constraints
-- ============================================================================

-- Category constraint: learning, household, health
ALTER TABLE tasks ADD CONSTRAINT valid_category_v2
  CHECK (category IN ('learning', 'household', 'health'));

-- Approval type constraint: parent, auto, timer, checklist
ALTER TABLE tasks ADD CONSTRAINT valid_approval_type_v2
  CHECK (approval_type IN ('parent', 'auto', 'timer', 'checklist'));

-- Timer validation: if approval_type is 'timer', timer_minutes must be set
ALTER TABLE tasks ADD CONSTRAINT timer_minutes_required_for_timer
  CHECK (
    (approval_type != 'timer') OR
    (approval_type = 'timer' AND timer_minutes IS NOT NULL AND timer_minutes > 0)
  );

-- Checklist validation: if approval_type is 'checklist', checklist must be set
ALTER TABLE tasks ADD CONSTRAINT checklist_required_for_checklist
  CHECK (
    (approval_type != 'checklist') OR
    (approval_type = 'checklist' AND checklist IS NOT NULL AND jsonb_array_length(checklist) > 0)
  );

-- ============================================================================
-- STEP 7: Make new columns NOT NULL
-- ============================================================================

ALTER TABLE tasks ALTER COLUMN category SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN approval_type SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN metadata SET NOT NULL;
ALTER TABLE tasks ALTER COLUMN metadata SET DEFAULT '{}';

-- ============================================================================
-- STEP 8: Create indexes for performance
-- ============================================================================

-- GIN index on metadata for flexible querying
CREATE INDEX IF NOT EXISTS idx_tasks_metadata_gin ON tasks USING gin(metadata);

-- Update existing indexes if needed (category changed)
DROP INDEX IF EXISTS idx_tasks_category;
CREATE INDEX idx_tasks_category ON tasks(category) WHERE is_active = true;

-- Add index for approval_type filtering
CREATE INDEX IF NOT EXISTS idx_tasks_approval_type ON tasks(approval_type) WHERE is_active = true;

-- ============================================================================
-- STEP 9: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN tasks.category IS 'v2: Task category - learning, household, health (migrated from v1: hygiene→health, chores→household)';
COMMENT ON COLUMN tasks.approval_type IS 'v2: Approval type - parent (default), auto (whitelist only), timer, checklist';
COMMENT ON COLUMN tasks.metadata IS 'v2: Extensible JSONB metadata {subcategory, tags, source: {type, templateKey}, learning: {subject, difficulty}}';
COMMENT ON COLUMN tasks.timer_minutes IS 'Timer duration in minutes when approval_type=timer (1-180)';
COMMENT ON COLUMN tasks.checklist IS 'Array of checklist items when approval_type=checklist (e.g., ["Morning brushing", "Evening brushing"])';
COMMENT ON COLUMN tasks.category_old IS 'v1 category - kept for rollback safety, can be dropped after 2 weeks';
COMMENT ON COLUMN tasks.approval_type_old IS 'v1 approval_type - kept for rollback safety, can be dropped after 2 weeks';

-- ============================================================================
-- STEP 10: Update RLS policies if needed
-- ============================================================================

-- RLS policies should still work as they reference family_id and user context
-- No changes needed, but verify after migration

-- ============================================================================
-- Migration complete!
-- ============================================================================
-- Next steps:
-- 1. Verify migration on staging: SELECT category, category_old, approval_type, approval_type_old FROM tasks;
-- 2. Check constraint violations: SELECT * FROM tasks WHERE category NOT IN ('learning', 'household', 'health');
-- 3. Test Supabase types regeneration: npx supabase gen types typescript
-- 4. After 2 weeks of stable production, can drop old columns:
--    ALTER TABLE tasks DROP COLUMN category_old;
--    ALTER TABLE tasks DROP COLUMN approval_type_old;
-- ============================================================================
