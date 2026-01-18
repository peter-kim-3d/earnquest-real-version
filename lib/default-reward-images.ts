// Default reward images stored in Supabase Storage

const SUPABASE_STORAGE_URL = 'https://blstphkvdrrhtdxrllvx.supabase.co/storage/v1/object/public/reward-images/defaults';

export interface DefaultRewardImage {
  id: string;
  name: string;
  category: 'screen' | 'food' | 'shopping' | 'experience' | 'savings' | 'general';
  url: string;
}

export const DEFAULT_REWARD_IMAGES: DefaultRewardImage[] = [
  // Screen Time
  { id: 'game_time', name: 'Game Time', category: 'screen', url: `${SUPABASE_STORAGE_URL}/game_time.png` },
  { id: 'tv_time', name: 'TV Time', category: 'screen', url: `${SUPABASE_STORAGE_URL}/tv_time.png` },
  { id: 'movie_night', name: 'Movie Night', category: 'screen', url: `${SUPABASE_STORAGE_URL}/movie_night.png` },

  // Food & Treats
  { id: 'pizza_treat', name: 'Pizza', category: 'food', url: `${SUPABASE_STORAGE_URL}/pizza_treat.png` },
  { id: 'ice_cream', name: 'Ice Cream', category: 'food', url: `${SUPABASE_STORAGE_URL}/ice_cream.png` },
  { id: 'cookie_treat', name: 'Cookie', category: 'food', url: `${SUPABASE_STORAGE_URL}/cookie_treat.png` },
  { id: 'popcorn_treat', name: 'Popcorn', category: 'food', url: `${SUPABASE_STORAGE_URL}/popcorn_treat.png` },

  // Shopping
  { id: 'shopping_spree', name: 'Shopping', category: 'shopping', url: `${SUPABASE_STORAGE_URL}/shopping_spree.png` },
  { id: 'new_clothes', name: 'New Clothes', category: 'shopping', url: `${SUPABASE_STORAGE_URL}/new_clothes.png` },
  { id: 'new_shoes', name: 'New Shoes', category: 'shopping', url: `${SUPABASE_STORAGE_URL}/new_shoes.png` },
  { id: 'new_backpack', name: 'Backpack', category: 'shopping', url: `${SUPABASE_STORAGE_URL}/new_backpack.png` },
  { id: 'gift_card', name: 'Gift Card', category: 'shopping', url: `${SUPABASE_STORAGE_URL}/gift_card.png` },

  // Experiences
  { id: 'bike_ride', name: 'Bike Ride', category: 'experience', url: `${SUPABASE_STORAGE_URL}/bike_ride.png` },
  { id: 'car_trip', name: 'Car Trip', category: 'experience', url: `${SUPABASE_STORAGE_URL}/car_trip.png` },
  { id: 'airplane_trip', name: 'Trip', category: 'experience', url: `${SUPABASE_STORAGE_URL}/airplane_trip.png` },
  { id: 'camping_trip', name: 'Camping', category: 'experience', url: `${SUPABASE_STORAGE_URL}/camping_trip.png` },
  { id: 'park_visit', name: 'Park', category: 'experience', url: `${SUPABASE_STORAGE_URL}/park_visit.png` },
  { id: 'event_ticket', name: 'Event Ticket', category: 'experience', url: `${SUPABASE_STORAGE_URL}/event_ticket.png` },
  { id: 'family_movie', name: 'Family Movie', category: 'experience', url: `${SUPABASE_STORAGE_URL}/movie_night.png` },

  // Savings
  { id: 'piggy_bank', name: 'Piggy Bank', category: 'savings', url: `${SUPABASE_STORAGE_URL}/piggy_bank.png` },
  { id: 'wallet_money', name: 'Wallet', category: 'savings', url: `${SUPABASE_STORAGE_URL}/wallet_money.png` },
  { id: 'coin_jar', name: 'Coin Jar', category: 'savings', url: `${SUPABASE_STORAGE_URL}/coin_jar.png` },
  { id: 'save_to_bank', name: 'Save to Bank', category: 'savings', url: `${SUPABASE_STORAGE_URL}/piggy_bank.png` },

  // General
  { id: 'gift_reward', name: 'Gift', category: 'general', url: `${SUPABASE_STORAGE_URL}/gift_reward.png` },
  { id: 'star_reward', name: 'Star', category: 'general', url: `${SUPABASE_STORAGE_URL}/star_reward.png` },
  { id: 'crown_reward', name: 'Crown', category: 'general', url: `${SUPABASE_STORAGE_URL}/crown_reward.png` },
  { id: 'trophy_reward', name: 'Trophy', category: 'general', url: `${SUPABASE_STORAGE_URL}/trophy_reward.png` },
];

export const DEFAULT_REWARD_IMAGE_CATEGORIES = [
  { id: 'screen', name: 'Screen Time' },
  { id: 'food', name: 'Food & Treats' },
  { id: 'shopping', name: 'Shopping' },
  { id: 'experience', name: 'Experiences' },
  { id: 'savings', name: 'Savings' },
  { id: 'general', name: 'General' },
] as const;

export function getDefaultRewardImagesByCategory(category: string): DefaultRewardImage[] {
  return DEFAULT_REWARD_IMAGES.filter((img) => img.category === category);
}
