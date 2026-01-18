/**
 * Category color mappings for tasks and rewards.
 * Extracted from duplicate implementations across components.
 */

export type TaskCategory =
  | 'hygiene'
  | 'health'
  | 'chores'
  | 'life'
  | 'learning'
  | 'exercise'
  | 'creativity';

export type RewardCategory =
  | 'screen'
  | 'autonomy'
  | 'instant'
  | 'experience'
  | 'approval_required'
  | 'savings'
  | 'other';

/**
 * Task category gradient classes.
 */
export const TASK_CATEGORY_COLORS: Record<string, string> = {
  hygiene: 'from-blue-500 to-cyan-500',
  health: 'from-blue-500 to-cyan-500',
  chores: 'from-orange-500 to-amber-500',
  life: 'from-orange-500 to-amber-500',
  learning: 'from-purple-500 to-pink-500',
  exercise: 'from-red-500 to-orange-500',
  creativity: 'from-pink-500 to-rose-500',
};

/**
 * Reward category gradient classes.
 */
export const REWARD_CATEGORY_COLORS: Record<string, string> = {
  screen: 'from-blue-500 to-blue-600',
  autonomy: 'from-orange-500 to-orange-600',
  instant: 'from-orange-500 to-orange-600',
  experience: 'from-pink-500 to-red-500',
  approval_required: 'from-pink-500 to-red-500',
  savings: 'from-teal-500 to-teal-600',
  other: 'from-gray-500 to-gray-600',
};

/**
 * Get gradient class for a task category.
 *
 * @param category - Task category
 * @param customColor - Optional custom color that takes precedence
 * @returns Tailwind gradient class or empty string if custom color provided
 */
export function getTaskCategoryGradient(
  category: string,
  customColor?: string | null
): string {
  if (customColor) return '';
  return TASK_CATEGORY_COLORS[category] || 'from-gray-500 to-gray-600';
}

/**
 * Get gradient class for a reward category.
 *
 * @param category - Reward category
 * @param customColor - Optional custom color that takes precedence
 * @returns Tailwind gradient class or empty string if custom color provided
 */
export function getRewardCategoryGradient(
  category: string,
  customColor?: string | null
): string {
  if (customColor) return '';
  return REWARD_CATEGORY_COLORS[category] || 'from-gray-500 to-gray-600';
}

/**
 * Category badge colors for EffortBadge component.
 */
export const CATEGORY_BADGE_COLORS: Record<string, string> = {
  // Task categories
  hygiene: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  health: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  chores: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  life: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  learning: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  exercise: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  creativity: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  // Reward categories
  screen: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  autonomy: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  instant: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  experience: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  approval_required: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  savings: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

/**
 * Get badge color class for a category.
 */
export function getCategoryBadgeColor(category: string): string {
  return (
    CATEGORY_BADGE_COLORS[category] ||
    'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
  );
}
