-- Migration: Add image_url to reward_templates and populate default images
-- Similar to task templates, rewards can now have custom images

-- 1. Add image_url column to reward_templates
ALTER TABLE reward_templates ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Update reward_templates with public image URLs
-- Power Ups (autonomy)
UPDATE reward_templates SET image_url = '/images/rewards/event_ticket.png' WHERE name = 'Choose Weekend Activity';
UPDATE reward_templates SET image_url = '/images/rewards/pizza_treat.png' WHERE name = 'Pick Tonight''s Dinner';
UPDATE reward_templates SET image_url = '/images/rewards/crown_reward.png' WHERE name = 'Skip One Chore';
UPDATE reward_templates SET image_url = '/images/rewards/star_reward.png' WHERE name = 'Stay Up 30 Min Late';

-- Fun Stuff (experience)
UPDATE reward_templates SET image_url = '/images/rewards/ice_cream.png' WHERE name = 'Ice Cream Trip';
UPDATE reward_templates SET image_url = '/images/rewards/park_visit.png' WHERE name = 'Mini Golf Outing';
UPDATE reward_templates SET image_url = '/images/rewards/movie_night.png' WHERE name = 'Movie Theater';
UPDATE reward_templates SET image_url = '/images/rewards/park_visit.png' WHERE name = 'Park Playdate';
UPDATE reward_templates SET image_url = '/images/rewards/event_ticket.png' WHERE name = 'Museum Visit';

-- Savings
UPDATE reward_templates SET image_url = '/images/rewards/gift_reward.png' WHERE name = 'Save Towards Lego Set';
UPDATE reward_templates SET image_url = '/images/rewards/bike_ride.png' WHERE name = 'Save Towards Bike';
UPDATE reward_templates SET image_url = '/images/rewards/game_time.png' WHERE name = 'Save Towards Game';

-- Screen Time
UPDATE reward_templates SET image_url = '/images/rewards/tv_time.png' WHERE name = '30 Minutes Screen Time';
UPDATE reward_templates SET image_url = '/images/rewards/tv_time.png' WHERE name = '1 Hour Screen Time';
UPDATE reward_templates SET image_url = '/images/rewards/movie_night.png' WHERE name = 'Weekend Movie Night';
