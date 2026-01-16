-- Migration: Onboarding v2.1 - Add time_context and migrate household → life
--
-- Changes:
-- 1. Update category constraints (household → life)
-- 2. Add time_context column to task_templates and tasks
-- 3. Update existing task templates with time_context values
-- 4. Add new v2.1 task templates

-- ============================================================================
-- Step 1: Drop existing category constraints
-- ============================================================================
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS valid_category_v2;
ALTER TABLE task_templates DROP CONSTRAINT IF EXISTS valid_category_v2;
ALTER TABLE task_templates DROP CONSTRAINT IF EXISTS task_templates_category_check;

-- ============================================================================
-- Step 2: Migrate household → life
-- ============================================================================
UPDATE tasks SET category = 'life' WHERE category = 'household';
UPDATE task_templates SET category = 'life' WHERE category = 'household';

-- ============================================================================
-- Step 3: Add new category constraints (with 'life' instead of 'household')
-- ============================================================================
ALTER TABLE tasks ADD CONSTRAINT valid_category_v2
  CHECK (category IN ('learning', 'life', 'health'));

ALTER TABLE task_templates ADD CONSTRAINT valid_category_v2
  CHECK (category IN ('learning', 'life', 'health'));

-- ============================================================================
-- Step 4: Add time_context column to task_templates and tasks
-- ============================================================================
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS time_context TEXT
  CHECK (time_context IS NULL OR time_context IN ('morning', 'after_school', 'evening', 'anytime'));

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_context TEXT
  CHECK (time_context IS NULL OR time_context IN ('morning', 'after_school', 'evening', 'anytime'));

-- ============================================================================
-- Step 5: Update existing task templates with time_context
-- ============================================================================

-- Morning tasks
UPDATE task_templates SET time_context = 'morning'
WHERE template_key IN ('wake_on_time', 'make_bed', 'brush_teeth', 'get_dressed', 'set_alarm');

-- After school tasks
UPDATE task_templates SET time_context = 'after_school'
WHERE template_key IN ('backpack', 'clear_dishes', 'feed_pet', 'water_plants');

-- Evening tasks
UPDATE task_templates SET time_context = 'evening'
WHERE template_key IN ('clean_room', 'laundry', 'pack_bag', 'pick_up_toys');

-- Anytime/Learning tasks
UPDATE task_templates SET time_context = 'anytime'
WHERE template_key IN ('homework', 'reading', 'practice_instrument', 'exercise', 'study_session', 'writing', 'art');

-- Default remaining templates to 'anytime' if not set
UPDATE task_templates SET time_context = 'anytime' WHERE time_context IS NULL;

-- ============================================================================
-- Step 6: Add new v2.1 task templates
-- ============================================================================

INSERT INTO task_templates (template_key, name, description, category, time_context, points, icon, frequency, approval_type, style, age_group, metadata)
SELECT 'shoes_tidy', 'Tidy Shoes', 'Put shoes in the right place when coming home', 'life', 'after_school', 5, '👟', 'daily', 'auto', 'all', 'all', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM task_templates WHERE template_key = 'shoes_tidy');

INSERT INTO task_templates (template_key, name, description, category, time_context, points, icon, frequency, approval_type, style, age_group, metadata)
SELECT 'lunchbox_sink', 'Lunchbox to Sink', 'Put lunchbox in the sink after school', 'life', 'after_school', 5, '🍱', 'daily', 'auto', 'all', 'all', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM task_templates WHERE template_key = 'lunchbox_sink');

INSERT INTO task_templates (template_key, name, description, category, time_context, points, icon, frequency, approval_type, style, age_group, metadata)
SELECT 'check_planner', 'Check Planner', 'Review homework and upcoming tasks', 'learning', 'after_school', 10, '📋', 'daily', 'parent', 'all', 'all', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM task_templates WHERE template_key = 'check_planner');

INSERT INTO task_templates (template_key, name, description, category, time_context, points, icon, frequency, approval_type, style, age_group, metadata)
SELECT 'wash_hands', 'Wash Hands', 'Wash hands when coming home', 'health', 'after_school', 5, '🧼', 'daily', 'auto', 'all', 'all', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM task_templates WHERE template_key = 'wash_hands');

INSERT INTO task_templates (template_key, name, description, category, time_context, points, icon, frequency, approval_type, style, age_group, metadata)
SELECT 'prep_tomorrow', 'Prep for Tomorrow', 'Pack backpack and prepare clothes', 'life', 'evening', 15, '📦', 'daily', 'checklist', 'all', 'all', '{"checklist": ["Pack backpack", "Prepare clothes", "Check schedule"]}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM task_templates WHERE template_key = 'prep_tomorrow');

INSERT INTO task_templates (template_key, name, description, category, time_context, points, icon, frequency, approval_type, style, age_group, metadata)
SELECT 'brush_morning', 'Brush Teeth (Morning)', 'Brush teeth for 2 minutes', 'health', 'morning', 10, '🪥', 'daily', 'timer', 'all', 'all', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM task_templates WHERE template_key = 'brush_morning');

INSERT INTO task_templates (template_key, name, description, category, time_context, points, icon, frequency, approval_type, style, age_group, metadata)
SELECT 'brush_evening', 'Brush Teeth (Evening)', 'Brush teeth before bed', 'health', 'evening', 10, '🪥', 'daily', 'timer', 'all', 'all', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM task_templates WHERE template_key = 'brush_evening');

INSERT INTO task_templates (template_key, name, description, category, time_context, points, icon, frequency, approval_type, style, age_group, metadata)
SELECT 'shower', 'Take Shower', 'Take a shower and get clean', 'health', 'evening', 15, '🚿', 'daily', 'parent', 'all', 'all', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM task_templates WHERE template_key = 'shower');

INSERT INTO task_templates (template_key, name, description, category, time_context, points, icon, frequency, approval_type, style, age_group, metadata)
SELECT 'wake_on_time', 'Wake Up On Time', 'Get out of bed at the agreed time', 'life', 'morning', 10, '⏰', 'daily', 'auto', 'all', 'all', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM task_templates WHERE template_key = 'wake_on_time');

INSERT INTO task_templates (template_key, name, description, category, time_context, points, icon, frequency, approval_type, style, age_group, metadata)
SELECT 'clean_desk', 'Clean Desk', 'Tidy up study area', 'life', 'anytime', 15, '🗄️', 'daily', 'parent', 'all', 'all', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM task_templates WHERE template_key = 'clean_desk');

INSERT INTO task_templates (template_key, name, description, category, time_context, points, icon, frequency, approval_type, style, age_group, metadata)
SELECT 'outdoor', 'Outdoor Play', 'Play outside for 30 minutes', 'health', 'anytime', 20, '🌳', 'daily', 'timer', 'all', 'all', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM task_templates WHERE template_key = 'outdoor');

INSERT INTO task_templates (template_key, name, description, category, time_context, points, icon, frequency, approval_type, style, age_group, metadata)
SELECT 'instrument', 'Practice Instrument', 'Practice musical instrument', 'learning', 'anytime', 30, '🎵', 'daily', 'timer', 'all', 'all', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM task_templates WHERE template_key = 'instrument');

INSERT INTO task_templates (template_key, name, description, category, time_context, points, icon, frequency, approval_type, style, age_group, metadata)
SELECT 'art', 'Art/Craft', 'Creative art or craft activity', 'learning', 'anytime', 20, '🎨', 'daily', 'parent', 'all', 'all', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM task_templates WHERE template_key = 'art');

INSERT INTO task_templates (template_key, name, description, category, time_context, points, icon, frequency, approval_type, style, age_group, metadata)
SELECT 'writing', 'Writing Practice', 'Practice writing or journaling', 'learning', 'anytime', 25, '✏️', 'daily', 'parent', 'all', 'all', '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM task_templates WHERE template_key = 'writing');

-- ============================================================================
-- Step 7: Set timer_minutes for timer-based templates
-- ============================================================================
UPDATE task_templates SET timer_minutes = 2 WHERE template_key IN ('brush_morning', 'brush_evening') AND timer_minutes IS NULL;
UPDATE task_templates SET timer_minutes = 20 WHERE template_key IN ('reading', 'exercise') AND timer_minutes IS NULL;
UPDATE task_templates SET timer_minutes = 30 WHERE template_key = 'outdoor' AND timer_minutes IS NULL;
UPDATE task_templates SET timer_minutes = 15 WHERE template_key = 'instrument' AND timer_minutes IS NULL;
