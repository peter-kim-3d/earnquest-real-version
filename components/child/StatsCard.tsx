'use client';

import { Flame, TrendingUp } from 'lucide-react';
import { formatPoints, formatPercentage } from '@/lib/format';
import { useTranslations } from 'next-intl';

type Child = {
  name: string;
  points_balance: number;
  settings: {
    weeklyGoal?: number;
  };
};

interface StatsCardProps {
  child: Child;
}

export default function StatsCard({ child }: StatsCardProps) {
  const t = useTranslations('child.stats');
  const weeklyGoal = child.settings?.weeklyGoal || 500;
  const currentPoints = child.points_balance;
  const progressPercentage = Math.min((currentPoints / weeklyGoal) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Total XP Card */}
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-card hover:shadow-card-hover transition-shadow duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
            {t('totalXp')}
          </h3>
          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" aria-hidden="true" />
        </div>
        <p className="text-4xl font-black text-text-main dark:text-white mb-1">
          {formatPoints(currentPoints)}
        </p>
        <p className="text-sm text-text-muted dark:text-gray-400">
          {t('questPoints')}
        </p>
      </div>

      {/* Day Streak Card */}
      <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
            {t('dayStreak')}
          </h3>
          <Flame className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <p className="text-5xl font-black text-white mb-1">0</p>
        <p className="text-sm text-white/80">{t('keepGoing')}</p>
      </div>

      {/* Weekly Goal Card */}
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-card hover:shadow-card-hover transition-shadow duration-200">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
              {t('weeklyGoal')}
            </h3>
            <span className="text-sm font-bold text-primary">
              {formatPercentage(progressPercentage)}
            </span>
          </div>
          {/* Progress Bar */}
          <div
            className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
            role="progressbar"
            aria-valuenow={currentPoints}
            aria-valuemin={0}
            aria-valuemax={weeklyGoal}
            aria-label={t('weeklyGoalProgress', { current: formatPoints(currentPoints), goal: formatPoints(weeklyGoal), percent: Math.round(progressPercentage) })}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-green-400 transition-all duration-slow shadow-[0_0_10px_rgba(55,236,19,0.5)]"
              style={{ width: `${progressPercentage}%` }}
              aria-hidden="true"
            />
          </div>
        </div>
        <p className="text-2xl font-bold text-text-main dark:text-white mb-1">
          {formatPoints(currentPoints)} / {formatPoints(weeklyGoal)} XP
        </p>
        <p className="text-sm text-text-muted dark:text-gray-400">
          {weeklyGoal - currentPoints > 0
            ? t('xpLeftToGoal', { points: weeklyGoal - currentPoints })
            : t('goalReached')}
        </p>

        {/* Tip Card */}
        {progressPercentage < 50 && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <p className="text-xs font-semibold text-blue-900 dark:text-blue-100">
              <span aria-hidden="true">💡 </span>{t('proTip')}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {t('proTipMessage')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
