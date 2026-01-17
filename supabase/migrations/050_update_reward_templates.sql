-- Migration 050: Update reward templates
-- Add 'item' category, remove 5 templates, add 8 new templates (including locale-specific gift cards)

-- Step 1: Update constraint to add 'item' category
ALTER TABLE reward_templates DROP CONSTRAINT IF EXISTS valid_category;
ALTER TABLE reward_templates ADD CONSTRAINT valid_category
  CHECK (category IN ('screen', 'autonomy', 'experience', 'savings', 'item'));

-- Step 2: Remove deprecated templates
DELETE FROM reward_templates WHERE name = 'Stay Up 30 Min Late';
DELETE FROM reward_templates WHERE name = 'Choose Weekend Activity';
DELETE FROM reward_templates WHERE name = 'Skip One Chore';
DELETE FROM reward_templates WHERE name = 'Save Towards Lego Set';
DELETE FROM reward_templates WHERE name = 'Save Towards Bike';

-- Step 3: Add new autonomy template
INSERT INTO reward_templates (name, description, category, points_cost, icon, age_group, style, weekly_limit, settings)
VALUES ('Pick Family Movie/Show', 'Choose what we watch together', 'autonomy', 80, 'movie', 'all', 'all', NULL, '{"color": "#ea580c"}');

-- Step 4: Add USD Gift Card templates
INSERT INTO reward_templates (name, description, category, points_cost, icon, age_group, style, settings)
VALUES
  ('$10 Gift Card', 'Redeem for a $10 gift card', 'item', 500, 'gift', 'all', 'all', '{"color": "#8b5cf6", "locale": "en-US"}'),
  ('$20 Gift Card', 'Redeem for a $20 gift card', 'item', 1000, 'gift', 'all', 'all', '{"color": "#7c3aed", "locale": "en-US"}'),
  ('$50 Gift Card', 'Redeem for a $50 gift card', 'item', 2500, 'gift', 'all', 'all', '{"color": "#6d28d9", "locale": "en-US"}');

-- Step 5: Add KRW Gift Card templates
INSERT INTO reward_templates (name, description, category, points_cost, icon, age_group, style, settings)
VALUES
  ('₩10,000 기프트 카드', '₩10,000 기프트 카드로 교환', 'item', 500, 'gift', 'all', 'all', '{"color": "#8b5cf6", "locale": "ko-KR"}'),
  ('₩20,000 기프트 카드', '₩20,000 기프트 카드로 교환', 'item', 1000, 'gift', 'all', 'all', '{"color": "#7c3aed", "locale": "ko-KR"}'),
  ('₩50,000 기프트 카드', '₩50,000 기프트 카드로 교환', 'item', 2500, 'gift', 'all', 'all', '{"color": "#6d28d9", "locale": "ko-KR"}');

-- Step 6: Add new savings template
INSERT INTO reward_templates (name, description, category, points_cost, icon, age_group, style, settings)
VALUES ('Save to Bank', 'Transfer points to savings', 'savings', 150, 'piggybank', 'all', 'all', '{"color": "#14b8a6"}');

COMMENT ON CONSTRAINT valid_category ON reward_templates IS 'Valid categories: screen, autonomy, experience, savings, item';
