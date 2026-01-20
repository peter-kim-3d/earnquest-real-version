import {
  Gift,
  GameController,
  Television,
  FilmStrip,
  Pizza,
  IceCream,
  Cookie,
  Popcorn,
  ShoppingBag,
  TShirt,
  Sneaker,
  Backpack,
  Bicycle,
  Car,
  Airplane,
  Tent,
  Park,
  Ticket,
  Star,
  Crown,
  Heart,
  Sparkle,
  Trophy,
  Medal,
  CurrencyCircleDollar,
  PiggyBank,
  Wallet,
  HandCoins,
} from '@phosphor-icons/react/dist/ssr';
import type { IconProps } from '@phosphor-icons/react';

export interface RewardIcon {
  id: string;
  name: string;
  category: 'screen' | 'food' | 'shopping' | 'experience' | 'savings' | 'general';
  component: React.ComponentType<IconProps>;
}

export const REWARD_ICON_POOL: RewardIcon[] = [
  // Screen Time
  { id: 'game', name: 'Game', category: 'screen', component: GameController },
  { id: 'tv', name: 'TV', category: 'screen', component: Television },
  { id: 'movie', name: 'Movie', category: 'screen', component: FilmStrip },

  // Food & Treats
  { id: 'pizza', name: 'Pizza', category: 'food', component: Pizza },
  { id: 'icecream', name: 'Ice Cream', category: 'food', component: IceCream },
  { id: 'cookie', name: 'Cookie', category: 'food', component: Cookie },
  { id: 'popcorn', name: 'Popcorn', category: 'food', component: Popcorn },

  // Shopping
  { id: 'shopping', name: 'Shopping', category: 'shopping', component: ShoppingBag },
  { id: 'clothes', name: 'Clothes', category: 'shopping', component: TShirt },
  { id: 'shoes', name: 'Shoes', category: 'shopping', component: Sneaker },
  { id: 'backpack', name: 'Backpack', category: 'shopping', component: Backpack },

  // Experiences
  { id: 'bicycle', name: 'Bicycle', category: 'experience', component: Bicycle },
  { id: 'car', name: 'Car Ride', category: 'experience', component: Car },
  { id: 'airplane', name: 'Trip', category: 'experience', component: Airplane },
  { id: 'camping', name: 'Camping', category: 'experience', component: Tent },
  { id: 'park', name: 'Park', category: 'experience', component: Park },
  { id: 'ticket', name: 'Ticket', category: 'experience', component: Ticket },

  // Savings & Money
  { id: 'piggybank', name: 'Piggy Bank', category: 'savings', component: PiggyBank },
  { id: 'wallet', name: 'Wallet', category: 'savings', component: Wallet },
  { id: 'money', name: 'Money', category: 'savings', component: CurrencyCircleDollar },
  { id: 'coins', name: 'Coins', category: 'savings', component: HandCoins },

  // General
  { id: 'gift', name: 'Gift', category: 'general', component: Gift },
  { id: 'star', name: 'Star', category: 'general', component: Star },
  { id: 'crown', name: 'Crown', category: 'general', component: Crown },
  { id: 'heart', name: 'Heart', category: 'general', component: Heart },
  { id: 'sparkle', name: 'Sparkle', category: 'general', component: Sparkle },
  { id: 'trophy', name: 'Trophy', category: 'general', component: Trophy },
  { id: 'medal', name: 'Medal', category: 'general', component: Medal },
];

export const REWARD_ICON_CATEGORIES = [
  { id: 'screen', name: 'Screen Time' },
  { id: 'food', name: 'Food & Treats' },
  { id: 'shopping', name: 'Shopping' },
  { id: 'experience', name: 'Experiences' },
  { id: 'savings', name: 'Savings' },
  { id: 'general', name: 'General' },
] as const;

export function getRewardIconById(id: string): RewardIcon | undefined {
  return REWARD_ICON_POOL.find((icon) => icon.id === id);
}

export function getRewardIconsByCategory(category: string): RewardIcon[] {
  return REWARD_ICON_POOL.filter((icon) => icon.category === category);
}
