// Default task images stored in public/images/tasks

export interface DefaultTaskImage {
  id: string;
  name: string;
  category: 'learning' | 'life' | 'health';
  timeContext: 'morning' | 'after_school' | 'evening' | 'anytime';
  url: string;
}

export const DEFAULT_TASK_IMAGES: DefaultTaskImage[] = [
  // Learning tasks
  { id: 'homework', name: 'Homework', category: 'learning', timeContext: 'anytime', url: '/images/tasks/homework.png' },
  { id: 'reading', name: 'Reading', category: 'learning', timeContext: 'anytime', url: '/images/tasks/reading.png' },
  { id: 'study_session', name: 'Study Session', category: 'learning', timeContext: 'anytime', url: '/images/tasks/study_session.png' },
  { id: 'practice_instrument', name: 'Practice Instrument', category: 'learning', timeContext: 'anytime', url: '/images/tasks/practice_instrument.png' },
  { id: 'check_planner', name: 'Check Planner', category: 'learning', timeContext: 'after_school', url: '/images/tasks/check_planner.png' },
  { id: 'writing', name: 'Writing Practice', category: 'learning', timeContext: 'anytime', url: '/images/tasks/writing.png' },
  { id: 'art', name: 'Art/Craft', category: 'learning', timeContext: 'anytime', url: '/images/tasks/art.png' },

  // Life/Household tasks
  { id: 'wake_on_time', name: 'Wake Up On Time', category: 'life', timeContext: 'morning', url: '/images/tasks/wake_on_time.png' },
  { id: 'make_bed', name: 'Make Bed', category: 'life', timeContext: 'morning', url: '/images/tasks/make_bed.png' },
  { id: 'get_dressed', name: 'Get Dressed', category: 'life', timeContext: 'morning', url: '/images/tasks/get_dressed.png' },
  { id: 'shoes_tidy', name: 'Tidy Shoes', category: 'life', timeContext: 'after_school', url: '/images/tasks/shoes_tidy.png' },
  { id: 'backpack', name: 'Backpack', category: 'life', timeContext: 'after_school', url: '/images/tasks/backpack.png' },
  { id: 'lunchbox_sink', name: 'Lunchbox to Sink', category: 'life', timeContext: 'after_school', url: '/images/tasks/lunchbox_sink.png' },
  { id: 'clear_dishes', name: 'Clear Dishes', category: 'life', timeContext: 'after_school', url: '/images/tasks/clear_dishes.png' },
  { id: 'feed_pet', name: 'Feed Pet', category: 'life', timeContext: 'anytime', url: '/images/tasks/feed_pet.png' },
  { id: 'pick_up_toys', name: 'Pick Up Toys', category: 'life', timeContext: 'evening', url: '/images/tasks/pick_up_toys.png' },
  { id: 'prep_tomorrow', name: 'Prep for Tomorrow', category: 'life', timeContext: 'evening', url: '/images/tasks/prep_tomorrow.png' },
  { id: 'clean_desk', name: 'Clean Desk', category: 'life', timeContext: 'anytime', url: '/images/tasks/clean_desk.png' },
  { id: 'laundry', name: 'Laundry', category: 'life', timeContext: 'anytime', url: '/images/tasks/laundry.png' },

  // Health tasks
  { id: 'brush_teeth', name: 'Brush Teeth', category: 'health', timeContext: 'morning', url: '/images/tasks/brush_teeth.png' },
  { id: 'wash_hands', name: 'Wash Hands', category: 'health', timeContext: 'after_school', url: '/images/tasks/wash_hands.png' },
  { id: 'shower', name: 'Take Shower', category: 'health', timeContext: 'evening', url: '/images/tasks/shower.png' },
  { id: 'exercise', name: 'Exercise', category: 'health', timeContext: 'anytime', url: '/images/tasks/exercise.png' },
  { id: 'outdoor', name: 'Outdoor Play', category: 'health', timeContext: 'anytime', url: '/images/tasks/outdoor.png' },
];

export const DEFAULT_TASK_IMAGE_CATEGORIES = [
  { id: 'learning', name: 'Learning' },
  { id: 'life', name: 'Life' },
  { id: 'health', name: 'Health' },
] as const;

export function getDefaultTaskImagesByCategory(category: string): DefaultTaskImage[] {
  return DEFAULT_TASK_IMAGES.filter((img) => img.category === category);
}
