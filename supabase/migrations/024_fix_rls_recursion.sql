-- Migration 024: Fix RLS Recursion on child_task_overrides
-- Issue: Previous policy queried users table which caused infinite recursion with users table policy.
-- Fix: Use a SECURITY DEFINER function to get family_id safely.

-- 1. Create Helper Function
-- This function runs with the privileges of the creator (postgres/admin),
-- effectively bypassing the RLS on the 'users' table for this specific lookup.
CREATE OR REPLACE FUNCTION get_auth_user_family_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT family_id FROM users WHERE id = auth.uid()
$$;

COMMENT ON FUNCTION get_auth_user_family_id IS 'Returns the family_id of the authenticated user, bypassing RLS on users table.';

-- 2. Update child_task_overrides Policy
DROP POLICY IF EXISTS "Users can view/manage their family's overrides" ON child_task_overrides;

CREATE POLICY "Users can view/manage their family's overrides"
  ON child_task_overrides FOR ALL
  USING (
    child_id IN (
      SELECT id FROM children WHERE family_id = get_auth_user_family_id()
    )
  );

-- 3. (Optional but recommended) Fix Children Policy Recursion
-- Often 'children' table policies also query 'users'. Let's verify and potential fix if we used standard valid pattern.
-- But for now, focus on the reported error table.
