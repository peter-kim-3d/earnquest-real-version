-- Migration 049: Fix checklist columns for templates
-- The prep_tomorrow template has checklist in metadata but not in the checklist column
-- This migration copies checklist from metadata to the dedicated checklist column

-- Fix prep_tomorrow template
UPDATE task_templates
SET checklist = metadata->'checklist'
WHERE template_key = 'prep_tomorrow'
  AND checklist IS NULL
  AND metadata->>'checklist' IS NOT NULL;

-- Also fix any existing tasks that were created from this template
UPDATE tasks
SET checklist = metadata->'checklist'
WHERE checklist IS NULL
  AND metadata->'source'->>'templateKey' = 'prep_tomorrow'
  AND metadata->>'checklist' IS NOT NULL;

-- For tasks where checklist might be stored differently, update from source metadata
UPDATE tasks t
SET checklist = tt.checklist
FROM task_templates tt
WHERE t.metadata->'source'->>'templateKey' = tt.template_key
  AND t.checklist IS NULL
  AND tt.checklist IS NOT NULL;
