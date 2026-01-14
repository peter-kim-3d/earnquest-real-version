-- Fix permissions for all tables
-- This grants full access to service_role and authenticated users
-- Run this in Supabase SQL Editor

-- Grant all permissions on tables to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Ensure service_role can bypass RLS (should be default, but let's be explicit)
ALTER ROLE service_role SET row_security = off;

-- Show confirmation
SELECT 'Permissions fixed!' as status;
