-- Migration: Optional Child PIN
-- Description: Add requireChildPin setting to family settings
-- Default: true (backwards compatible)

-- Update existing families to have explicit requireChildPin setting
-- The settings column is JSONB, we just add the new field

-- Set requireChildPin = true for all existing families that don't have it
UPDATE families
SET settings = COALESCE(settings, '{}'::jsonb) || '{"requireChildPin": true}'::jsonb
WHERE settings->>'requireChildPin' IS NULL;

-- Add comment for documentation
COMMENT ON TABLE families IS 'Family accounts. settings.requireChildPin controls child PIN requirement.';
