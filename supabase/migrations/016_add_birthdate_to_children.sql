-- Add birthdate column to children table
-- This allows storing exact birthdates instead of just birth year
-- Important for Artales integration and age-appropriate content generation

ALTER TABLE children
ADD COLUMN birthdate DATE;

-- Add comment for documentation
COMMENT ON COLUMN children.birthdate IS 'Child''s exact birthdate for age calculation and Artales integration';
