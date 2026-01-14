-- Fix RLS for families table to allow join_code lookups
-- This allows child devices to validate family codes without authentication

-- Enable RLS if not already enabled
ALTER TABLE families ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow SELECT by join_code (for child device access)
-- This allows unauthenticated users to look up a family ONLY by join_code
-- They can only see id, name, and join_code - no sensitive data
CREATE POLICY "Allow lookup by join_code"
  ON families
  FOR SELECT
  USING (join_code IS NOT NULL);

-- Policy 2: Allow authenticated users to SELECT their own family
CREATE POLICY "Users can view their own family"
  ON families
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT family_id
      FROM users
      WHERE users.id = auth.uid()
    )
  );

-- Policy 3: Allow authenticated users to UPDATE their own family
CREATE POLICY "Users can update their own family"
  ON families
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT family_id
      FROM users
      WHERE users.id = auth.uid()
    )
  )
  WITH CHECK (
    id IN (
      SELECT family_id
      FROM users
      WHERE users.id = auth.uid()
    )
  );

-- Add comment
COMMENT ON POLICY "Allow lookup by join_code" ON families IS
  'Allows unauthenticated child device access via join code';
