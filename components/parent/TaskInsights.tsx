'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { TrendUp, CheckCircle, WarningCircle, ChartBar } from '@phosphor-icons/react';

interface TaskBreakdown {
  taskId: string;
  taskName: string;
  frequency: string;
  completionRate: number;
  completions: number;
  expected: number;
}

interface InsightsData {
  summary: {
    totalTasks: number;
    completionRate: number;
    totalCompletions: number;
    expectedCompletions: number;
  };
  bestTask: {
    id: string;
    name: string;
    completionRate: number;
    completions: number;
  } | null;
  needsAttentionTask: {
    id: string;
    name: string;
    completionRate: number;
    completions: number;
    expected: number;
  } | null;
  taskBreakdown: TaskBreakdown[];
}

interface TaskInsightsProps {
  childId: string;
}

function CompletionRateBar({ rate, showLabel = true }: { rate: number; showLabel?: boolean }) {
  const getBarColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 50) return 'bg-yellow-500';
    return 'bg-red-400';
  };

  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${getBarColor(rate)} transition-all duration-300`}
          style={{ width: `${Math.min(100, rate)}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12 text-right tabular-nums">
          {rate}%
        </span>
      )}
    </div>
  );
}

function FrequencyBadge({ frequency }: { frequency: string }) {
  const t = useTranslations('tasks');

  const labels: Record<string, string> = {
    daily: t('frequencies.daily'),
    weekly: t('frequencies.weekly'),
    monthly: t('frequencies.monthly'),
    one_time: t('frequencies.oneTime'),
  };

  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
      {labels[frequency] || frequency}
    </span>
  );
}

export default function TaskInsights({ childId }: TaskInsightsProps) {
  const t = useTranslations('parent.insights');
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/children/${childId}/insights`);
        if (!response.ok) {
          throw new Error('Failed to fetch insights');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Fetch insights error:', err);
        setError(t('fetchError'));
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, [childId, t]);

  if (loading) {
    return (
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!data || data.summary.totalTasks === 0) {
    return (
      <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
          <ChartBar size={24} className="text-primary" />
          {t('title')}
        </h3>
        <div className="text-center py-8">
          <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
            <ChartBar size={32} className="text-gray-400 dark:text-gray-600" />
          </div>
          <p className="text-gray-600 dark:text-gray-400">{t('noTasks')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      {/* Header */}
      <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
        <ChartBar size={24} className="text-primary" />
        {t('title')}
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overall Completion Rate */}
        <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendUp size={20} className="text-primary" weight="bold" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('completionRate')}
            </span>
          </div>
          <p className="text-3xl font-black text-primary">
            {data.summary.completionRate}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {t('completionsCount', {
              actual: data.summary.totalCompletions,
              expected: data.summary.expectedCompletions
            })}
          </p>
        </div>

        {/* Best Task */}
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-600 dark:text-green-400" weight="fill" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('bestTask')}
            </span>
          </div>
          {data.bestTask ? (
            <>
              <p className="text-lg font-bold text-green-700 dark:text-green-300 line-clamp-1">
                {data.bestTask.name}
              </p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                {t('taskRate', { rate: data.bestTask.completionRate })}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              {t('noCompletionsYet')}
            </p>
          )}
        </div>

        {/* Needs Attention */}
        <div className="rounded-lg bg-orange-50 dark:bg-orange-900/20 p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-2">
            <WarningCircle size={20} className="text-orange-600 dark:text-orange-400" weight="fill" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {t('needsAttention')}
            </span>
          </div>
          {data.needsAttentionTask ? (
            <>
              <p className="text-lg font-bold text-orange-700 dark:text-orange-300 line-clamp-1">
                {data.needsAttentionTask.name}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                {t('taskRate', { rate: data.needsAttentionTask.completionRate })}
              </p>
            </>
          ) : (
            <p className="text-sm text-green-600 dark:text-green-400">
              {t('allOnTrack')}
            </p>
          )}
        </div>
      </div>

      {/* Task Breakdown */}
      {data.taskBreakdown.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            {t('taskBreakdown')}
          </h4>
          <div className="space-y-2">
            {data.taskBreakdown.map((task) => (
              <div
                key={task.taskId}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-text-main dark:text-white truncate">
                      {task.taskName}
                    </span>
                    <FrequencyBadge frequency={task.frequency} />
                  </div>
                  <CompletionRateBar rate={task.completionRate} />
                </div>
                <div className="text-right text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {task.completions}/{task.expected}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Period Note */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        {t('periodNote')}
      </p>
    </div>
  );
}
