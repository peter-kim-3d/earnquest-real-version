-- Migration: Fix missing pin_code column in children table
-- This column was missing in some environments due to it being excluded from the combined migration.

ALTER TABLE children ADD COLUMN IF NOT EXISTS pin_code VARCHAR(4);

-- Add comment for documentation
COMMENT ON COLUMN children.pin_code IS 'Optional PIN for child login (4 digits)';

-- Add constraint to ensure pin_code is exactly 4 digits if set
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_pin_code_format'
    ) THEN
        ALTER TABLE children ADD CONSTRAINT valid_pin_code_format CHECK (pin_code IS NULL OR pin_code ~ '^\d{4}$');
    END IF;
END $$;
