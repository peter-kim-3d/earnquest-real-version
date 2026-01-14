'use client';

import { Star } from '@phosphor-icons/react';
import { Tier, getTierStars, getTierLabel, getNatureIcon } from '@/lib/utils/tiers';

interface EffortBadgeProps {
  tier: Tier;
  variant?: 'stars' | 'nature' | 'both';
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * EffortBadge Component
 *
 * Displays effort level using stars or nature icons
 * Used in reward cards and goal cards to show effort required
 *
 * @example
 * <EffortBadge tier="medium" variant="stars" />
 * <EffortBadge tier="large" variant="nature" showLabel />
 */
export function EffortBadge({
  tier,
  variant = 'stars',
  showLabel = false,
  size = 'md',
  className = '',
}: EffortBadgeProps) {
  const stars = getTierStars(tier);
  const label = getTierLabel(tier);
  const natureIcon = getNatureIcon(tier);

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const starSizes = {
    sm: 12,
    md: 14,
    lg: 18,
  };

  const renderStars = () => (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: stars }).map((_, i) => (
        <Star
          key={i}
          size={starSizes[size]}
          weight="fill"
          className="text-yellow-500"
        />
      ))}
      {/* Empty stars to show max */}
      {Array.from({ length: 4 - stars }).map((_, i) => (
        <Star
          key={`empty-${i}`}
          size={starSizes[size]}
          weight="regular"
          className="text-gray-300 dark:text-gray-600"
        />
      ))}
    </span>
  );

  const renderNature = () => (
    <span className={sizeClasses[size]}>{natureIcon}</span>
  );

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} ${className}`}
    >
      {variant === 'stars' && renderStars()}
      {variant === 'nature' && renderNature()}
      {variant === 'both' && (
        <>
          {renderNature()}
          {renderStars()}
        </>
      )}
      {showLabel && (
        <span className="font-medium text-gray-600 dark:text-gray-400">
          {label}
        </span>
      )}
    </span>
  );
}

/**
 * Compact version showing just the tier indicator
 */
export function TierBadge({
  tier,
  className = '',
}: {
  tier: Tier;
  className?: string;
}) {
  const label = getTierLabel(tier);

  const tierColors = {
    small: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    large: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    xl: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${tierColors[tier]} ${className}`}
    >
      {label}
    </span>
  );
}

/**
 * Combined display with stars, label, and points
 */
export function EffortDisplay({
  tier,
  points,
  showPoints = true,
  className = '',
}: {
  tier: Tier;
  points: number;
  showPoints?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <EffortBadge tier={tier} variant="stars" size="sm" />
      <TierBadge tier={tier} />
      {showPoints && (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {points} XP
        </span>
      )}
    </div>
  );
}
