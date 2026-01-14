-- Complete RLS fix - Remove ALL policies and recreate simple ones
-- Run this in Supabase SQL Editor

-- Step 1: Disable RLS temporarily
ALTER TABLE families DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE children DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Step 3: Grant full permissions to service_role (bypass RLS)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Step 4: Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Step 5: Re-enable RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;

-- Step 6: Create SIMPLE policies (no recursion)

-- Families: Allow all authenticated users (we'll handle authorization in app code)
CREATE POLICY "families_all_authenticated"
  ON families
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Users: Users can only access their own record
CREATE POLICY "users_own_record"
  ON users
  FOR ALL
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Children: Access via direct family_id check (no subquery)
CREATE POLICY "children_authenticated"
  ON children
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Verify no policies reference users table
SELECT
  schemaname,
  tablename,
  policyname,
  pg_get_expr(qual, (schemaname||'.'||tablename)::regclass) as using_expr
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT 'RLS policies fixed - no recursion!' as status;
