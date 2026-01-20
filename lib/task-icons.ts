import {
  BookOpen,
  Pencil,
  Student,
  Calculator,
  House,
  Broom,
  Bed,
  ForkKnife,
  TShirt,
  Heart,
  Barbell,
  Tooth,
  AppleLogo,
  Star,
  CheckCircle,
  Trophy,
  Target,
  Dog,
  MusicNotes,
  GameController,
  Backpack,
  Flower,
  Sun,
  Moon,
  Lightning,
  Sparkle,
  Gift,
  Pizza,
} from '@phosphor-icons/react/dist/ssr';
import type { IconProps } from '@phosphor-icons/react';

export interface TaskIcon {
  id: string;
  name: string;
  category: 'learning' | 'household' | 'health' | 'general';
  component: React.ComponentType<IconProps>;
}

export const TASK_ICON_POOL: TaskIcon[] = [
  // Learning
  { id: 'book', name: 'Book', category: 'learning', component: BookOpen },
  { id: 'pencil', name: 'Pencil', category: 'learning', component: Pencil },
  { id: 'student', name: 'Student', category: 'learning', component: Student },
  { id: 'calculator', name: 'Calculator', category: 'learning', component: Calculator },
  { id: 'backpack', name: 'Backpack', category: 'learning', component: Backpack },

  // Household
  { id: 'home', name: 'Home', category: 'household', component: House },
  { id: 'broom', name: 'Broom', category: 'household', component: Broom },
  { id: 'bed', name: 'Bed', category: 'household', component: Bed },
  { id: 'dish', name: 'Dishes', category: 'household', component: ForkKnife },
  { id: 'laundry', name: 'Laundry', category: 'household', component: TShirt },
  { id: 'flower', name: 'Plants', category: 'household', component: Flower },
  { id: 'pet', name: 'Pet', category: 'household', component: Dog },

  // Health
  { id: 'heart', name: 'Heart', category: 'health', component: Heart },
  { id: 'exercise', name: 'Exercise', category: 'health', component: Barbell },
  { id: 'tooth', name: 'Tooth', category: 'health', component: Tooth },
  { id: 'apple', name: 'Apple', category: 'health', component: AppleLogo },
  { id: 'sun', name: 'Morning', category: 'health', component: Sun },
  { id: 'moon', name: 'Night', category: 'health', component: Moon },

  // General
  { id: 'star', name: 'Star', category: 'general', component: Star },
  { id: 'check', name: 'Check', category: 'general', component: CheckCircle },
  { id: 'trophy', name: 'Trophy', category: 'general', component: Trophy },
  { id: 'target', name: 'Target', category: 'general', component: Target },
  { id: 'sparkle', name: 'Sparkle', category: 'general', component: Sparkle },
  { id: 'lightning', name: 'Lightning', category: 'general', component: Lightning },
  { id: 'music', name: 'Music', category: 'general', component: MusicNotes },
  { id: 'game', name: 'Game', category: 'general', component: GameController },
  { id: 'gift', name: 'Gift', category: 'general', component: Gift },
  { id: 'pizza', name: 'Food', category: 'general', component: Pizza },
];

export const ICON_CATEGORIES = [
  { id: 'learning', name: 'Learning' },
  { id: 'household', name: 'Household' },
  { id: 'health', name: 'Health' },
  { id: 'general', name: 'General' },
] as const;

export function getIconById(id: string): TaskIcon | undefined {
  return TASK_ICON_POOL.find((icon) => icon.id === id);
}

export function getIconsByCategory(category: string): TaskIcon[] {
  return TASK_ICON_POOL.filter((icon) => icon.category === category);
}
