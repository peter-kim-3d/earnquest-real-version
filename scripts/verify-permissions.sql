-- Verify RLS and permissions
-- Run this in Supabase SQL Editor

-- Check if RLS is enabled on tables
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('families', 'users', 'children', 'tasks', 'task_templates')
ORDER BY tablename;

-- Check RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check table grants for service_role
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'service_role'
  AND table_name IN ('families', 'users', 'children')
ORDER BY table_name, privilege_type;
