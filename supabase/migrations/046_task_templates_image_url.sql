-- Migration: Add image_url to task_templates
-- Updates existing templates with default images

-- ============================================================================
-- Update task_templates with image_url values
-- ============================================================================

-- Learning tasks
UPDATE task_templates SET image_url = '/images/tasks/homework.png' WHERE template_key = 'homework';
UPDATE task_templates SET image_url = '/images/tasks/reading.png' WHERE template_key = 'reading';
UPDATE task_templates SET image_url = '/images/tasks/study_session.png' WHERE template_key = 'study_session';
UPDATE task_templates SET image_url = '/images/tasks/practice_instrument.png' WHERE template_key = 'practice_instrument';
UPDATE task_templates SET image_url = '/images/tasks/check_planner.png' WHERE template_key = 'check_planner';
UPDATE task_templates SET image_url = '/images/tasks/writing.png' WHERE template_key = 'writing';
UPDATE task_templates SET image_url = '/images/tasks/art.png' WHERE template_key = 'art';

-- Life tasks (morning)
UPDATE task_templates SET image_url = '/images/tasks/wake_on_time.png' WHERE template_key = 'wake_on_time';
UPDATE task_templates SET image_url = '/images/tasks/make_bed.png' WHERE template_key = 'make_bed';
UPDATE task_templates SET image_url = '/images/tasks/get_dressed.png' WHERE template_key = 'get_dressed';

-- Life tasks (after_school)
UPDATE task_templates SET image_url = '/images/tasks/shoes_tidy.png' WHERE template_key = 'shoes_tidy';
UPDATE task_templates SET image_url = '/images/tasks/backpack.png' WHERE template_key = 'backpack';
UPDATE task_templates SET image_url = '/images/tasks/lunchbox_sink.png' WHERE template_key = 'lunchbox_sink';
UPDATE task_templates SET image_url = '/images/tasks/clear_dishes.png' WHERE template_key = 'clear_dishes';

-- Life tasks (evening/anytime)
UPDATE task_templates SET image_url = '/images/tasks/feed_pet.png' WHERE template_key = 'feed_pet';
UPDATE task_templates SET image_url = '/images/tasks/pick_up_toys.png' WHERE template_key = 'pick_up_toys';
UPDATE task_templates SET image_url = '/images/tasks/prep_tomorrow.png' WHERE template_key = 'prep_tomorrow';
UPDATE task_templates SET image_url = '/images/tasks/clean_desk.png' WHERE template_key = 'clean_desk';
UPDATE task_templates SET image_url = '/images/tasks/laundry.png' WHERE template_key = 'laundry';

-- Health tasks
UPDATE task_templates SET image_url = '/images/tasks/brush_teeth.png' WHERE template_key = 'brush_teeth';
UPDATE task_templates SET image_url = '/images/tasks/brush_teeth.png' WHERE template_key = 'brush_morning';
UPDATE task_templates SET image_url = '/images/tasks/brush_teeth.png' WHERE template_key = 'brush_evening';
UPDATE task_templates SET image_url = '/images/tasks/wash_hands.png' WHERE template_key = 'wash_hands';
UPDATE task_templates SET image_url = '/images/tasks/shower.png' WHERE template_key = 'shower';
UPDATE task_templates SET image_url = '/images/tasks/exercise.png' WHERE template_key = 'exercise';
UPDATE task_templates SET image_url = '/images/tasks/outdoor.png' WHERE template_key = 'outdoor';

-- Instrument template (alias)
UPDATE task_templates SET image_url = '/images/tasks/practice_instrument.png' WHERE template_key = 'instrument';
