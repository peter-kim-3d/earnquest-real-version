-- Add parent passcode column to users table
-- This allows parents to set a 4-digit passcode for quick dashboard access
-- (separate from their Supabase auth password)

ALTER TABLE users ADD COLUMN IF NOT EXISTS passcode VARCHAR(4);

-- Add constraint to ensure passcode is exactly 4 digits if set
ALTER TABLE users ADD CONSTRAINT valid_passcode
  CHECK (passcode IS NULL OR passcode ~ '^\d{4}$');

-- Add index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_passcode
  ON users(passcode) WHERE passcode IS NOT NULL;

-- Comment
COMMENT ON COLUMN users.passcode IS 'Parent 4-digit passcode for dashboard access (separate from auth password)';
