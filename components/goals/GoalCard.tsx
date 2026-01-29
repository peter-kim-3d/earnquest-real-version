'use client';

import { useState } from 'react';
import { Target, Trophy, ArrowRight, PiggyBank, CheckCircle, Circle } from '@phosphor-icons/react/dist/ssr';
import { TierBadge, EffortBadge } from '@/components/ui/EffortBadge';
import { Button } from '@/components/ui/button';
import { Tier, estimateTimeToGoal } from '@/lib/utils/tiers';
import { MilestoneBonuses } from '@/lib/types/goal';
import { getAllMilestones, getProgressToNextMilestone, hasMilestones } from '@/lib/utils/milestones';
import DepositModal from './DepositModal';
import MilestoneModal from './MilestoneModal';
import { useTranslations } from 'next-intl';

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
  milestone_bonuses?: MilestoneBonuses | null;
  milestones_completed?: number[] | null;
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
  onDeposit?: (goalId: string, amount: number) => Promise<{ milestoneReached?: number; milestoneBonus?: number }>;
  onRefresh?: () => void;
}

export default function GoalCard({
  goal,
  childId,
  availableBalance,
  weeklyEarnings = 440, // Updated for v2 (doubled from 220)
  onDeposit,
  onRefresh,
}: GoalCardProps) {
  const t = useTranslations('goals.card');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [milestoneModal, setMilestoneModal] = useState<{
    isOpen: boolean;
    percentage: number;
    bonus: number;
  }>({ isOpen: false, percentage: 0, bonus: 0 });

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

  // Milestone info
  const hasGoalMilestones = hasMilestones(goal.milestone_bonuses ?? null);
  const allMilestones = getAllMilestones(
    goal.target_points,
    goal.current_points,
    goal.milestone_bonuses ?? null,
    goal.milestones_completed || []
  );
  const nextMilestoneProgress = getProgressToNextMilestone(
    goal.current_points,
    goal.target_points,
    goal.milestone_bonuses ?? null,
    goal.milestones_completed || []
  );

  const handleDeposit = async (amount: number) => {
    if (!onDeposit) return;

    setIsDepositing(true);
    try {
      const result = await onDeposit(goal.id, amount);
      setIsDepositOpen(false);

      // Check if milestone was reached
      if (result?.milestoneReached && result?.milestoneBonus) {
        setMilestoneModal({
          isOpen: true,
          percentage: result.milestoneReached,
          bonus: result.milestoneBonus,
        });
      }

      onRefresh?.();
    } catch (error: unknown) {
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
                aria-hidden="true"
              >
                {goal.is_completed ? (
                  <Trophy
                    size={28}
                    weight="duotone"
                    className="text-yellow-600 dark:text-yellow-400"
                  />
                ) : (
                  <Target size={28} weight="duotone" className="text-primary" aria-hidden="true" />
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2" title={goal.description}>
              {goal.description}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="px-4 pb-4">
          {/* Progress bar */}
          <div
            className="relative h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-2"
            role="progressbar"
            aria-valuenow={goal.current_points}
            aria-valuemin={0}
            aria-valuemax={goal.target_points}
            aria-label={t('progressLabel', { current: goal.current_points.toLocaleString(), target: goal.target_points.toLocaleString(), percent: Math.round(progress) })}
          >
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                goal.is_completed
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                  : 'bg-gradient-to-r from-primary to-green-500'
              }`}
              style={{ width: `${progress}%` }}
              aria-hidden="true"
            />
            {/* Shimmer effect - respects prefers-reduced-motion */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent motion-reduce:hidden"
              style={{
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
              }}
              aria-hidden="true"
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

          {/* Milestone indicators */}
          {hasGoalMilestones && allMilestones.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between gap-2">
                {allMilestones.map((milestone) => (
                  <div
                    key={milestone.percentage}
                    className={`flex items-center gap-1 text-xs ${
                      milestone.isCompleted
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {milestone.isCompleted ? (
                      <CheckCircle size={14} weight="fill" aria-hidden="true" />
                    ) : (
                      <Circle size={14} aria-hidden="true" />
                    )}
                    <span>{milestone.percentage}%</span>
                  </div>
                ))}
              </div>
              {nextMilestoneProgress && !goal.is_completed && (
                <p className="text-xs text-primary mt-1">
                  {t('xpToMilestone', {
                    points: nextMilestoneProgress.pointsToMilestone.toLocaleString(),
                    percentage: nextMilestoneProgress.milestone.percentage,
                    bonus: nextMilestoneProgress.milestone.bonusPoints
                  })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 pb-4">
          {goal.is_completed ? (
            <div className="flex items-center justify-center gap-2 py-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Trophy size={20} className="text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
              <span className="font-bold text-yellow-700 dark:text-yellow-300">
                {t('goalAchieved')}
              </span>
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => setIsDepositOpen(true)}
              disabled={availableBalance <= 0}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <PiggyBank size={18} className="mr-2" aria-hidden="true" />
              {t('depositPoints')}
              <ArrowRight size={16} className="ml-auto" aria-hidden="true" />
            </Button>
          )}

          {/* Balance hint */}
          {!goal.is_completed && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
              {availableBalance > 0
                ? t('xpAvailable', { points: availableBalance.toLocaleString() })
                : t('earnMoreToDeposit')}
            </p>
          )}
        </div>

        {/* Change history indicator */}
        {goal.change_log && goal.change_log.length > 0 && (
          <div className="px-4 pb-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t('targetUpdated', { count: goal.change_log.length })}
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

      {/* Milestone Achievement Modal */}
      <MilestoneModal
        isOpen={milestoneModal.isOpen}
        onClose={() => setMilestoneModal({ ...milestoneModal, isOpen: false })}
        milestonePercentage={milestoneModal.percentage}
        bonusPoints={milestoneModal.bonus}
        goalName={goal.name}
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
