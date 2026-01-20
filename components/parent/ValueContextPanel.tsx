'use client';

import { useMemo } from 'react';
import { Info, TrendUp, Scales, ChartBar, CheckCircle, CurrencyDollar } from '@phosphor-icons/react/dist/ssr';
import { getTierForPoints, getTierLabel, TIER_RANGES } from '@/lib/utils/tiers';
import { formatPointsAsDollars, ExchangeRate, DEFAULT_EXCHANGE_RATE } from '@/lib/utils/exchange-rate';

interface ExistingReward {
  name: string;
  points_cost: number;
}

interface ValueContextPanelProps {
  pointsCost: number;
  childName?: string;
  weeklyEarnings?: number;
  availableBalance?: number;
  existingRewards?: ExistingReward[];
  taskPointValues?: { daily: number; special: number };
  exchangeRate?: ExchangeRate;
}

/**
 * Value Context Panel for Parents
 *
 * Helps parents price rewards consistently by showing:
 * - Effort equivalent (how many tasks = this reward)
 * - Comparison to other rewards
 * - Child-specific context (% of weekly earnings, affordability)
 * - Recommended price range based on tier
 */
export default function ValueContextPanel({
  pointsCost,
  childName,
  weeklyEarnings = 350,
  availableBalance,
  existingRewards = [],
  taskPointValues = { daily: 50, special: 150 },
  exchangeRate = DEFAULT_EXCHANGE_RATE,
}: ValueContextPanelProps) {
  const tier = getTierForPoints(pointsCost);
  const tierLabel = getTierLabel(tier);
  const tierRange = TIER_RANGES[tier];

  const effortContext = useMemo(() => {
    const dailyTasks = Math.ceil(pointsCost / taskPointValues.daily);
    const specialTasks = Math.round((pointsCost / taskPointValues.special) * 10) / 10;

    return {
      dailyTasks,
      specialTasks,
      dailyLabel: dailyTasks === 1 ? '1 daily routine' : `${dailyTasks} daily routines`,
      specialLabel: specialTasks === 1 ? '1 special mission' : `${specialTasks.toFixed(1)} special missions`,
    };
  }, [pointsCost, taskPointValues]);

  const comparison = useMemo(() => {
    if (existingRewards.length === 0) return null;

    const higher = existingRewards
      .filter((r) => r.points_cost > pointsCost)
      .sort((a, b) => a.points_cost - b.points_cost)[0];

    const lower = existingRewards
      .filter((r) => r.points_cost < pointsCost)
      .sort((a, b) => b.points_cost - a.points_cost)[0];

    return { higher, lower };
  }, [existingRewards, pointsCost]);

  const childContext = useMemo(() => {
    const weeklyPercent = weeklyEarnings > 0
      ? Math.round((pointsCost / weeklyEarnings) * 100)
      : 0;
    const weeksToSave = weeklyEarnings > 0
      ? Math.ceil(pointsCost / weeklyEarnings)
      : 0;
    const canAfford = availableBalance !== undefined && availableBalance >= pointsCost;

    return {
      weeklyPercent,
      weeksToSave,
      canAfford,
      weeksLabel: weeksToSave === 1 ? '~1 week' : `~${weeksToSave} weeks`,
    };
  }, [pointsCost, weeklyEarnings, availableBalance]);

  const recommendation = useMemo(() => {
    const isInRange = pointsCost >= tierRange.min && pointsCost <= tierRange.max;
    const suggestedMin = tierRange.min;
    const suggestedMax = tierRange.max;

    return {
      isInRange,
      suggestedMin,
      suggestedMax,
      message: isInRange
        ? 'Price fits the tier well'
        : pointsCost < tierRange.min
        ? `Consider increasing to ${tierRange.min}+ for ${tierLabel} tier`
        : `Consider ${TIER_RANGES[tier].min}-${TIER_RANGES[tier].max}p range`,
    };
  }, [pointsCost, tierRange, tierLabel, tier]);

  // Dollar value context (parent-only)
  const dollarValue = useMemo(() => {
    return formatPointsAsDollars(pointsCost, exchangeRate);
  }, [pointsCost, exchangeRate]);

  if (pointsCost <= 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Info size={18} className="text-amber-600 dark:text-amber-400" />
        <h4 className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
          Value Context (Parent Only)
        </h4>
      </div>

      <div className="space-y-4 text-sm">
        {/* Dollar Value */}
        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <CurrencyDollar size={18} weight="bold" className="text-green-700 dark:text-green-400" />
          <span className="text-green-800 dark:text-green-300 font-semibold">
            Real value: {dollarValue}
          </span>
          <span className="text-green-600 dark:text-green-400 text-xs">
            ($1 = {exchangeRate} XP)
          </span>
        </div>

        {/* Effort Equivalent */}
        <div>
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-medium mb-1">
            <ChartBar size={14} />
            <span>Effort Equivalent</span>
          </div>
          <ul className="text-amber-600 dark:text-amber-400 ml-5 space-y-0.5">
            <li>Daily routine quests: {effortContext.dailyLabel}</li>
            <li>Special missions: {effortContext.specialLabel}</li>
          </ul>
        </div>

        {/* Comparison */}
        {comparison && (comparison.higher || comparison.lower) && (
          <div>
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-medium mb-1">
              <Scales size={14} />
              <span>Compared to Other Rewards</span>
            </div>
            <ul className="text-amber-600 dark:text-amber-400 ml-5 space-y-0.5">
              {comparison.lower && (
                <li>Higher than: {comparison.lower.name} ({comparison.lower.points_cost}p)</li>
              )}
              {comparison.higher && (
                <li>Lower than: {comparison.higher.name} ({comparison.higher.points_cost}p)</li>
              )}
            </ul>
          </div>
        )}

        {/* Child Context */}
        {childName && (
          <div>
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-medium mb-1">
              <TrendUp size={14} />
              <span>For {childName}</span>
            </div>
            <ul className="text-amber-600 dark:text-amber-400 ml-5 space-y-0.5">
              <li>~{childContext.weeklyPercent}% of weekly earnings</li>
              <li>Time to save: {childContext.weeksLabel}</li>
              {availableBalance !== undefined && (
                <li>
                  {childContext.canAfford ? (
                    <span className="text-green-600 dark:text-green-400">Can afford now</span>
                  ) : (
                    <span>Needs {pointsCost - availableBalance} more points</span>
                  )}
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Recommendation */}
        <div className="flex items-center gap-2 pt-2 border-t border-amber-200 dark:border-amber-700">
          <CheckCircle
            size={16}
            weight={recommendation.isInRange ? 'fill' : 'regular'}
            className={recommendation.isInRange ? 'text-green-600' : 'text-amber-500'}
          />
          <span className={`font-medium ${recommendation.isInRange ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}>
            Recommended: {tierRange.min}-{tierRange.max}p ({tierLabel})
          </span>
        </div>
      </div>
    </div>
  );
}
