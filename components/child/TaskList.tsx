'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TaskCard from '@/components/tasks/TaskCard';
import TaskCardPending from '@/components/tasks/TaskCardPending';
import TaskCardNeedsWork from '@/components/tasks/TaskCardNeedsWork';
import { AppIcon } from '@/components/ui/AppIcon';
import { TaskTimeContext, TIME_CONTEXT_INFO } from '@/lib/types/task';
import { useTranslations } from 'next-intl';

type Task = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  time_context?: TaskTimeContext | null; // v2.1
  points: number;
  icon: string | null;
  frequency: string;
  auto_assign: boolean;
  instance_id?: string | null;
  instance_status?: string | null;
  // v2 fields from view
  approval_type?: string;
  timer_minutes?: number | null;
  checklist?: string[] | null;
  metadata?: any;
};

type TaskCompletion = {
  id: string;
  task_id: string;
  status: string;
  requested_at: string;
  completed_at: string | null;
  fix_request: {
    items?: string[];
    message?: string;
  } | null;
};

interface TaskListProps {
  tasks: Task[];
  completions: TaskCompletion[];
  childId: string;
  childName: string;
}

type TabType = 'todo' | 'pending' | 'completed';

import confetti from 'canvas-confetti';

// Time context order and configuration
const TIME_CONTEXT_ORDER: TaskTimeContext[] = ['morning', 'after_school', 'evening', 'anytime'];

export default function TaskList({ tasks, completions, childId, childName }: TaskListProps) {
  const router = useRouter();
  const t = useTranslations('child.tasks');
  const [activeTab, setActiveTab] = useState<TabType>('todo');
  const [optimisticCompletedIds, setOptimisticCompletedIds] = useState<Set<string>>(new Set());

  // Get completions by status
  const pendingCompletions = completions.filter((c) => c.status === 'pending');
  const fixRequestedCompletions = completions.filter((c) => c.status === 'fix_requested');
  const completedCompletions = completions.filter(
    (c) => c.status === 'approved' || c.status === 'auto_approved'
  );

  // Get task IDs that are pending or completed
  const pendingTaskIds = new Set(pendingCompletions.map((c) => c.task_id));
  const fixRequestedTaskIds = new Set(fixRequestedCompletions.map((c) => c.task_id));
  const completedTaskIds = new Set(
    completedCompletions
      .filter((c) => {
        // Only show if completed today
        const completedAt = c.completed_at ? new Date(c.completed_at) : null;
        const today = new Date();
        return completedAt && completedAt.toDateString() === today.toDateString();
      })
      .map((c) => c.task_id)
  );

  // Filter tasks by tab
  const todoTasks = tasks.filter(
    (task) =>
      !pendingTaskIds.has(task.id) &&
      !completedTaskIds.has(task.id) &&
      !fixRequestedTaskIds.has(task.id) &&
      !optimisticCompletedIds.has(task.id)
  );

  const pendingTasks = tasks.filter((task) => pendingTaskIds.has(task.id));
  const fixRequestedTasks = tasks.filter((task) => fixRequestedTaskIds.has(task.id));
  const completedTasks = tasks.filter((task) => completedTaskIds.has(task.id));

  // v2.1: Group todoTasks by time_context
  const groupedTodoTasks = TIME_CONTEXT_ORDER.reduce(
    (acc, context) => {
      acc[context] = todoTasks.filter((task) => (task.time_context || 'anytime') === context);
      return acc;
    },
    {} as Record<TaskTimeContext, Task[]>
  );

  // Handler for task completion
  const handleTaskComplete = async (
    taskId: string,
    evidence?: {
      timerCompleted?: boolean;
      checklistState?: boolean[];
    }
  ) => {
    // 1. Optimistic Update
    setOptimisticCompletedIds((prev) => new Set(prev).add(taskId));

    // 2. Celebration!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899'], // Green, Blue, Amber, Pink
    });

    try {
      const response = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          childId,
          ...(evidence && { evidence }),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete task');
      }

      // Refresh the page to show updated status
      router.refresh();

      // Note: We don't remove from optimistic set here because refresh might take a moment.
      // The refresh will eventually re-render the component with the task in 'pending' or 'completed' list,
      // and checking pendingTaskIds/completedTaskIds will hide it from 'todo' anyway.
    } catch (error) {
      console.error('Task completion failed:', error);
      // Revert optimistic update on error
      setOptimisticCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      // Re-throw so TaskCard can stop loading and show toast
      throw error;
    }
  };

  const tabs = [
    { id: 'todo' as TabType, label: t('toDo'), count: todoTasks.length + fixRequestedTasks.length },
    { id: 'pending' as TabType, label: t('parentChecking'), count: pendingTasks.length },
    { id: 'completed' as TabType, label: t('completed'), count: completedTasks.length },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-3 font-semibold text-sm border-b-2 transition-all
              ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task Cards */}
      <div className="space-y-4">
        {/* To Do Tab */}
        {activeTab === 'todo' && (
          <>
            {/* Fix Requested Tasks - always show at top */}
            {fixRequestedTasks.length > 0 && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <h3 className="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                    {t('needsAttention')}
                  </h3>
                </div>
                {fixRequestedTasks.map((task) => {
                  const completion = fixRequestedCompletions.find((c) => c.task_id === task.id)!;
                  return (
                    <TaskCardNeedsWork
                      key={task.id}
                      task={task}
                      completion={completion}
                      onResubmit={handleTaskComplete}
                    />
                  );
                })}
              </div>
            )}

            {/* v2.1: Time Context Grouped Tasks */}
            {TIME_CONTEXT_ORDER.map((context) => {
              const tasksInContext = groupedTodoTasks[context];
              if (tasksInContext.length === 0) return null;

              const contextInfo = TIME_CONTEXT_INFO[context];

              return (
                <div key={context} className="space-y-3">
                  {/* Section Header */}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-lg">{contextInfo.icon}</span>
                    <h3 className="text-sm font-bold text-text-muted dark:text-gray-400 uppercase tracking-wide">
                      {contextInfo.label}
                    </h3>
                    <span className="text-xs text-text-muted dark:text-gray-500">
                      ({tasksInContext.length})
                    </span>
                  </div>

                  {/* Tasks in this context */}
                  {tasksInContext.map((task) => (
                    <TaskCard key={task.id} task={task} onComplete={handleTaskComplete} />
                  ))}
                </div>
              );
            })}

            {todoTasks.length === 0 && fixRequestedTasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg font-semibold text-text-muted dark:text-gray-400">
                  {t('allCaughtUp')}
                </p>
                <p className="text-sm text-text-muted dark:text-gray-500 mt-2">
                  {t('checkBackTomorrow')}
                </p>
              </div>
            )}
          </>
        )}

        {/* Pending Tab */}
        {activeTab === 'pending' && (
          <>
            {pendingTasks.map((task) => {
              const completion = pendingCompletions.find((c) => c.task_id === task.id)!;
              return <TaskCardPending key={task.id} task={task} completion={completion} />;
            })}

            {pendingTasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg font-semibold text-text-muted dark:text-gray-400">
                  {t('noTasksWaiting')}
                </p>
              </div>
            )}
          </>
        )}

        {/* Completed Tab */}
        {activeTab === 'completed' && (
          <>
            {completedTasks.map((task) => {
              const completion = completedCompletions.find((c) => c.task_id === task.id)!;
              return (
                <div
                  key={task.id}
                  className="rounded-xl bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 p-6 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AppIcon
                        name="check_circle"
                        size={24}
                        weight="duotone"
                        className="text-green-600 dark:text-green-400"
                      />
                      <div>
                        <h3 className="font-bold text-text-main dark:text-white">{task.name}</h3>
                        <p className="text-sm text-text-muted dark:text-gray-400">{t('completedToday')}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      +{task.points} XP
                    </span>
                  </div>
                </div>
              );
            })}

            {completedTasks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-lg font-semibold text-text-muted dark:text-gray-400">
                  {t('noCompletedToday')}
                </p>
                <p className="text-sm text-text-muted dark:text-gray-500 mt-2">
                  {t('startCompleting')}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
