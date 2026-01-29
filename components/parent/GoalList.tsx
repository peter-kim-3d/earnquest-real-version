'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Target, Trophy, Pencil, Trash, CheckCircle } from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import GoalFormDialog from './GoalFormDialog';
import { TierBadge, EffortBadge } from '@/components/ui/EffortBadge';
import { Tier, estimateTimeToGoal } from '@/lib/utils/tiers';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { ExchangeRate, DEFAULT_EXCHANGE_RATE } from '@/lib/utils/exchange-rate';

interface Child {
  id: string;
  name: string;
}

interface Goal {
  id: string;
  child_id: string;
  name: string;
  description: string | null;
  target_points: number;
  current_points: number;
  tier: Tier;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

interface GoalListProps {
  goals: Goal[];
  childrenList: Child[];
  weeklyEarnings?: number;
  exchangeRate?: ExchangeRate;
}

export default function GoalList({ goals, childrenList, weeklyEarnings = 350, exchangeRate = DEFAULT_EXCHANGE_RATE }: GoalListProps) {
  const t = useTranslations('goals');
  const router = useRouter();
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [deleteGoal, setDeleteGoal] = useState<Goal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleNew = () => {
    setSelectedGoal(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedGoal(null);
    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteGoal) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/goals?goalId=${deleteGoal.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete goal');
      }

      toast.success(t('toast.deleted'), {
        description: t('toast.deletedDescription', { name: deleteGoal.name }),
      });

      router.refresh();
    } catch (error: unknown) {
      console.error('Error deleting goal:', error);
      toast.error(t('toast.deleteFailed'), {
        description: t('toast.deleteFailedDescription'),
      });
    } finally {
      setIsDeleting(false);
      setDeleteGoal(null);
    }
  };

  // Filter goals
  const filteredGoals = goals.filter((goal) => {
    if (filter === 'active' && goal.is_completed) return false;
    if (filter === 'completed' && !goal.is_completed) return false;
    if (selectedChild !== 'all' && goal.child_id !== selectedChild) return false;
    return true;
  });

  // Group by child
  const groupedGoals = filteredGoals.reduce((acc, goal) => {
    const child = childrenList.find((c) => c.id === goal.child_id);
    const childName = child?.name || t('unknown');
    if (!acc[childName]) acc[childName] = [];
    acc[childName].push(goal);
    return acc;
  }, {} as Record<string, Goal[]>);

  const getChildName = (childId: string) => {
    return childrenList.find((c) => c.id === childId)?.name || t('unknown');
  };

  return (
    <div className="space-y-6">
      {/* Filters and New Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filters */}
          <button
            type="button"
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              filter === 'all'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Target size={16} weight="bold" aria-hidden="true" />
            {t('filter.all')}
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            aria-pressed={filter === 'active'}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              filter === 'active'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Target size={16} weight="fill" aria-hidden="true" />
            {t('filter.active')}
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            aria-pressed={filter === 'completed'}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              filter === 'completed'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Trophy size={16} weight="fill" aria-hidden="true" />
            {t('filter.completed')}
          </button>
        </div>

        {/* Child Filter (if multiple children) */}
        {childrenList.length > 1 && (
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            aria-label={t('childFilter.label')}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium"
          >
            <option value="all">{t('childFilter.all')}</option>
            {childrenList.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        )}

        {/* New Goal Button */}
        <button
          type="button"
          onClick={handleNew}
          className="px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Plus size={18} weight="bold" aria-hidden="true" />
          {t('newGoal')}
        </button>
      </div>

      {/* Goal Groups */}
      {Object.entries(groupedGoals).map(([childName, childGoals]) => (
        <div key={childName}>
          <h2 className="text-xl font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
            <span>{t('childGoals', { name: childName })}</span>
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              ({childGoals.length})
            </span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {childGoals.map((goal) => {
              const progress = Math.min((goal.current_points / goal.target_points) * 100, 100);
              const timeEstimate = estimateTimeToGoal(
                goal.target_points,
                goal.current_points,
                weeklyEarnings
              );

              return (
                <div
                  key={goal.id}
                  className={`rounded-xl border-2 overflow-hidden transition-all ${
                    goal.is_completed
                      ? 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {goal.is_completed ? (
                          <Trophy size={24} weight="duotone" className="text-yellow-600" aria-hidden="true" />
                        ) : (
                          <Target size={24} weight="duotone" className="text-primary" aria-hidden="true" />
                        )}
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {goal.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEdit(goal)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                          aria-label={t('actions.edit')}
                        >
                          <Pencil size={16} className="text-gray-500" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteGoal(goal)}
                          disabled={isDeleting}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                          aria-label={t('actions.delete')}
                        >
                          <Trash size={16} className="text-red-500" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {/* Tier Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <TierBadge tier={goal.tier} />
                      <EffortBadge tier={goal.tier} variant="stars" size="sm" />
                    </div>

                    {goal.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2" title={goal.description}>
                        {goal.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {goal.current_points.toLocaleString()} / {goal.target_points.toLocaleString()} XP
                        </span>
                        <span className="text-gray-500">{Math.round(progress)}%</span>
                      </div>
                      <div
                        className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
                        role="progressbar"
                        aria-valuenow={goal.current_points}
                        aria-valuemin={0}
                        aria-valuemax={goal.target_points}
                        aria-label={t('card.progressLabel', { current: goal.current_points.toLocaleString(), target: goal.target_points.toLocaleString(), percent: Math.round(progress) })}
                      >
                        <div
                          className={`h-full rounded-full transition-all ${
                            goal.is_completed
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                              : 'bg-gradient-to-r from-primary to-green-500'
                          }`}
                          style={{ width: `${progress}%` }}
                          aria-hidden="true"
                        />
                      </div>
                    </div>

                    {/* Status */}
                    {goal.is_completed ? (
                      <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400">
                        <CheckCircle size={16} weight="fill" aria-hidden="true" />
                        <span className="font-medium">{t('completedStatus')}</span>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {timeEstimate}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {filteredGoals.length === 0 && (
        <div className="text-center py-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <Target size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
          <p className="text-lg font-semibold text-text-muted dark:text-gray-400 mb-2">
            {filter === 'completed' ? t('noCompletedGoals') : t('noGoals')}
          </p>
          <p className="text-sm text-text-muted dark:text-gray-500 mb-4">
            {t('emptyDescription')}
          </p>
          <button
            type="button"
            onClick={handleNew}
            className="px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-md transition-all inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Plus size={18} weight="bold" aria-hidden="true" />
            {t('createFirstButton')}
          </button>
        </div>
      )}

      {/* Goal Form Dialog */}
      <GoalFormDialog
        goal={selectedGoal}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        childrenList={childrenList}
        exchangeRate={exchangeRate}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteGoal}
        onClose={() => !isDeleting && setDeleteGoal(null)}
        onConfirm={handleDelete}
        title={t('confirm.deleteTitle')}
        description={t('confirm.deleteDescription', { name: deleteGoal?.name || '' })}
        confirmLabel={t('actions.delete')}
        cancelLabel={t('confirm.cancel')}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
