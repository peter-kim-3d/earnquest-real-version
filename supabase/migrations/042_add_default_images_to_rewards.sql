-- Add default images to existing rewards based on category and name patterns

-- Screen Time rewards
UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/game_time.png'
WHERE category = 'screen' AND image_url IS NULL AND (LOWER(name) LIKE '%game%' OR LOWER(name) LIKE '%gaming%' OR LOWER(name) LIKE '%video game%');

UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/tv_time.png'
WHERE category = 'screen' AND image_url IS NULL AND (LOWER(name) LIKE '%tv%' OR LOWER(name) LIKE '%television%' OR LOWER(name) LIKE '%screen%');

UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/movie_night.png'
WHERE category = 'screen' AND image_url IS NULL AND (LOWER(name) LIKE '%movie%' OR LOWER(name) LIKE '%film%' OR LOWER(name) LIKE '%netflix%' OR LOWER(name) LIKE '%youtube%');

-- Default for remaining screen rewards
UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/tv_time.png'
WHERE category = 'screen' AND image_url IS NULL;

-- Experience rewards
UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/park_visit.png'
WHERE category = 'experience' AND image_url IS NULL AND (LOWER(name) LIKE '%park%' OR LOWER(name) LIKE '%playground%' OR LOWER(name) LIKE '%outside%');

UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/bike_ride.png'
WHERE category = 'experience' AND image_url IS NULL AND (LOWER(name) LIKE '%bike%' OR LOWER(name) LIKE '%bicycle%' OR LOWER(name) LIKE '%cycling%');

UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/camping_trip.png'
WHERE category = 'experience' AND image_url IS NULL AND (LOWER(name) LIKE '%camp%' OR LOWER(name) LIKE '%outdoor%' OR LOWER(name) LIKE '%nature%');

UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/car_trip.png'
WHERE category = 'experience' AND image_url IS NULL AND (LOWER(name) LIKE '%car%' OR LOWER(name) LIKE '%drive%' OR LOWER(name) LIKE '%road trip%');

UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/airplane_trip.png'
WHERE category = 'experience' AND image_url IS NULL AND (LOWER(name) LIKE '%trip%' OR LOWER(name) LIKE '%travel%' OR LOWER(name) LIKE '%vacation%' OR LOWER(name) LIKE '%flight%');

UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/event_ticket.png'
WHERE category = 'experience' AND image_url IS NULL AND (LOWER(name) LIKE '%ticket%' OR LOWER(name) LIKE '%event%' OR LOWER(name) LIKE '%show%' OR LOWER(name) LIKE '%concert%');

UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/ice_cream.png'
WHERE category = 'experience' AND image_url IS NULL AND (LOWER(name) LIKE '%ice cream%' OR LOWER(name) LIKE '%dessert%' OR LOWER(name) LIKE '%treat%');

UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/pizza_treat.png'
WHERE category = 'experience' AND image_url IS NULL AND (LOWER(name) LIKE '%pizza%' OR LOWER(name) LIKE '%restaurant%' OR LOWER(name) LIKE '%dinner%' OR LOWER(name) LIKE '%lunch%');

-- Default for remaining experience rewards
UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/event_ticket.png'
WHERE category = 'experience' AND image_url IS NULL;

-- Autonomy rewards (Power Ups)
UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/crown_reward.png'
WHERE category = 'autonomy' AND image_url IS NULL AND (LOWER(name) LIKE '%choose%' OR LOWER(name) LIKE '%pick%' OR LOWER(name) LIKE '%decision%');

UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/star_reward.png'
WHERE category = 'autonomy' AND image_url IS NULL AND (LOWER(name) LIKE '%late%' OR LOWER(name) LIKE '%bedtime%' OR LOWER(name) LIKE '%stay up%');

-- Default for remaining autonomy rewards
UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/star_reward.png'
WHERE category = 'autonomy' AND image_url IS NULL;

-- Savings rewards
UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/piggy_bank.png'
WHERE category = 'savings' AND image_url IS NULL AND (LOWER(name) LIKE '%save%' OR LOWER(name) LIKE '%piggy%');

UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/coin_jar.png'
WHERE category = 'savings' AND image_url IS NULL AND (LOWER(name) LIKE '%coin%' OR LOWER(name) LIKE '%jar%' OR LOWER(name) LIKE '%goal%');

UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/wallet_money.png'
WHERE category = 'savings' AND image_url IS NULL AND (LOWER(name) LIKE '%money%' OR LOWER(name) LIKE '%cash%' OR LOWER(name) LIKE '%allowance%');

-- Default for remaining savings rewards
UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/piggy_bank.png'
WHERE category = 'savings' AND image_url IS NULL;

-- Item rewards
UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/new_clothes.png'
WHERE category = 'item' AND image_url IS NULL AND (LOWER(name) LIKE '%cloth%' OR LOWER(name) LIKE '%shirt%' OR LOWER(name) LIKE '%dress%');

UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/new_shoes.png'
WHERE category = 'item' AND image_url IS NULL AND (LOWER(name) LIKE '%shoe%' OR LOWER(name) LIKE '%sneaker%');

UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/new_backpack.png'
WHERE category = 'item' AND image_url IS NULL AND (LOWER(name) LIKE '%backpack%' OR LOWER(name) LIKE '%bag%');

UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/shopping_spree.png'
WHERE category = 'item' AND image_url IS NULL AND (LOWER(name) LIKE '%toy%' OR LOWER(name) LIKE '%lego%' OR LOWER(name) LIKE '%game%');

-- Default for remaining item rewards
UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/gift_reward.png'
WHERE category = 'item' AND image_url IS NULL;

-- Other category rewards
UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/gift_reward.png'
WHERE category = 'other' AND image_url IS NULL;

-- Any remaining rewards without images get the gift image
UPDATE rewards SET image_url = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults/gift_reward.png'
WHERE image_url IS NULL;
