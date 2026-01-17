-- Seed task templates
-- Easy Start tasks (3 tasks)
INSERT INTO task_templates (name, description, category, points, icon, age_group, style, frequency, approval_type, settings) VALUES
('Brush Teeth', 'Brush for at least 2 minutes', 'hygiene', 50, 'dentistry', 'all', 'easy', 'daily', 'manual', '{"reminder_time": "08:00"}'),
('Put Away Toys', 'Clean up toys before bedtime', 'chores', 50, 'toys', 'all', 'easy', 'daily', 'manual', '{"reminder_time": "19:00"}'),
('Say Please & Thank You', 'Use polite words', 'kindness', 30, 'handshake', 'all', 'easy', 'daily', 'auto', '{}');

-- Balanced tasks (6 tasks)
INSERT INTO task_templates (name, description, category, points, icon, age_group, style, frequency, approval_type, settings) VALUES
('Complete Homework', 'Finish all homework assignments', 'learning', 100, 'school', 'all', 'balanced', 'daily', 'manual', '{}'),
('Feed the Dog', 'Give food and water to pet', 'chores', 50, 'pets', 'all', 'balanced', 'daily', 'manual', '{}'),
('Clear the Table', 'Clear dishes after dinner', 'chores', 50, 'restaurant', 'all', 'balanced', 'daily', 'manual', '{}'),
('Make Your Bed', 'Make bed in the morning', 'chores', 40, 'bed', 'all', 'balanced', 'daily', 'manual', '{}'),
('Practice Instrument', '20 minutes of practice', 'learning', 80, 'piano', '8-11', 'balanced', 'daily', 'manual', '{}'),
('Help with Laundry', 'Fold and put away clothes', 'chores', 60, 'laundry', '8-11', 'balanced', 'weekly', 'manual', '{"days_of_week": [0, 6]}');

-- Learning Focused tasks (8 tasks)
INSERT INTO task_templates (name, description, category, points, icon, age_group, style, frequency, approval_type, settings) VALUES
('Read for 30 Minutes', 'Read any book for 30 minutes', 'learning', 100, 'menu_book', 'all', 'learning', 'daily', 'manual', '{}'),
('Math Practice', 'Complete 10 math problems', 'learning', 120, 'calculate', '8-11', 'learning', 'daily', 'manual', '{}'),
('Science Project Work', 'Work on science project', 'learning', 150, 'science', '8-11', 'learning', 'weekly', 'manual', '{}'),
('Write in Journal', 'Write at least one page', 'learning', 80, 'edit_note', '8-11', 'learning', 'daily', 'manual', '{}'),
('Learn New Vocabulary', 'Learn 5 new words', 'learning', 70, 'translate', 'all', 'learning', 'daily', 'manual', '{}'),
('Practice Typing', '15 minutes typing practice', 'learning', 60, 'keyboard', '8-11', 'learning', 'daily', 'auto', '{}'),
('Brain Teaser Challenge', 'Solve puzzles or brain teasers', 'learning', 90, 'psychology', 'all', 'learning', 'daily', 'manual', '{}'),
('Clean Study Space', 'Organize desk and materials', 'chores', 50, 'desk', 'all', 'learning', 'weekly', 'manual', '{}');

-- Seed reward templates
-- Screen rewards (all styles)
INSERT INTO reward_templates (name, description, category, points_cost, icon, age_group, style, screen_minutes, weekly_limit, settings) VALUES
('30 Minutes Screen Time', 'Watch TV or play games', 'screen', 150, 'tv', 'all', 'all', 30, 6, '{"color": "#3b82f6"}'),
('1 Hour Screen Time', 'Extended screen time', 'screen', 280, 'videogame_asset', 'all', 'all', 60, 3, '{"color": "#2563eb"}'),
('Weekend Movie Night', 'Pick and watch a movie', 'screen', 400, 'movie', 'all', 'all', 120, 2, '{"color": "#1e40af"}');

-- Autonomy rewards (all styles)
INSERT INTO reward_templates (name, description, category, points_cost, icon, age_group, style, weekly_limit, settings) VALUES
('Pick Tonight''s Dinner', 'Choose what family eats', 'autonomy', 200, 'restaurant_menu', 'all', 'all', 1, '{"color": "#f97316"}'),
('Pick Family Movie/Show', 'Choose what we watch together', 'autonomy', 80, 'movie', 'all', 'all', NULL, '{"color": "#ea580c"}');

-- Experience rewards (all styles)
INSERT INTO reward_templates (name, description, category, points_cost, icon, age_group, style, settings) VALUES
('Ice Cream Trip', 'Go out for ice cream', 'experience', 300, 'icecream', 'all', 'all', '{"color": "#ec4899"}'),
('Park Playdate', 'Invite friend to park', 'experience', 350, 'park', 'all', 'all', '{"color": "#db2777"}'),
('Movie Theater', 'See a movie in theater', 'experience', 600, 'local_movies', 'all', 'all', '{"color": "#be185d"}'),
('Mini Golf Outing', 'Family mini golf trip', 'experience', 500, 'golf_course', '8-11', 'all', '{"color": "#9f1239"}'),
('Museum Visit', 'Visit museum of choice', 'experience', 550, 'museum', '8-11', 'learning', '{"color": "#881337"}');

-- Savings rewards
INSERT INTO reward_templates (name, description, category, points_cost, icon, age_group, style, settings) VALUES
('Save Towards Game', 'Save for video game', 'savings', 800, 'sports_esports', '8-11', 'all', '{"color": "#0f766e"}'),
('Save to Bank', 'Transfer points to savings', 'savings', 150, 'piggybank', 'all', 'all', '{"color": "#14b8a6"}');

-- Item rewards (gift cards - locale specific)
INSERT INTO reward_templates (name, description, category, points_cost, icon, age_group, style, settings) VALUES
('$10 Gift Card', 'Redeem for a $10 gift card', 'item', 500, 'gift', 'all', 'all', '{"color": "#8b5cf6", "locale": "en-US"}'),
('$20 Gift Card', 'Redeem for a $20 gift card', 'item', 1000, 'gift', 'all', 'all', '{"color": "#7c3aed", "locale": "en-US"}'),
('$50 Gift Card', 'Redeem for a $50 gift card', 'item', 2500, 'gift', 'all', 'all', '{"color": "#6d28d9", "locale": "en-US"}'),
('₩10,000 기프트 카드', '₩10,000 기프트 카드로 교환', 'item', 500, 'gift', 'all', 'all', '{"color": "#8b5cf6", "locale": "ko-KR"}'),
('₩20,000 기프트 카드', '₩20,000 기프트 카드로 교환', 'item', 1000, 'gift', 'all', 'all', '{"color": "#7c3aed", "locale": "ko-KR"}'),
('₩50,000 기프트 카드', '₩50,000 기프트 카드로 교환', 'item', 2500, 'gift', 'all', 'all', '{"color": "#6d28d9", "locale": "ko-KR"}');

-- Comments
COMMENT ON TABLE task_templates IS 'Templates are used during onboarding to populate initial tasks based on age group and style';
COMMENT ON TABLE reward_templates IS 'Templates are used during onboarding to populate initial rewards based on age group and style';
