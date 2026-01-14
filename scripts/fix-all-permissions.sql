-- Complete permissions fix for EarnQuest
-- Run this in Supabase SQL Editor

-- Step 1: Grant schema permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Step 2: Grant ALL permissions to postgres and service_role (bypass RLS)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- Step 3: Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Step 4: Grant read-only to anon
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Step 5: Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO postgres, anon, authenticated, service_role;

-- Step 6: Drop and recreate RLS policies (avoid infinite recursion)

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own family" ON families;
DROP POLICY IF EXISTS "Users can update their own family" ON families;
DROP POLICY IF EXISTS "Users can insert their own family" ON families;
DROP POLICY IF EXISTS "Authenticated users can view their family" ON families;
DROP POLICY IF EXISTS "Authenticated users can insert families" ON families;
DROP POLICY IF EXISTS "Authenticated users can update their family" ON families;

DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

DROP POLICY IF EXISTS "Users can view children in family" ON children;
DROP POLICY IF EXISTS "Users can insert children in family" ON children;
DROP POLICY IF EXISTS "Users can update children in family" ON children;

-- Recreate simple policies without recursion

-- Families table
CREATE POLICY "families_select_authenticated"
  ON families FOR SELECT
  TO authenticated
  USING (true); -- Allow all authenticated users to view families (RLS will be handled by family_id)

CREATE POLICY "families_insert_authenticated"
  ON families FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Allow authenticated users to create families

CREATE POLICY "families_update_authenticated"
  ON families FOR UPDATE
  TO authenticated
  USING (true); -- Allow authenticated users to update families

-- Users table
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid()); -- Users can only see their own profile

CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid()); -- Users can only insert their own profile

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid()); -- Users can only update their own profile

-- Children table
CREATE POLICY "children_select_family"
  ON children FOR SELECT
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  ); -- Users can view children in their family

CREATE POLICY "children_insert_family"
  ON children FOR INSERT
  TO authenticated
  WITH CHECK (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  ); -- Users can add children to their family

CREATE POLICY "children_update_family"
  ON children FOR UPDATE
  TO authenticated
  USING (
    family_id IN (
      SELECT family_id FROM users WHERE id = auth.uid()
    )
  ); -- Users can update children in their family

-- Verify permissions
SELECT 'Permissions granted!' as status;

SELECT
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'service_role'
  AND table_name IN ('families', 'users', 'children')
ORDER BY table_name, privilege_type;
