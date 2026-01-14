'use client';

import { Clock } from 'lucide-react';
import { AppIcon } from '@/components/ui/AppIcon';

type Task = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  points: number;
  icon: string | null;
};

type TaskCompletion = {
  id: string;
  requested_at: string;
  status: string;
};

interface TaskCardPendingProps {
  task: Task;
  completion: TaskCompletion;
}

export default function TaskCardPending({ task, completion }: TaskCardPendingProps) {
  // Category colors
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'learning':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'chores':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'kindness':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case 'health':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 shadow-sm">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Icon & Content */}
          <div className="flex items-start gap-4 flex-1">
            {/* Icon */}
            <div className={`${getCategoryColor(task.category)} rounded-xl p-3 shrink-0 opacity-60`}>
              <AppIcon name={task.icon || 'task_alt'} size={24} weight="duotone" />
            </div>

            {/* Task Info */}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-text-main dark:text-white mb-1">
                {task.name}
              </h3>
              {task.description && (
                <p className="text-sm text-text-muted dark:text-gray-400 mb-3">
                  {task.description}
                </p>
              )}
              <div className="flex items-center gap-3">
                {/* Category Badge */}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 capitalize">
                  {task.category}
                </span>
                {/* Time */}
                <span className="text-xs text-text-muted dark:text-gray-500">
                  Submitted {formatTime(completion.requested_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Points Badge */}
          <div className="shrink-0">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              <span className="text-sm font-bold">
                +{task.points} XP
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            Parent Checking...
          </span>
        </div>
      </div>
    </div>
  );
}
