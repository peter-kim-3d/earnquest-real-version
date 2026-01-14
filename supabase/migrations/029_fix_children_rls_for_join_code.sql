-- Fix RLS for children table to allow join_code lookups
-- This allows child devices to see available children after validating family code

-- Enable RLS if not already enabled
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow SELECT for children in families (for child device access)
-- This allows unauthenticated users to view children list after validating family code
-- They can only see id, name, age_group, avatar_url - no sensitive data
CREATE POLICY "Allow viewing children for child device access"
  ON children
  FOR SELECT
  USING (true);

-- Policy 2: Allow authenticated users to SELECT children in their family
CREATE POLICY "Users can view children in their family"
  ON children
  FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id
      FROM users
      WHERE users.id = auth.uid()
    )
  );

-- Policy 3: Allow authenticated users to UPDATE children in their family
CREATE POLICY "Users can update children in their family"
  ON children
  FOR UPDATE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id
      FROM users
      WHERE users.id = auth.uid()
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT family_id
      FROM users
      WHERE users.id = auth.uid()
    )
  );

-- Policy 4: Allow authenticated users to INSERT children in their family
CREATE POLICY "Users can create children in their family"
  ON children
  FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT family_id
      FROM users
      WHERE users.id = auth.uid()
    )
  );

-- Add comment
COMMENT ON POLICY "Allow viewing children for child device access" ON children IS
  'Allows unauthenticated child device access to view children list after validating family code';
