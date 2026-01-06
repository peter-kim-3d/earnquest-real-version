-- Seed task templates (English)
INSERT INTO task_templates (category, age_group, name_key, name_default, description_key, default_points, default_approval_type, icon, sort_order) VALUES
  ('learning', '8-11', 'task.homework', 'Complete homework', 'task.homework_desc', 50, 'parent', '📚', 1),
  ('learning', '8-11', 'task.reading', 'Read for 30 minutes', 'task.reading_desc', 30, 'timer', '📖', 2),
  ('learning', '8-11', 'task.practice_instrument', 'Practice instrument', 'task.practice_instrument_desc', 40, 'timer', '🎵', 3),

  ('life', '8-11', 'task.clean_room', 'Clean room', 'task.clean_room_desc', 30, 'parent', '🧹', 10),
  ('life', '8-11', 'task.make_bed', 'Make bed', 'task.make_bed_desc', 10, 'auto', '🛏️', 11),
  ('life', '8-11', 'task.dishes', 'Help with dishes', 'task.dishes_desc', 20, 'parent', '🍽️', 12),
  ('life', '8-11', 'task.laundry', 'Put away laundry', 'task.laundry_desc', 15, 'checklist', '👕', 13),

  ('health', '8-11', 'task.exercise', 'Exercise for 30 min', 'task.exercise_desc', 40, 'timer', '🏃', 20),
  ('health', '8-11', 'task.brush_teeth', 'Brush teeth (morning)', 'task.brush_teeth_desc', 5, 'auto', '🦷', 21),
  ('health', '8-11', 'task.vegetables', 'Eat vegetables', 'task.vegetables_desc', 10, 'parent', '🥦', 22),

  ('creativity', '8-11', 'task.draw', 'Draw or paint', 'task.draw_desc', 20, 'timer', '🎨', 30),
  ('creativity', '8-11', 'task.write_story', 'Write a story', 'task.write_story_desc', 30, 'parent', '✍️', 31);

-- Seed reward templates (English)
INSERT INTO reward_templates (category, age_group, name_key, name_default, description_key, description_default, default_points, is_screen_reward, screen_minutes, icon, sort_order) VALUES
  ('screen', '8-11', 'reward.screen_30', '30 min screen time', 'reward.screen_30_desc', 'Enjoy 30 minutes of your favorite show or game', 50, true, 30, '📱', 1),
  ('screen', '8-11', 'reward.screen_60', '1 hour screen time', 'reward.screen_60_desc', 'Enjoy 1 hour of your favorite show or game', 90, true, 60, '📺', 2),

  ('experience', '8-11', 'reward.park', 'Trip to the park', 'reward.park_desc', 'Special trip to your favorite park', 100, false, null, '🏞️', 10),
  ('experience', '8-11', 'reward.ice_cream', 'Ice cream outing', 'reward.ice_cream_desc', 'Choose your favorite ice cream flavor', 80, false, null, '🍦', 11),
  ('experience', '8-11', 'reward.movie', 'Movie night', 'reward.movie_desc', 'Family movie night with popcorn', 120, false, null, '🎬', 12),

  ('autonomy', '8-11', 'reward.late_bedtime', '30 min later bedtime', 'reward.late_bedtime_desc', 'Stay up 30 minutes later tonight', 60, false, null, '🌙', 20),
  ('autonomy', '8-11', 'reward.choose_dinner', 'Choose dinner', 'reward.choose_dinner_desc', 'Pick what we eat for dinner', 70, false, null, '🍕', 21),
  ('autonomy', '8-11', 'reward.sleepover', 'Sleepover with friend', 'reward.sleepover_desc', 'Invite a friend for a sleepover', 200, false, null, '🏠', 22),

  ('item', '8-11', 'reward.small_toy', 'Small toy or book', 'reward.small_toy_desc', 'Choose a small toy or book ($10-15)', 150, false, null, '🎁', 30),
  ('item', '8-11', 'reward.medium_toy', 'Medium toy or game', 'reward.medium_toy_desc', 'Choose a medium toy or game ($20-30)', 300, false, null, '🎮', 31);

-- Add default family values (optional, families can customize)
-- Note: These will be copied when a family is created, not inserted directly
-- This is just for reference
COMMENT ON TABLE family_values IS 'Default family values (No-Point Zone): Greeting family members, Being honest, Saying please and thank you, Helping without being asked, Being kind to siblings';
