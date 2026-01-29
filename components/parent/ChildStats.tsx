'use client';

import { Trophy, Flame, TrendingUp, Target } from 'lucide-react';
import { formatPoints, formatPercentage } from '@/lib/format';
import { useTranslations } from 'next-intl';

type Child = {
  name: string;
  points_balance: number;
  points_lifetime_earned: number;
  trust_level: number;
  trust_streak_days: number;
  settings: {
    weeklyGoal?: number;
  };
};

interface ChildStatsProps {
  child: Child;
}

export default function ChildStats({ child }: ChildStatsProps) {
  const t = useTranslations('parent.childStats');
  const weeklyGoal = child.settings?.weeklyGoal || 500;
  const progressPercentage = Math.min((child.points_balance / weeklyGoal) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Current Points */}
      <div className="rounded-xl bg-gradient-to-br from-primary to-green-600 p-6 text-black">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-semibold opacity-90">{t('currentBalance')}</span>
        </div>
        <p className="text-4xl font-black mb-1">{formatPoints(child.points_balance)} XP</p>
        <p className="text-sm opacity-75">
          {formatPercentage(progressPercentage)} {t('ofWeeklyGoal')}
        </p>
      </div>

      {/* Progress to Goal */}
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span className="text-sm font-semibold text-text-main dark:text-white">
              {t('weeklyGoalProgress')}
            </span>
          </div>
          <span className="text-sm font-bold text-text-muted dark:text-gray-400">
            {formatPoints(child.points_balance)} / {formatPoints(weeklyGoal)} XP
          </span>
        </div>
        <div
          className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
          role="progressbar"
          aria-valuenow={child.points_balance}
          aria-valuemin={0}
          aria-valuemax={weeklyGoal}
          aria-label={t('progressLabel', { current: formatPoints(child.points_balance), goal: formatPoints(weeklyGoal), percent: Math.round(progressPercentage) })}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-slow"
            style={{ width: `${progressPercentage}%` }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Lifetime Points */}
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-text-muted dark:text-gray-400">
              {t('lifetimeEarned')}
            </span>
          </div>
          <p className="text-2xl font-black text-text-main dark:text-white">
            {formatPoints(child.points_lifetime_earned)}
          </p>
        </div>

        {/* Trust Streak */}
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-orange-600 dark:text-orange-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-text-muted dark:text-gray-400">
              {t('trustStreak')}
            </span>
          </div>
          <p className="text-2xl font-black text-text-main dark:text-white">
            {t('days', { count: child.trust_streak_days || 0 })}
          </p>
        </div>
      </div>

      {/* Trust Level */}
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-text-main dark:text-white">
              {t('trustLevel')}
            </span>
            <p className="text-xs text-text-muted dark:text-gray-400 mt-1">
              {t('trustLevelDescription')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {[1, 2, 3].map((level) => (
              <div
                key={level}
                className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${level <= child.trust_level
                    ? 'bg-primary text-black'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                  }`}
                aria-label={`Trust level ${level}${level <= child.trust_level ? ' - Active' : ''}`}
                role="status"
              >
                {level}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
