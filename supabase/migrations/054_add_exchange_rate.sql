-- Migration: Add Exchange Rate to Families
-- Point exchange rate for parent display: $1 = X pts. Default 100.

-- Add exchange rate column to families table
ALTER TABLE families
ADD COLUMN IF NOT EXISTS point_exchange_rate INTEGER NOT NULL DEFAULT 100;

-- Add constraint to ensure valid exchange rates
ALTER TABLE families
ADD CONSTRAINT check_valid_exchange_rate
CHECK (point_exchange_rate IN (10, 20, 50, 100, 200));

COMMENT ON COLUMN families.point_exchange_rate IS
'Point exchange rate for parent display. $1 = X pts. Default 100.';
