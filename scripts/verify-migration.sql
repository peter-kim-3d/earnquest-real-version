-- EarnQuest Task System v2 - Migration Verification Script
-- Run this in Supabase SQL Editor after migrations complete

-- ============================================================================
-- SECTION 1: Check Schema Changes
-- ============================================================================

\echo '=== 1. Checking Tasks Table Schema ==='

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'tasks'
  AND column_name IN (
    'category', 'category_old',
    'approval_type', 'approval_type_old',
    'metadata', 'timer_minutes', 'checklist',
    'photo_required', 'auto_assign', 'days_of_week',
    'monthly_mode', 'monthly_day'
  )
ORDER BY column_name;

-- Expected: All v2 columns should exist

-- ============================================================================
-- SECTION 2: Check Data Migration
-- ============================================================================

\echo '\n=== 2. Checking Data Migration ==='

-- Count tasks by old vs new category
SELECT
  category_old as old_cat,
  category as new_cat,
  COUNT(*) as count
FROM tasks
WHERE category_old IS NOT NULL
GROUP BY category_old, category
ORDER BY category_old;

-- Expected mappings:
-- hygiene → health
-- chores → household
-- learning → learning
-- kindness → household
-- other → household

-- ============================================================================
-- SECTION 3: Check Templates
-- ============================================================================

\echo '\n=== 3. Checking Task Templates ==='

-- Count total templates (should be 13)
SELECT COUNT(*) as total_templates FROM task_templates;

-- List all templates with v2 fields
SELECT
  template_key,
  name,
  category,
  points,
  approval_type,
  timer_minutes,
  CASE
    WHEN checklist IS NOT NULL THEN array_length(checklist::text[]::text[], 1)
    ELSE 0
  END as checklist_items,
  age_group
FROM task_templates
ORDER BY template_key;

-- Expected templates:
-- homework, reading, make_bed, clear_dishes, backpack, brush_teeth, exercise
-- feed_pet, practice_instrument (conditional)
-- pick_up_toys, get_dressed, laundry, study_session (age-specific)

-- ============================================================================
-- SECTION 4: Check Constraints
-- ============================================================================

\echo '\n=== 4. Checking Constraints ==='

-- Check category constraint
SELECT
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%category%'
  AND constraint_schema = 'public';

-- Expected: valid_category_v2 with (learning, household, health)

-- Check approval_type constraint
SELECT
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%approval%'
  AND constraint_schema = 'public';

-- Expected: valid_approval_type_v2 with (parent, auto, timer, checklist)

-- ============================================================================
-- SECTION 5: Check Task Completions
-- ============================================================================

\echo '\n=== 5. Checking Task Completions Table ==='

SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'task_completions'
  AND column_name IN (
    'timer_completed',
    'checklist_state',
    'fix_request',
    'fix_request_count'
  )
ORDER BY column_name;

-- Expected: All new completion fields should exist

-- ============================================================================
-- SECTION 6: Sample Queries - Test Data Integrity
-- ============================================================================

\echo '\n=== 6. Data Integrity Checks ==='

-- Check for any invalid categories (should return 0)
SELECT COUNT(*) as invalid_categories
FROM tasks
WHERE category NOT IN ('learning', 'household', 'health');

-- Check for any invalid approval types (should return 0)
SELECT COUNT(*) as invalid_approval_types
FROM tasks
WHERE approval_type NOT IN ('parent', 'auto', 'timer', 'checklist');

-- Check metadata structure (should all be valid JSON)
SELECT COUNT(*) as tasks_with_metadata
FROM tasks
WHERE metadata IS NOT NULL
  AND jsonb_typeof(metadata) = 'object';

-- ============================================================================
-- SECTION 7: Sample v2 Data
-- ============================================================================

\echo '\n=== 7. Sample v2 Tasks ==='

-- Show first 5 tasks with v2 fields
SELECT
  name,
  category,
  approval_type,
  points,
  timer_minutes,
  CASE
    WHEN checklist IS NOT NULL THEN jsonb_array_length(checklist)
    ELSE NULL
  END as checklist_items,
  auto_assign,
  is_active
FROM tasks
LIMIT 5;

-- ============================================================================
-- SUMMARY
-- ============================================================================

\echo '\n=== MIGRATION VERIFICATION SUMMARY ==='

SELECT
  'Total Tasks' as metric,
  COUNT(*)::text as value
FROM tasks
UNION ALL
SELECT
  'Tasks with v2 Categories' as metric,
  COUNT(*)::text
FROM tasks
WHERE category IN ('learning', 'household', 'health')
UNION ALL
SELECT
  'Task Templates' as metric,
  COUNT(*)::text
FROM task_templates
UNION ALL
SELECT
  'Timer-based Templates' as metric,
  COUNT(*)::text
FROM task_templates
WHERE approval_type = 'timer'
UNION ALL
SELECT
  'Checklist-based Templates' as metric,
  COUNT(*)::text
FROM task_templates
WHERE approval_type = 'checklist';

\echo '\n✅ If all counts look correct, migration was successful!'
\echo '⚠️  If any issues, check MIGRATION_GUIDE.md for troubleshooting'
