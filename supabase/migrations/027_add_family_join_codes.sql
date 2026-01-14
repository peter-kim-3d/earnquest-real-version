-- Add family join codes for child device access
-- Children can use 6-character codes to access the app on their own devices
-- Codes are renewable by parents via settings

-- Add join_code column to families table
ALTER TABLE families ADD COLUMN join_code VARCHAR(6) UNIQUE;

-- Add constraint for uppercase alphanumeric only (excluding confusing characters)
ALTER TABLE families ADD CONSTRAINT valid_join_code
  CHECK (join_code IS NULL OR join_code ~ '^[A-Z0-9]{6}$');

-- Create index for fast lookups
CREATE INDEX idx_families_join_code ON families(join_code)
WHERE join_code IS NOT NULL;

-- Add column comment
COMMENT ON COLUMN families.join_code IS
  '6-character code for child device access (renewable by parents)';

-- Generate unique codes for all existing families
-- Using uppercase alphanumeric excluding confusing characters (I, O, L, 0, 1)
DO $$
DECLARE
  family_record RECORD;
  new_code VARCHAR(6);
  code_exists BOOLEAN;
  chars VARCHAR(32) := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- Exclude I, O, L, 0, 1
  max_attempts INTEGER := 100;
  attempt INTEGER;
BEGIN
  FOR family_record IN SELECT id FROM families WHERE join_code IS NULL LOOP
    attempt := 0;
    LOOP
      -- Generate random 6-character code
      new_code := '';
      FOR i IN 1..6 LOOP
        new_code := new_code || SUBSTR(chars, FLOOR(RANDOM() * LENGTH(chars) + 1)::INTEGER, 1);
      END LOOP;

      -- Check if code already exists
      SELECT EXISTS(SELECT 1 FROM families WHERE join_code = new_code) INTO code_exists;

      -- If unique, update and exit loop
      IF NOT code_exists THEN
        UPDATE families SET join_code = new_code WHERE id = family_record.id;
        EXIT;
      END IF;

      attempt := attempt + 1;
      IF attempt >= max_attempts THEN
        RAISE EXCEPTION 'Failed to generate unique code for family %', family_record.id;
      END IF;
    END LOOP;
  END LOOP;
END $$;
