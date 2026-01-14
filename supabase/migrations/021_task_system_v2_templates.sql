-- ============================================================================
-- Migration 021: Task System v2 - Template Refresh
-- ============================================================================
-- This migration updates task_templates to v2 specification:
-- - Adds: metadata JSONB, timer_minutes, checklist, template_key columns
-- - Replaces old templates (easy/balanced/learning) with v2 templates
-- - New templates: 7 base + 2 conditional + 4 age-specific = 13 total
-- - Source: docs/earnquest_v2_specs/earnquest-tasks-en-US.json
-- ============================================================================

-- ============================================================================
-- STEP 1: Update task_templates schema
-- ============================================================================

-- Add new columns
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS timer_minutes INTEGER;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS checklist JSONB;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS template_key TEXT;

-- Drop old constraints
ALTER TABLE task_templates DROP CONSTRAINT IF EXISTS valid_category;
ALTER TABLE task_templates DROP CONSTRAINT IF EXISTS valid_approval_type;
ALTER TABLE task_templates DROP CONSTRAINT IF EXISTS task_templates_category_check;
ALTER TABLE task_templates DROP CONSTRAINT IF EXISTS task_templates_approval_type_check;

-- Add v2 constraints
ALTER TABLE task_templates ADD CONSTRAINT valid_category_v2
  CHECK (category IN ('learning', 'household', 'health'));

ALTER TABLE task_templates ADD CONSTRAINT valid_approval_type_v2
  CHECK (approval_type IN ('parent', 'auto', 'timer', 'checklist'));

-- Make template_key unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_templates_template_key ON task_templates(template_key);

-- ============================================================================
-- STEP 2: Clear old templates
-- ============================================================================

DELETE FROM task_templates;

-- ============================================================================
-- STEP 3: Insert v2 Base Tasks (7 tasks)
-- ============================================================================

-- 1. Homework (learning, parent approval)
INSERT INTO task_templates (
  template_key, name, description, category, points, approval_type,
  timer_minutes, checklist, icon, age_group, style, frequency, metadata
) VALUES (
  'homework',
  'Complete homework',
  'Finish all assigned homework for today',
  'learning',
  50,
  'parent',
  NULL,
  NULL,
  'edit',
  'all',
  'all',
  'daily',
  '{"subcategory":"homework","tags":["school","daily"]}'::jsonb
);

-- 2. Reading (learning, timer approval, 20min)
INSERT INTO task_templates (
  template_key, name, description, category, points, approval_type,
  timer_minutes, checklist, icon, age_group, style, frequency, metadata
) VALUES (
  'reading',
  'Read for 20 minutes',
  'Read a book of your choice',
  'learning',
  30,
  'timer',
  20,
  NULL,
  'menu_book',
  'all',
  'all',
  'daily',
  '{"subcategory":"reading","tags":["literacy","daily"]}'::jsonb
);

-- 3. Make Bed (household, checklist approval)
INSERT INTO task_templates (
  template_key, name, description, category, points, approval_type,
  timer_minutes, checklist, icon, age_group, style, frequency, metadata
) VALUES (
  'make_bed',
  'Make your bed',
  'Make your bed neatly before school',
  'household',
  15,
  'checklist',
  NULL,
  '["Straighten sheets","Arrange pillows","Smooth comforter"]'::jsonb,
  'bed',
  'all',
  'all',
  'daily',
  '{"subcategory":"cleaning","tags":["morning","daily"]}'::jsonb
);

-- 4. Clear Dishes (household, parent approval)
INSERT INTO task_templates (
  template_key, name, description, category, points, approval_type,
  timer_minutes, checklist, icon, age_group, style, frequency, metadata
) VALUES (
  'clear_dishes',
  'Clear dishes after meal',
  'Bring your dishes to the sink and help clean up',
  'household',
  20,
  'parent',
  NULL,
  NULL,
  'restaurant',
  'all',
  'all',
  'daily',
  '{"subcategory":"chores","tags":["meals","daily"]}'::jsonb
);

-- 5. Put Away Backpack (household, auto approval - WHITELIST)
INSERT INTO task_templates (
  template_key, name, description, category, points, approval_type,
  timer_minutes, checklist, icon, age_group, style, frequency, metadata
) VALUES (
  'backpack',
  'Put away backpack & shoes',
  'Put your backpack and shoes in their place when you get home',
  'household',
  15,
  'auto',
  NULL,
  NULL,
  'backpack',
  'all',
  'all',
  'daily',
  '{"subcategory":"self_care","tags":["afterschool","daily"]}'::jsonb
);

-- 6. Brush Teeth (health, checklist approval, AM/PM)
INSERT INTO task_templates (
  template_key, name, description, category, points, approval_type,
  timer_minutes, checklist, icon, age_group, style, frequency, metadata
) VALUES (
  'brush_teeth',
  'Brush teeth',
  'Brush your teeth in the morning and before bed',
  'health',
  10,
  'checklist',
  NULL,
  '["Morning brushing","Evening brushing"]'::jsonb,
  'dentistry',
  'all',
  'all',
  'daily',
  '{"subcategory":"hygiene","tags":["daily","routine"]}'::jsonb
);

-- 7. Exercise (health, timer approval, 30min)
INSERT INTO task_templates (
  template_key, name, description, category, points, approval_type,
  timer_minutes, checklist, icon, age_group, style, frequency, metadata
) VALUES (
  'exercise',
  'Exercise for 30 minutes',
  'Do any physical activity - sports, biking, playing outside',
  'health',
  40,
  'timer',
  30,
  NULL,
  'directions_run',
  'all',
  'all',
  'daily',
  '{"subcategory":"exercise","tags":["fitness","daily"]}'::jsonb
);

-- ============================================================================
-- STEP 4: Insert v2 Conditional Tasks (2 tasks)
-- ============================================================================

-- 8. Feed Pet (conditional on hasPet question)
INSERT INTO task_templates (
  template_key, name, description, category, points, approval_type,
  timer_minutes, checklist, icon, age_group, style, frequency, metadata
) VALUES (
  'feed_pet',
  'Feed your pet',
  'Give food and fresh water to your pet',
  'household',
  20,
  'parent',
  NULL,
  NULL,
  'pets',
  'all',
  'all',
  'daily',
  '{"subcategory":"pet_care","tags":["daily","responsibility"]}'::jsonb
);

-- 9. Practice Instrument (conditional on hasInstrument question)
INSERT INTO task_templates (
  template_key, name, description, category, points, approval_type,
  timer_minutes, checklist, icon, age_group, style, frequency, metadata
) VALUES (
  'practice_instrument',
  'Practice instrument for 20 minutes',
  'Practice your musical instrument',
  'learning',
  30,
  'timer',
  20,
  NULL,
  'music_note',
  'all',
  'all',
  'daily',
  '{"subcategory":"practice","tags":["music","skill"]}'::jsonb
);

-- ============================================================================
-- STEP 5: Insert v2 Age-Specific Tasks
-- ============================================================================

-- 10. Pick Up Toys (5-7 age group)
INSERT INTO task_templates (
  template_key, name, description, category, points, approval_type,
  timer_minutes, checklist, icon, age_group, style, frequency, metadata
) VALUES (
  'pick_up_toys',
  'Pick up toys',
  'Put all your toys back where they belong',
  'household',
  15,
  'parent',
  NULL,
  NULL,
  'toys',
  '5-7',
  'all',
  'daily',
  '{"subcategory":"cleaning","tags":["daily"]}'::jsonb
);

-- 11. Get Dressed (5-7 age group, auto approval - WHITELIST)
INSERT INTO task_templates (
  template_key, name, description, category, points, approval_type,
  timer_minutes, checklist, icon, age_group, style, frequency, metadata
) VALUES (
  'get_dressed',
  'Get dressed by yourself',
  'Put on your clothes without help',
  'health',
  10,
  'auto',
  NULL,
  NULL,
  'checkroom',
  '5-7',
  'all',
  'daily',
  '{"subcategory":"self_care","tags":["morning","daily"]}'::jsonb
);

-- 12. Help with Laundry (12-14 age group)
INSERT INTO task_templates (
  template_key, name, description, category, points, approval_type,
  timer_minutes, checklist, icon, age_group, style, frequency, metadata
) VALUES (
  'laundry',
  'Help with laundry',
  'Fold laundry or help load/unload the washer',
  'household',
  25,
  'parent',
  NULL,
  NULL,
  'checkroom',
  '12-14',
  'all',
  'weekly',
  '{"subcategory":"chores","tags":["weekly"]}'::jsonb
);

-- 13. Study Session (12-14 age group, 45min timer)
INSERT INTO task_templates (
  template_key, name, description, category, points, approval_type,
  timer_minutes, checklist, icon, age_group, style, frequency, metadata
) VALUES (
  'study_session',
  'Study session (45 min)',
  'Focused study time for tests or projects',
  'learning',
  60,
  'timer',
  45,
  NULL,
  'school',
  '12-14',
  'all',
  'daily',
  '{"subcategory":"self_study","tags":["academic"]}'::jsonb
);

-- ============================================================================
-- STEP 6: Add comments
-- ============================================================================

COMMENT ON TABLE task_templates IS 'v2 task templates from earnquest-tasks-en-US.json - 7 base + 2 conditional + 4 age-specific';
COMMENT ON COLUMN task_templates.template_key IS 'Unique template identifier for preset mapping (e.g., homework, reading, backpack)';
COMMENT ON COLUMN task_templates.metadata IS 'JSONB metadata matching earnquest-tasks-en-US.json structure';
COMMENT ON COLUMN task_templates.timer_minutes IS 'Timer duration for timer-based tasks';
COMMENT ON COLUMN task_templates.checklist IS 'Checklist items array for checklist-based tasks';

-- ============================================================================
-- Migration complete!
-- ============================================================================
-- Verification queries:
-- 1. Count templates: SELECT COUNT(*) FROM task_templates; -- Should be 13
-- 2. Check auto-approval whitelist: SELECT template_key, name FROM task_templates WHERE approval_type = 'auto';
--    -- Should only show: backpack, get_dressed
-- 3. Check timer tasks: SELECT template_key, name, timer_minutes FROM task_templates WHERE approval_type = 'timer';
-- 4. Check checklist tasks: SELECT template_key, name, checklist FROM task_templates WHERE approval_type = 'checklist';
-- ============================================================================
