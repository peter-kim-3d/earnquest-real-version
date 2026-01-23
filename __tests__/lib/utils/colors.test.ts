/**
 * Tests for lib/utils/colors.ts
 *
 * Category color mappings for tasks and rewards
 */

import { describe, it, expect } from 'vitest';
import {
  TASK_CATEGORY_COLORS,
  REWARD_CATEGORY_COLORS,
  CATEGORY_BADGE_COLORS,
  getTaskCategoryGradient,
  getRewardCategoryGradient,
  getCategoryBadgeColor,
} from '@/lib/utils/colors';

describe('TASK_CATEGORY_COLORS', () => {
  it('should have correct gradient classes for task categories', () => {
    expect(TASK_CATEGORY_COLORS.hygiene).toBe('from-blue-500 to-cyan-500');
    expect(TASK_CATEGORY_COLORS.health).toBe('from-blue-500 to-cyan-500');
    expect(TASK_CATEGORY_COLORS.chores).toBe('from-orange-500 to-amber-500');
    expect(TASK_CATEGORY_COLORS.life).toBe('from-orange-500 to-amber-500');
    expect(TASK_CATEGORY_COLORS.learning).toBe('from-purple-500 to-pink-500');
    expect(TASK_CATEGORY_COLORS.exercise).toBe('from-red-500 to-orange-500');
    expect(TASK_CATEGORY_COLORS.creativity).toBe('from-pink-500 to-rose-500');
  });
});

describe('REWARD_CATEGORY_COLORS', () => {
  it('should have correct gradient classes for reward categories', () => {
    expect(REWARD_CATEGORY_COLORS.screen).toBe('from-blue-500 to-blue-600');
    expect(REWARD_CATEGORY_COLORS.autonomy).toBe('from-orange-500 to-orange-600');
    expect(REWARD_CATEGORY_COLORS.instant).toBe('from-orange-500 to-orange-600');
    expect(REWARD_CATEGORY_COLORS.experience).toBe('from-pink-500 to-red-500');
    expect(REWARD_CATEGORY_COLORS.approval_required).toBe('from-pink-500 to-red-500');
    expect(REWARD_CATEGORY_COLORS.savings).toBe('from-teal-500 to-teal-600');
    expect(REWARD_CATEGORY_COLORS.other).toBe('from-gray-500 to-gray-600');
  });
});

describe('getTaskCategoryGradient', () => {
  it('should return correct gradient for known categories', () => {
    expect(getTaskCategoryGradient('hygiene')).toBe('from-blue-500 to-cyan-500');
    expect(getTaskCategoryGradient('learning')).toBe('from-purple-500 to-pink-500');
    expect(getTaskCategoryGradient('life')).toBe('from-orange-500 to-amber-500');
  });

  it('should return default gradient for unknown categories', () => {
    expect(getTaskCategoryGradient('unknown')).toBe('from-gray-500 to-gray-600');
    expect(getTaskCategoryGradient('')).toBe('from-gray-500 to-gray-600');
  });

  it('should return empty string when custom color is provided', () => {
    expect(getTaskCategoryGradient('hygiene', '#ff0000')).toBe('');
    expect(getTaskCategoryGradient('learning', 'red')).toBe('');
  });

  it('should return gradient when custom color is null', () => {
    expect(getTaskCategoryGradient('hygiene', null)).toBe('from-blue-500 to-cyan-500');
  });

  it('should return gradient when custom color is undefined', () => {
    expect(getTaskCategoryGradient('hygiene', undefined)).toBe('from-blue-500 to-cyan-500');
  });
});

describe('getRewardCategoryGradient', () => {
  it('should return correct gradient for known categories', () => {
    expect(getRewardCategoryGradient('screen')).toBe('from-blue-500 to-blue-600');
    expect(getRewardCategoryGradient('experience')).toBe('from-pink-500 to-red-500');
    expect(getRewardCategoryGradient('savings')).toBe('from-teal-500 to-teal-600');
  });

  it('should return default gradient for unknown categories', () => {
    expect(getRewardCategoryGradient('unknown')).toBe('from-gray-500 to-gray-600');
    expect(getRewardCategoryGradient('')).toBe('from-gray-500 to-gray-600');
  });

  it('should return empty string when custom color is provided', () => {
    expect(getRewardCategoryGradient('screen', '#ff0000')).toBe('');
    expect(getRewardCategoryGradient('savings', 'green')).toBe('');
  });

  it('should return gradient when custom color is null', () => {
    expect(getRewardCategoryGradient('screen', null)).toBe('from-blue-500 to-blue-600');
  });
});

describe('CATEGORY_BADGE_COLORS', () => {
  it('should have correct badge colors for task categories', () => {
    expect(CATEGORY_BADGE_COLORS.hygiene).toContain('bg-blue-100');
    expect(CATEGORY_BADGE_COLORS.learning).toContain('bg-purple-100');
    expect(CATEGORY_BADGE_COLORS.life).toContain('bg-orange-100');
    expect(CATEGORY_BADGE_COLORS.exercise).toContain('bg-red-100');
  });

  it('should have correct badge colors for reward categories', () => {
    expect(CATEGORY_BADGE_COLORS.screen).toContain('bg-blue-100');
    expect(CATEGORY_BADGE_COLORS.experience).toContain('bg-pink-100');
    expect(CATEGORY_BADGE_COLORS.savings).toContain('bg-teal-100');
    expect(CATEGORY_BADGE_COLORS.other).toContain('bg-gray-100');
  });

  it('should include dark mode classes', () => {
    expect(CATEGORY_BADGE_COLORS.learning).toContain('dark:bg-purple-900/30');
    expect(CATEGORY_BADGE_COLORS.savings).toContain('dark:text-teal-300');
  });
});

describe('getCategoryBadgeColor', () => {
  it('should return correct badge color for known categories', () => {
    expect(getCategoryBadgeColor('hygiene')).toContain('bg-blue-100');
    expect(getCategoryBadgeColor('learning')).toContain('bg-purple-100');
    expect(getCategoryBadgeColor('screen')).toContain('bg-blue-100');
  });

  it('should return default badge color for unknown categories', () => {
    const defaultColor = getCategoryBadgeColor('unknown');
    expect(defaultColor).toContain('bg-gray-100');
    expect(defaultColor).toContain('text-gray-700');
    expect(defaultColor).toContain('dark:bg-gray-900/30');
  });
});
