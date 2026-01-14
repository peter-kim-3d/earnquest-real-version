-- ============================================================================
-- Migration 024: Comprehensive Task System v2 Fix (FINAL + photo_required)
-- ============================================================================
-- This script fixes schema, migrates data, and adds missing photo_required.
-- ============================================================================

-- 1. AGGRESSIVE CONSTRAINT REMOVAL
DO $$
BEGIN
    -- tasks
    BEGIN ALTER TABLE tasks DROP CONSTRAINT valid_category; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE tasks DROP CONSTRAINT "valid_category"; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE tasks DROP CONSTRAINT tasks_category_check; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE tasks DROP CONSTRAINT valid_approval_type; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE tasks DROP CONSTRAINT valid_category_v2; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE tasks DROP CONSTRAINT valid_approval_type_v2; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE tasks DROP CONSTRAINT timer_minutes_required_for_timer; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE tasks DROP CONSTRAINT checklist_required_for_checklist; EXCEPTION WHEN OTHERS THEN NULL; END;

    -- task_templates
    BEGIN ALTER TABLE task_templates DROP CONSTRAINT valid_category; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE task_templates DROP CONSTRAINT task_templates_category_check; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE task_templates DROP CONSTRAINT valid_approval_type; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE task_templates DROP CONSTRAINT valid_category_v2; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE task_templates DROP CONSTRAINT valid_approval_type_v2; EXCEPTION WHEN OTHERS THEN NULL; END;
    
    -- task_completions
    BEGIN ALTER TABLE task_completions DROP CONSTRAINT valid_status; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TABLE task_completions DROP CONSTRAINT valid_status_v2; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 2. CLEAR TEMPLATE DATA
DELETE FROM task_templates;

-- 3. MIGRATE TASK DATA
UPDATE tasks SET category = 'health' WHERE category IN ('hygiene', 'health');
UPDATE tasks SET category = 'household' WHERE category IN ('chores', 'household', 'kindness', 'other', 'creativity');
UPDATE tasks SET category = 'learning' WHERE category IN ('learning');
UPDATE tasks SET category = 'household' WHERE category NOT IN ('health', 'household', 'learning');

UPDATE tasks SET approval_type = 'parent' WHERE approval_type IN ('manual', 'parent');
UPDATE tasks SET approval_type = 'auto' WHERE approval_type IN ('auto');
UPDATE tasks SET approval_type = 'timer' WHERE approval_type IN ('timer');
UPDATE tasks SET approval_type = 'checklist' WHERE approval_type IN ('checklist');
UPDATE tasks SET approval_type = 'parent' WHERE approval_type NOT IN ('parent', 'auto', 'timer', 'checklist');

-- 4. MIGRATE COMPLETION STATUS
UPDATE task_completions SET status = 'pending' WHERE status NOT IN ('pending', 'approved', 'auto_approved', 'fix_requested', 'rejected');

-- 5. ADD COLUMNS (Including photo_required)
-- task_templates
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS timer_minutes INTEGER;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS checklist JSONB;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS template_key TEXT;
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS photo_required BOOLEAN DEFAULT FALSE;

-- tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS timer_minutes INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS checklist JSONB;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS photo_required BOOLEAN DEFAULT FALSE;

-- task_completions
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS timer_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS checklist_state JSONB;
ALTER TABLE task_completions ADD COLUMN IF NOT EXISTS fix_request JSONB;

-- 6. APPLY NEW CONSTRAINTS
ALTER TABLE task_templates ADD CONSTRAINT valid_category_v2 CHECK (category IN ('learning', 'household', 'health'));
ALTER TABLE task_templates ADD CONSTRAINT valid_approval_type_v2 CHECK (approval_type IN ('parent', 'auto', 'timer', 'checklist'));

ALTER TABLE tasks ADD CONSTRAINT valid_category_v2 CHECK (category IN ('learning', 'household', 'health'));
ALTER TABLE tasks ADD CONSTRAINT valid_approval_type_v2 CHECK (approval_type IN ('parent', 'auto', 'timer', 'checklist'));

ALTER TABLE task_completions ADD CONSTRAINT valid_status_v2 CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved', 'fix_requested'));

-- 7. INDEXES
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_templates_template_key ON task_templates(template_key);

-- 8. INSERT v2 TEMPLATES
INSERT INTO task_templates (template_key, name, description, category, points, approval_type, timer_minutes, checklist, icon, age_group, style, frequency, metadata, photo_required) VALUES
('homework', 'Complete homework', 'Finish all assigned homework for today', 'learning', 50, 'parent', NULL, NULL, 'pencil', 'all', 'all', 'daily', '{"subcategory":"homework","tags":["school","daily"]}', FALSE),
('reading', 'Reading', 'Read a book of your choice', 'learning', 30, 'timer', 20, NULL, 'book-open', 'all', 'all', 'daily', '{"subcategory":"reading","tags":["literacy","daily"]}', FALSE),
('make_bed', 'Make your bed', 'Make your bed neatly before school', 'household', 15, 'checklist', NULL, '["Straighten sheets","Arrange pillows","Smooth comforter"]', 'bed', 'all', 'all', 'daily', '{"subcategory":"cleaning","tags":["morning","daily"]}', TRUE),
('clear_dishes', 'Clear dishes', 'Bring your dishes to the sink and help clean up', 'household', 20, 'parent', NULL, NULL, 'fork-knife', 'all', 'all', 'daily', '{"subcategory":"chores","tags":["meals","daily"]}', FALSE),
('backpack', 'Put away backpack & shoes', 'Put your backpack and shoes in their place when you get home', 'household', 15, 'auto', NULL, NULL, 'backpack', 'all', 'all', 'daily', '{"subcategory":"self_care","tags":["afterschool","daily"]}', FALSE),
('brush_teeth', 'Brush teeth', 'Brush your teeth in the morning and before bed', 'health', 10, 'checklist', NULL, '["Morning brushing","Evening brushing"]', 'tooth', 'all', 'all', 'daily', '{"subcategory":"hygiene","tags":["daily","routine"]}', FALSE),
('exercise', 'Exercise', 'Do any physical activity - sports, biking, playing outside', 'health', 40, 'timer', 30, NULL, 'person-running', 'all', 'all', 'daily', '{"subcategory":"exercise","tags":["fitness","daily"]}', FALSE),
('feed_pet', 'Feed pet', 'Give food and fresh water to your pet', 'household', 20, 'parent', NULL, NULL, 'paw', 'all', 'all', 'daily', '{"subcategory":"pet_care","tags":["daily","responsibility"]}', TRUE),
('practice_instrument', 'Practice instrument', 'Practice your musical instrument', 'learning', 30, 'timer', 20, NULL, 'music-note', 'all', 'all', 'daily', '{"subcategory":"practice","tags":["music","skill"]}', FALSE),
('pick_up_toys', 'Pick up toys', 'Put all your toys back where they belong', 'household', 15, 'parent', NULL, NULL, 'toy-brick', '5-7', 'all', 'daily', '{"subcategory":"cleaning","tags":["daily"]}', TRUE),
('get_dressed', 'Get dressed', 'Put on your clothes without help', 'health', 10, 'auto', NULL, NULL, 't-shirt', '5-7', 'all', 'daily', '{"subcategory":"self_care","tags":["morning","daily"]}', FALSE),
('laundry', 'Help with laundry', 'Fold laundry or help load/unload the washer', 'household', 25, 'parent', NULL, NULL, 't-shirt', '12-14', 'all', 'weekly', '{"subcategory":"chores","tags":["weekly"]}', TRUE),
('study_session', 'Study session', 'Focused study time for tests or projects', 'learning', 60, 'timer', 45, NULL, 'graduation-cap', '12-14', 'all', 'daily', '{"subcategory":"self_study","tags":["academic"]}', FALSE);

-- 9. NOTIFY RELOAD (Just in case)
NOTIFY pgrst, 'reload config';
