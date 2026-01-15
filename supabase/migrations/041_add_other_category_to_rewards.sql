-- Add 'other' category to rewards table constraint

-- Drop existing constraint
ALTER TABLE rewards DROP CONSTRAINT IF EXISTS valid_category;

-- Add new constraint with 'other' category
ALTER TABLE rewards ADD CONSTRAINT valid_category
  CHECK (category IN ('screen', 'autonomy', 'experience', 'savings', 'item', 'other'));
