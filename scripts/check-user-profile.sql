-- Check if user profile exists in users table
-- Run this in Supabase SQL Editor

SELECT
  id,
  email,
  full_name,
  family_id,
  role,
  created_at
FROM users
WHERE email = 'test.id.peter.k@gmail.com';

-- If no results, the user profile wasn't created yet
-- This is expected - we need to implement user creation after OAuth
