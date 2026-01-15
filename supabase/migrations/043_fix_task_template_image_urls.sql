-- Migration: Fix task template image URLs
-- Use app public folder URLs instead of Supabase Storage

-- Update task_templates with public image URLs
UPDATE task_templates SET image_url = '/images/tasks/homework.png' WHERE template_key = 'homework';
UPDATE task_templates SET image_url = '/images/tasks/reading.png' WHERE template_key = 'reading';
UPDATE task_templates SET image_url = '/images/tasks/make_bed.png' WHERE template_key = 'make_bed';
UPDATE task_templates SET image_url = '/images/tasks/clear_dishes.png' WHERE template_key = 'clear_dishes';
UPDATE task_templates SET image_url = '/images/tasks/backpack.png' WHERE template_key = 'backpack';
UPDATE task_templates SET image_url = '/images/tasks/brush_teeth.png' WHERE template_key = 'brush_teeth';
UPDATE task_templates SET image_url = '/images/tasks/exercise.png' WHERE template_key = 'exercise';
UPDATE task_templates SET image_url = '/images/tasks/feed_pet.png' WHERE template_key = 'feed_pet';
UPDATE task_templates SET image_url = '/images/tasks/practice_instrument.png' WHERE template_key = 'practice_instrument';
UPDATE task_templates SET image_url = '/images/tasks/pick_up_toys.png' WHERE template_key = 'pick_up_toys';
UPDATE task_templates SET image_url = '/images/tasks/get_dressed.png' WHERE template_key = 'get_dressed';
UPDATE task_templates SET image_url = '/images/tasks/laundry.png' WHERE template_key = 'laundry';
UPDATE task_templates SET image_url = '/images/tasks/study_session.png' WHERE template_key = 'study_session';
