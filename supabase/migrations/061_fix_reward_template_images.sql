-- Fix reward template images for Gift Card, Family Movie, Save to Bank

-- Image URLs
-- gift_card: https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/gift_card.png
-- movie_night: https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/movie_night.png
-- piggy_bank: https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/piggy_bank.png

-- Step 1: Update reward_templates for Gift Cards (USD)
UPDATE reward_templates
SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/gift_card.png'
WHERE LOWER(name) LIKE '%gift card%' AND image_url IS NULL;

-- Step 2: Update reward_templates for Gift Cards (KRW)
UPDATE reward_templates
SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/gift_card.png'
WHERE LOWER(name) LIKE '%기프트%' AND image_url IS NULL;

-- Step 3: Update reward_templates for Pick Family Movie/Show
UPDATE reward_templates
SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/movie_night.png'
WHERE (LOWER(name) LIKE '%family movie%' OR LOWER(name) LIKE '%family show%' OR LOWER(name) LIKE '%pick%movie%' OR LOWER(name) LIKE '%가족 영화%')
AND image_url IS NULL;

-- Step 4: Update reward_templates for Save to Bank
UPDATE reward_templates
SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/piggy_bank.png'
WHERE (LOWER(name) LIKE '%save%bank%' OR LOWER(name) LIKE '%저축%' OR LOWER(name) LIKE '%transfer%savings%')
AND image_url IS NULL;

-- Step 5: Update existing rewards that don't have images

-- Gift Cards
UPDATE rewards
SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/gift_card.png'
WHERE (LOWER(name) LIKE '%gift card%' OR LOWER(name) LIKE '%기프트%')
AND image_url IS NULL;

-- Pick Family Movie/Show
UPDATE rewards
SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/movie_night.png'
WHERE (LOWER(name) LIKE '%family movie%' OR LOWER(name) LIKE '%family show%' OR LOWER(name) LIKE '%pick%movie%' OR LOWER(name) LIKE '%가족 영화%')
AND image_url IS NULL;

-- Save to Bank
UPDATE rewards
SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/piggy_bank.png'
WHERE (LOWER(name) LIKE '%save%bank%' OR LOWER(name) LIKE '%저축%' OR LOWER(name) LIKE '%transfer%savings%')
AND image_url IS NULL;
