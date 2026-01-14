-- Check current permissions on tables
-- Run this in Supabase SQL Editor to see what's granted

SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT
  table_name,
  grantee,
  string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('service_role', 'authenticated', 'anon', 'postgres')
  AND table_name IN ('families', 'users', 'children', 'task_templates', 'reward_templates')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;
