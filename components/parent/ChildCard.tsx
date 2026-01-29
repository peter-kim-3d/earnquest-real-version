'use client';

import { useState } from 'react';
import { Fire, TrendUp, Trash, Plus, Checks, Eye, CircleNotch } from '@phosphor-icons/react/dist/ssr';
import { AppIcon } from '@/components/ui/AppIcon';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import TaskFormDialog from './TaskFormDialog';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import AvatarDisplay from '@/components/profile/AvatarDisplay';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type Child = {
  id: string;
  name: string;
  age_group: string;
  points_balance: number;
  avatar_url: string | null;
  settings: {
    weeklyGoal?: number;
  };
};

type Task = {
  id: string;
  name: string;
  points: number;
  icon: string | null;
  image_url: string | null;
  category: string;
  frequency: string;
  isDisabled?: boolean;
};

interface ChildCardProps {
  child: Child;
  tasks?: Task[];
}

export default function ChildCard({ child, tasks = [] }: ChildCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en-US';
  const t = useTranslations('parent.children');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const weeklyGoal = child.settings?.weeklyGoal || 500;
  const progressPercentage = Math.min((child.points_balance / weeklyGoal) * 100, 100);

  const handleViewProfile = () => {
    router.push(`/${locale}/children/${child.id}`);
  };

  const handleCreateTask = () => {
    setIsTaskFormOpen(true);
  };

  const handleTaskDelete = (task: Task) => {
    setTaskToDelete(task);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      // One-time tasks should be removed for this child using overrides
      // This way other children can still see the task if it's global
      const response = await fetch('/api/tasks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: taskToDelete.id,
          childId: child.id,
          isEnabled: false, // Disable for this child
        }),
      });

      if (!response.ok) throw new Error('Failed to remove task');
      toast.success(t('taskRemoved'));
      router.refresh();
    } catch (error: unknown) {
      console.error('Error removing task:', error);
      toast.error(t('taskRemoveFailed'));
    }
  };

  const handleTaskToggle = async (task: Task, isEnabled: boolean) => {
    try {
      const response = await fetch('/api/tasks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          childId: child.id,
          isEnabled: isEnabled,
        }),
      });

      if (!response.ok) throw new Error('Failed to toggle task');
      toast.success(isEnabled ? t('taskEnabled') : t('taskDisabled'));
      router.refresh(); // Refresh to update UI state
    } catch (error: unknown) {
      console.error('Error toggling task:', error);
      toast.error(t('taskUpdateFailed'));
    }
  };

  return (
    <>
      <Dialog>
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-card hover:shadow-card-hover transition-all duration-normal">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AvatarDisplay
                avatarUrl={child.avatar_url}
                userName={child.name}
                size="md"
                editable={false}
              />
              <div>
                <h3 className="text-lg font-bold text-text-main dark:text-white leading-none mb-1">
                  {child.name}
                </h3>
                <p className="text-xs font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
                  {child.age_group}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                if (isImpersonating) return;
                setIsImpersonating(true);
                try {
                  const response = await fetch('/api/auth/impersonate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ childId: child.id }),
                  });

                  if (!response.ok) throw new Error('Failed to switch view');

                  window.location.href = `/${locale}/child/dashboard`;
                } catch (error: unknown) {
                  console.error(error);
                  toast.error(t('impersonateFailed'));
                  setIsImpersonating(false);
                }
              }}
              disabled={isImpersonating}
              aria-busy={isImpersonating}
              className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              aria-label={t('viewAsChild')}
            >
              {isImpersonating ? (
                <CircleNotch size={20} className="motion-safe:animate-spin" aria-hidden="true" />
              ) : (
                <Eye size={20} aria-hidden="true" />
              )}
            </button>
          </div>
          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
            <Fire size={20} weight="fill" aria-hidden="true" />
            <span className="text-sm font-bold">0</span>
          </div>

          {/* Points */}
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-black text-text-main dark:text-white">
                {child.points_balance}
              </span>
              <span className="text-sm text-text-muted dark:text-gray-400">
                / {weeklyGoal} XP
              </span>
            </div>
            <div
              className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
              role="progressbar"
              aria-valuenow={child.points_balance}
              aria-valuemin={0}
              aria-valuemax={weeklyGoal}
              aria-label={t('progressLabel', { current: child.points_balance, goal: weeklyGoal, percent: Math.round(progressPercentage) })}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-green-400 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendUp size={16} weight="bold" className="text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                  {t('thisWeek')}
                </span>
              </div>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {child.points_balance} XP
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center gap-2 mb-1">
                <Checks size={16} weight="bold" className="text-purple-600 dark:text-purple-400" aria-hidden="true" />
                <span className="text-xs font-semibold text-purple-900 dark:text-purple-100">
                  {t('assigned')}
                </span>
              </div>
              <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {tasks.length}
              </p>
            </div>
          </div>

          {/* Assigned Tasks Summary */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-text-muted dark:text-gray-500 uppercase tracking-wider">
                {t('assignedTasks')}
              </h4>
              <DialogTrigger asChild>
                <button type="button" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors focus:outline-none focus-visible:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1">
                  {t('manage')}
                </button>
              </DialogTrigger>
            </div>
            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.slice(0, 3).map(task => ( // Show top 3
                  <div key={task.id} className={`flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 ${task.isDisabled ? 'opacity-50 grayscale' : ''}`}>
                    {task.image_url ? (
                      <div className="relative h-5 w-5 rounded overflow-hidden flex-shrink-0">
                        <Image src={task.image_url} alt={task.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <AppIcon name={task.icon} size={18} className="text-gray-500" aria-hidden="true" />
                    )}
                    <span className="text-sm font-medium text-text-main dark:text-white truncate flex-1" title={task.name}>
                      {task.name}
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {task.points}
                    </span>
                  </div>
                ))}
                {tasks.length > 3 && (
                  <DialogTrigger asChild>
                    <button type="button" className="w-full text-xs text-center text-text-muted dark:text-gray-500 mt-1 hover:text-primary transition-colors focus:outline-none focus-visible:underline focus-visible:text-primary">
                      {t('moreTasks', { count: tasks.length - 3 })}
                    </button>
                  </DialogTrigger>
                )}
              </div>
            ) : (
              <div className="text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-xs text-text-muted dark:text-gray-500 mb-2">{t('noTasks')}</p>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Plus size={12} className="mr-1" aria-hidden="true" />
                    {t('assignTask')}
                  </Button>
                </DialogTrigger>
              </div>
            )}
          </div>

          {/* View Profile Button */}
          <button
            type="button"
            onClick={handleViewProfile}
            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {t('viewProfile')}
          </button>

          {/* Full Task List Dialog */}
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('assignedTasksFor', { name: child.name })}</DialogTitle>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group ${task.isDisabled ? 'bg-gray-100 dark:bg-gray-800/50' : ''}`}>
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center overflow-hidden shadow-sm ${task.isDisabled ? 'bg-gray-200 dark:bg-gray-700 grayscale opacity-50' : 'bg-white dark:bg-gray-700'}`}>
                      {task.image_url ? (
                        <Image src={task.image_url} alt={task.name} width={40} height={40} className="object-cover" />
                      ) : (
                        <AppIcon name={task.icon} size={24} className="text-primary" aria-hidden="true" />
                      )}
                    </div>
                    <div className={`flex-1 min-w-0 ${task.isDisabled ? 'opacity-50' : ''}`}>
                      <h4 className="font-semibold text-text-main dark:text-white truncate" title={task.name}>
                        {task.name} {task.isDisabled && <span className="text-xs font-normal text-text-muted ml-2">{t('off')}</span>}
                      </h4>
                      <p className="text-xs text-text-muted dark:text-gray-400 uppercase tracking-wider">
                        {task.category}
                      </p>
                    </div>
                    <div className={`font-bold text-primary whitespace-nowrap mr-2 ${task.isDisabled ? 'opacity-50' : ''}`}>
                      {task.points} XP
                    </div>

                    {task.frequency === 'one_time' ? (
                      <button
                        type="button"
                        onClick={() => handleTaskDelete(task)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                        aria-label={t('removeTask')}
                      >
                        <Trash size={16} aria-hidden="true" />
                      </button>
                    ) : (
                      <div className="flex items-center">
                        <Switch
                          checked={!task.isDisabled}
                          onCheckedChange={(checked) => handleTaskToggle(task, checked)}
                          aria-label={task.isDisabled ? t('enableTask') : t('disableTask')}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button
                onClick={handleCreateTask}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
              >
                <Plus size={16} className="mr-2" aria-hidden="true" />
                {t('addNewTask')}
              </Button>
            </div>
          </DialogContent>
        </div>
      </Dialog>
      <TaskFormDialog
        task={null}
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        initialChildId={child.id}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title={t('removeTaskTitle')}
        description={t('removeTaskDescription', { taskName: taskToDelete?.name ?? '', childName: child.name })}
        confirmLabel={t('yesRemove')}
        cancelLabel={t('noKeep')}
        variant="danger"
      />
    </>
  );
}
