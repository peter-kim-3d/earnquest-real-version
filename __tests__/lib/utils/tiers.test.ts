/**
 * Tests for lib/utils/tiers.ts
 *
 * Tier System Utilities (V2.0)
 */

import { describe, it, expect } from 'vitest';
import {
  getTierForPoints,
  getTierRange,
  getTierLabel,
  getTierStars,
  getEffortStars,
  getNatureIcon,
  isWithinTierRange,
  getRecommendedRangeMessage,
  getPriceWarning,
  calculateEffortEquivalents,
  calculateWeeklyPercentage,
  estimateTimeToGoal,
  TIER_RANGES,
  TIER_LABELS,
  TIER_STARS,
  TIER_NATURE_ICONS,
  type Tier,
} from '@/lib/utils/tiers';

describe('Tier Constants', () => {
  it('should have correct tier ranges', () => {
    expect(TIER_RANGES.small).toEqual({ min: 100, max: 200 });
    expect(TIER_RANGES.medium).toEqual({ min: 200, max: 400 });
    expect(TIER_RANGES.large).toEqual({ min: 400, max: 1000 });
    expect(TIER_RANGES.xl).toEqual({ min: 1000, max: 3000 });
  });

  it('should have correct tier labels', () => {
    expect(TIER_LABELS.small).toBe('Small');
    expect(TIER_LABELS.medium).toBe('Medium');
    expect(TIER_LABELS.large).toBe('Large');
    expect(TIER_LABELS.xl).toBe('XL');
  });

  it('should have correct tier stars', () => {
    expect(TIER_STARS.small).toBe(1);
    expect(TIER_STARS.medium).toBe(2);
    expect(TIER_STARS.large).toBe(3);
    expect(TIER_STARS.xl).toBe(4);
  });

  it('should have correct nature icons', () => {
    expect(TIER_NATURE_ICONS.small).toBe('🌱');
    expect(TIER_NATURE_ICONS.medium).toBe('🌿');
    expect(TIER_NATURE_ICONS.large).toBe('🌳');
    expect(TIER_NATURE_ICONS.xl).toBe('🏔️');
  });
});

describe('getTierForPoints', () => {
  it('should return small tier for points <= 200', () => {
    expect(getTierForPoints(0)).toBe('small');
    expect(getTierForPoints(100)).toBe('small');
    expect(getTierForPoints(200)).toBe('small');
  });

  it('should return medium tier for points 201-400', () => {
    expect(getTierForPoints(201)).toBe('medium');
    expect(getTierForPoints(300)).toBe('medium');
    expect(getTierForPoints(400)).toBe('medium');
  });

  it('should return large tier for points 401-1000', () => {
    expect(getTierForPoints(401)).toBe('large');
    expect(getTierForPoints(700)).toBe('large');
    expect(getTierForPoints(1000)).toBe('large');
  });

  it('should return xl tier for points > 1000', () => {
    expect(getTierForPoints(1001)).toBe('xl');
    expect(getTierForPoints(2000)).toBe('xl');
    expect(getTierForPoints(5000)).toBe('xl');
  });

  it('should handle boundary values correctly', () => {
    expect(getTierForPoints(200)).toBe('small');
    expect(getTierForPoints(201)).toBe('medium');
    expect(getTierForPoints(400)).toBe('medium');
    expect(getTierForPoints(401)).toBe('large');
    expect(getTierForPoints(1000)).toBe('large');
    expect(getTierForPoints(1001)).toBe('xl');
  });
});

describe('getTierRange', () => {
  it('should return correct ranges for each tier', () => {
    expect(getTierRange('small')).toEqual({ min: 100, max: 200 });
    expect(getTierRange('medium')).toEqual({ min: 200, max: 400 });
    expect(getTierRange('large')).toEqual({ min: 400, max: 1000 });
    expect(getTierRange('xl')).toEqual({ min: 1000, max: 3000 });
  });
});

describe('getTierLabel', () => {
  it('should return correct labels for each tier', () => {
    expect(getTierLabel('small')).toBe('Small');
    expect(getTierLabel('medium')).toBe('Medium');
    expect(getTierLabel('large')).toBe('Large');
    expect(getTierLabel('xl')).toBe('XL');
  });
});

describe('getTierStars', () => {
  it('should return correct star counts for each tier', () => {
    expect(getTierStars('small')).toBe(1);
    expect(getTierStars('medium')).toBe(2);
    expect(getTierStars('large')).toBe(3);
    expect(getTierStars('xl')).toBe(4);
  });
});

describe('getEffortStars', () => {
  it('should return correct star strings for each tier', () => {
    expect(getEffortStars('small')).toBe('⭐');
    expect(getEffortStars('medium')).toBe('⭐⭐');
    expect(getEffortStars('large')).toBe('⭐⭐⭐');
    expect(getEffortStars('xl')).toBe('⭐⭐⭐⭐');
  });
});

describe('getNatureIcon', () => {
  it('should return correct nature icons for each tier', () => {
    expect(getNatureIcon('small')).toBe('🌱');
    expect(getNatureIcon('medium')).toBe('🌿');
    expect(getNatureIcon('large')).toBe('🌳');
    expect(getNatureIcon('xl')).toBe('🏔️');
  });
});

describe('isWithinTierRange', () => {
  it('should return true for points within tier range', () => {
    expect(isWithinTierRange(100, 'small')).toBe(true);
    expect(isWithinTierRange(150, 'small')).toBe(true);
    expect(isWithinTierRange(200, 'small')).toBe(true);
    expect(isWithinTierRange(300, 'medium')).toBe(true);
    expect(isWithinTierRange(700, 'large')).toBe(true);
    expect(isWithinTierRange(1500, 'xl')).toBe(true);
  });

  it('should return false for points outside tier range', () => {
    expect(isWithinTierRange(50, 'small')).toBe(false);
    expect(isWithinTierRange(250, 'small')).toBe(false);
    expect(isWithinTierRange(100, 'medium')).toBe(false);
    expect(isWithinTierRange(500, 'medium')).toBe(false);
    expect(isWithinTierRange(300, 'large')).toBe(false);
    expect(isWithinTierRange(500, 'xl')).toBe(false);
  });
});

describe('getRecommendedRangeMessage', () => {
  it('should return correct messages for each tier', () => {
    expect(getRecommendedRangeMessage('small')).toBe('Recommended: 100-200 XP');
    expect(getRecommendedRangeMessage('medium')).toBe('Recommended: 200-400 XP');
    expect(getRecommendedRangeMessage('large')).toBe('Recommended: 400-1000 XP');
    expect(getRecommendedRangeMessage('xl')).toBe('Recommended: 1000-3000 XP');
  });
});

describe('getPriceWarning', () => {
  it('should return null when price is within range', () => {
    expect(getPriceWarning(150, 'small')).toBeNull();
    expect(getPriceWarning(300, 'medium')).toBeNull();
    expect(getPriceWarning(700, 'large')).toBeNull();
    expect(getPriceWarning(2000, 'xl')).toBeNull();
  });

  it('should return warning when price is below range', () => {
    const warning = getPriceWarning(50, 'small');
    expect(warning).not.toBeNull();
    expect(warning?.hasWarning).toBe(true);
    expect(warning?.message).toContain('below recommended range');
    expect(warning?.message).toContain('Small');
    expect(warning?.message).toContain('100-200 XP');
  });

  it('should return warning when price is above range', () => {
    const warning = getPriceWarning(250, 'small');
    expect(warning).not.toBeNull();
    expect(warning?.hasWarning).toBe(true);
    expect(warning?.message).toContain('above recommended range');
    expect(warning?.message).toContain('Small');
    expect(warning?.message).toContain('100-200 XP');
  });
});

describe('calculateEffortEquivalents', () => {
  it('should calculate with default values', () => {
    const result = calculateEffortEquivalents(200);
    expect(result.dailyRoutines).toBe('~2 daily routines');
    expect(result.specialMissions).toBe('~1 special missions');
  });

  it('should calculate with custom daily task points', () => {
    const result = calculateEffortEquivalents(300, 50);
    expect(result.dailyRoutines).toBe('~6 daily routines');
  });

  it('should calculate with custom special task points', () => {
    const result = calculateEffortEquivalents(600, 100, 300);
    expect(result.specialMissions).toBe('~2 special missions');
  });

  it('should round to nearest whole number', () => {
    const result = calculateEffortEquivalents(150);
    expect(result.dailyRoutines).toBe('~2 daily routines');
    expect(result.specialMissions).toBe('~1 special missions');
  });
});

describe('calculateWeeklyPercentage', () => {
  it('should calculate percentage correctly', () => {
    expect(calculateWeeklyPercentage(100, 1000)).toBe('~10% of weekly earnings');
    expect(calculateWeeklyPercentage(500, 1000)).toBe('~50% of weekly earnings');
    expect(calculateWeeklyPercentage(1000, 1000)).toBe('~100% of weekly earnings');
  });

  it('should return N/A for zero or negative weekly earnings', () => {
    expect(calculateWeeklyPercentage(100, 0)).toBe('N/A');
    expect(calculateWeeklyPercentage(100, -100)).toBe('N/A');
  });

  it('should round to nearest whole percentage', () => {
    expect(calculateWeeklyPercentage(333, 1000)).toBe('~33% of weekly earnings');
  });
});

describe('estimateTimeToGoal', () => {
  it('should return "Ready to complete!" when current >= target', () => {
    expect(estimateTimeToGoal(100, 100, 200)).toBe('Ready to complete!');
    expect(estimateTimeToGoal(100, 150, 200)).toBe('Ready to complete!');
  });

  it('should return "Unable to estimate" for zero or negative weekly earnings', () => {
    expect(estimateTimeToGoal(1000, 0, 0)).toBe('Unable to estimate');
    expect(estimateTimeToGoal(1000, 0, -100)).toBe('Unable to estimate');
  });

  it('should return "Less than a week" for < 1 week', () => {
    expect(estimateTimeToGoal(700, 0, 1000)).toBe('Less than a week');
  });

  it('should return "About 1 week" for 1-2 weeks', () => {
    expect(estimateTimeToGoal(1000, 0, 700)).toBe('About 1 week');
  });

  it('should return week estimate for 2-4 weeks', () => {
    expect(estimateTimeToGoal(2100, 0, 700)).toBe('About 3 weeks');
  });

  it('should return "About 1 month" for 4-8 weeks', () => {
    expect(estimateTimeToGoal(4900, 0, 700)).toBe('About 1 month');
  });

  it('should return month estimate for > 8 weeks', () => {
    expect(estimateTimeToGoal(14000, 0, 700)).toBe('About 5 months');
  });
});
