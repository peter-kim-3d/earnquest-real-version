/**
 * Tier System Utilities (V2.0)
 *
 * Defines effort tiers for rewards and goals
 * Small: 100-200 points (easy)
 * Medium: 200-400 points (moderate)
 * Large: 400-1000 points (significant)
 * XL: 1000+ points (major)
 *
 * Note: Points doubled from v1.1 to v2.0
 * Expected daily earnings: ~200-240 pts
 */

export type Tier = 'small' | 'medium' | 'large' | 'xl';

export interface TierRange {
  min: number;
  max: number;
}

export const TIER_RANGES: Record<Tier, TierRange> = {
  small: { min: 100, max: 200 },
  medium: { min: 200, max: 400 },
  large: { min: 400, max: 1000 },
  xl: { min: 1000, max: 3000 },
};

export const TIER_LABELS: Record<Tier, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  xl: 'XL',
};

// Star-based effort badges
export const TIER_STARS: Record<Tier, number> = {
  small: 1,
  medium: 2,
  large: 3,
  xl: 4,
};

// Nature-based effort badges (alternative)
export const TIER_NATURE_ICONS: Record<Tier, string> = {
  small: '🌱',
  medium: '🌿',
  large: '🌳',
  xl: '🏔️',
};

/**
 * Calculate tier based on point cost (v2.0 doubled values)
 */
export function getTierForPoints(points: number): Tier {
  if (points <= 200) return 'small';
  if (points <= 400) return 'medium';
  if (points <= 1000) return 'large';
  return 'xl';
}

/**
 * Get the point range for a tier
 */
export function getTierRange(tier: Tier): TierRange {
  return TIER_RANGES[tier];
}

/**
 * Get human-readable label for tier
 */
export function getTierLabel(tier: Tier): string {
  return TIER_LABELS[tier];
}

/**
 * Get star count for tier (1-4)
 */
export function getTierStars(tier: Tier): number {
  return TIER_STARS[tier];
}

/**
 * Get star string (⭐⭐⭐)
 */
export function getEffortStars(tier: Tier): string {
  const stars = TIER_STARS[tier];
  return '⭐'.repeat(stars);
}

/**
 * Get nature icon for tier
 */
export function getNatureIcon(tier: Tier): string {
  return TIER_NATURE_ICONS[tier];
}

/**
 * Check if a point value is within the recommended range for a tier
 */
export function isWithinTierRange(points: number, tier: Tier): boolean {
  const range = TIER_RANGES[tier];
  return points >= range.min && points <= range.max;
}

/**
 * Get recommended price range message
 */
export function getRecommendedRangeMessage(tier: Tier): string {
  const range = TIER_RANGES[tier];
  return `Recommended: ${range.min}-${range.max} XP`;
}

/**
 * Check if price is outside recommended range and return warning
 */
export function getPriceWarning(
  points: number,
  tier: Tier
): { hasWarning: boolean; message: string } | null {
  const range = TIER_RANGES[tier];

  if (points < range.min) {
    return {
      hasWarning: true,
      message: `Price is below recommended range for ${getTierLabel(tier)} tier (${range.min}-${range.max} XP)`,
    };
  }

  if (points > range.max) {
    return {
      hasWarning: true,
      message: `Price is above recommended range for ${getTierLabel(tier)} tier (${range.min}-${range.max} XP)`,
    };
  }

  return null;
}

/**
 * Calculate effort equivalents for parent context (v2.0 doubled values)
 */
export function calculateEffortEquivalents(
  points: number,
  averageDailyTaskPoints: number = 100,
  averageSpecialTaskPoints: number = 200
): {
  dailyRoutines: string;
  specialMissions: string;
} {
  const dailyCount = points / averageDailyTaskPoints;
  const specialCount = points / averageSpecialTaskPoints;

  return {
    dailyRoutines: `~${Math.round(dailyCount)} daily routines`,
    specialMissions: `~${Math.round(specialCount)} special missions`,
  };
}

/**
 * Calculate percentage of weekly earnings
 */
export function calculateWeeklyPercentage(
  points: number,
  weeklyEarnings: number
): string {
  if (weeklyEarnings <= 0) return 'N/A';
  const percentage = (points / weeklyEarnings) * 100;
  return `~${Math.round(percentage)}% of weekly earnings`;
}

/**
 * Estimate time to achieve goal
 */
export function estimateTimeToGoal(
  targetPoints: number,
  currentPoints: number,
  weeklyEarnings: number
): string {
  if (weeklyEarnings <= 0) return 'Unable to estimate';

  const remaining = targetPoints - currentPoints;
  if (remaining <= 0) return 'Ready to complete!';

  const weeks = remaining / weeklyEarnings;

  if (weeks < 1) return 'Less than a week';
  if (weeks < 2) return 'About 1 week';
  if (weeks < 4) return `About ${Math.round(weeks)} weeks`;
  if (weeks < 8) return 'About 1 month';
  return `About ${Math.round(weeks / 4)} months`;
}
