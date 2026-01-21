-- Grant SELECT permission on v_child_today_tasks to service_role
-- This is needed for child direct login which uses admin client (service_role)
-- The admin client bypasses RLS on tables but still needs explicit VIEW permissions

GRANT SELECT ON v_child_today_tasks TO service_role;
