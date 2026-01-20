'use client';

import { useState } from 'react';
import { Target, Trophy, ArrowRight, PiggyBank } from '@phosphor-icons/react';
import { TierBadge, EffortBadge } from '@/components/ui/EffortBadge';
import { Button } from '@/components/ui/button';
import { Tier, estimateTimeToGoal } from '@/lib/utils/tiers';
import DepositModal from './DepositModal';

interface Goal {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  target_points: number;
  current_points: number;
  tier: Tier;
  is_completed: boolean;
  completed_at?: string;
  change_log?: Array<{
    action: string;
    reason: string;
    timestamp: string;
  }>;
  created_at: string;
}

interface GoalCardProps {
  goal: Goal;
  childId: string;
  availableBalance: number;
  weeklyEarnings?: number;
  onDeposit?: (goalId: string, amount: number) => Promise<void>;
  onRefresh?: () => void;
}

export default function GoalCard({
  goal,
  childId,
  availableBalance,
  weeklyEarnings = 350,
  onDeposit,
  onRefresh,
}: GoalCardProps) {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  const progress = Math.min(
    (goal.current_points / goal.target_points) * 100,
    100
  );
  const pointsRemaining = Math.max(goal.target_points - goal.current_points, 0);
  const timeEstimate = estimateTimeToGoal(
    goal.target_points,
    goal.current_points,
    weeklyEarnings
  );

  const handleDeposit = async (amount: number) => {
    if (!onDeposit) return;

    setIsDepositing(true);
    try {
      await onDeposit(goal.id, amount);
      setIsDepositOpen(false);
      onRefresh?.();
    } catch (error) {
      console.error('Deposit error:', error);
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <>
      <div
        className={`rounded-xl border-2 overflow-hidden transition-all ${
          goal.is_completed
            ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary/50'
        }`}
      >
        {/* Header */}
        <div className="p-4 pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                  goal.is_completed
                    ? 'bg-yellow-200 dark:bg-yellow-800'
                    : 'bg-primary/10'
                }`}
              >
                {goal.is_completed ? (
                  <Trophy
                    size={28}
                    weight="duotone"
                    className="text-yellow-600 dark:text-yellow-400"
                  />
                ) : (
                  <Target size={28} weight="duotone" className="text-primary" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {goal.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <TierBadge tier={goal.tier} />
                  <EffortBadge tier={goal.tier} variant="stars" size="sm" />
                </div>
              </div>
            </div>
          </div>

          {goal.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
              {goal.description}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="px-4 pb-4">
          {/* Progress bar */}
          <div className="relative h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                goal.is_completed
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                  : 'bg-gradient-to-r from-primary to-green-500'
              }`}
              style={{ width: `${progress}%` }}
            />
            {/* Shimmer effect - respects prefers-reduced-motion */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent motion-reduce:hidden"
              style={{
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
              }}
            />
          </div>

          {/* Progress text */}
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-gray-900 dark:text-white tabular-nums">
              {goal.current_points.toLocaleString()} /{' '}
              {goal.target_points.toLocaleString()} XP
            </span>
            <span className="text-gray-500 dark:text-gray-400 tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>

          {/* Time estimate */}
          {!goal.is_completed && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {timeEstimate}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4">
          {goal.is_completed ? (
            <div className="flex items-center justify-center gap-2 py-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Trophy size={20} className="text-yellow-600 dark:text-yellow-400" />
              <span className="font-bold text-yellow-700 dark:text-yellow-300">
                Goal Achieved!
              </span>
            </div>
          ) : (
            <Button
              onClick={() => setIsDepositOpen(true)}
              disabled={availableBalance <= 0}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <PiggyBank size={18} className="mr-2" />
              Deposit Points
              <ArrowRight size={16} className="ml-auto" />
            </Button>
          )}

          {/* Balance hint */}
          {!goal.is_completed && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
              {availableBalance > 0
                ? `${availableBalance.toLocaleString()} XP available`
                : 'Earn more points to deposit'}
            </p>
          )}
        </div>

        {/* Change history indicator */}
        {goal.change_log && goal.change_log.length > 0 && (
          <div className="px-4 pb-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Target was updated ({goal.change_log.length} change
              {goal.change_log.length > 1 ? 's' : ''})
            </p>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onDeposit={handleDeposit}
        goalName={goal.name}
        currentProgress={goal.current_points}
        targetPoints={goal.target_points}
        availableBalance={availableBalance}
        isLoading={isDepositing}
      />

      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-shimmer {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
