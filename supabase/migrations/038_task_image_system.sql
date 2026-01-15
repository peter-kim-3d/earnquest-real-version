-- Migration: Task Icon/Image System
-- Description: Add image_url support to tasks for custom task images

-- 1. Add image_url column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;
COMMENT ON COLUMN tasks.image_url IS 'URL to custom task image. If set, takes priority over icon field.';

-- 2. Add image_url column to task_templates table
ALTER TABLE task_templates ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;
COMMENT ON COLUMN task_templates.image_url IS 'URL to default task image for this template.';

-- 3. Update task_templates with default image URLs (Supabase Storage)
-- Images stored in task-images bucket
UPDATE task_templates SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/task-images/defaults/homework.png' WHERE template_key = 'homework';
UPDATE task_templates SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/task-images/defaults/reading.png' WHERE template_key = 'reading';
UPDATE task_templates SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/task-images/defaults/make_bed.png' WHERE template_key = 'make_bed';
UPDATE task_templates SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/task-images/defaults/clear_dishes.png' WHERE template_key = 'clear_dishes';
UPDATE task_templates SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/task-images/defaults/backpack.png' WHERE template_key = 'backpack';
UPDATE task_templates SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/task-images/defaults/brush_teeth.png' WHERE template_key = 'brush_teeth';
UPDATE task_templates SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/task-images/defaults/exercise.png' WHERE template_key = 'exercise';
UPDATE task_templates SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/task-images/defaults/feed_pet.png' WHERE template_key = 'feed_pet';
UPDATE task_templates SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/task-images/defaults/practice_instrument.png' WHERE template_key = 'practice_instrument';
UPDATE task_templates SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/task-images/defaults/pick_up_toys.png' WHERE template_key = 'pick_up_toys';
UPDATE task_templates SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/task-images/defaults/get_dressed.png' WHERE template_key = 'get_dressed';
UPDATE task_templates SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/task-images/defaults/laundry.png' WHERE template_key = 'laundry';
UPDATE task_templates SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/task-images/defaults/study_session.png' WHERE template_key = 'study_session';
