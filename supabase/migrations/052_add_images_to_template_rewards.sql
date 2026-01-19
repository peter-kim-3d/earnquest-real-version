-- Add default images to template rewards (Gift Card, Pick Family Movie/Show, Save to Bank)

-- Gift Card rewards (item category)
UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/gift_card.png'
WHERE category = 'item' AND image_url IS NULL AND (LOWER(name) LIKE '%gift card%');

-- Pick Family Movie/Show (autonomy category)
UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/movie_night.png'
WHERE category = 'autonomy' AND image_url IS NULL AND (LOWER(name) LIKE '%family movie%' OR LOWER(name) LIKE '%family show%' OR LOWER(name) LIKE '%pick%movie%' OR LOWER(name) LIKE '%pick%show%');

-- Save to Bank (savings category)
UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/piggy_bank.png'
WHERE category = 'savings' AND image_url IS NULL AND (LOWER(name) LIKE '%save%bank%' OR LOWER(name) LIKE '%transfer%savings%');
