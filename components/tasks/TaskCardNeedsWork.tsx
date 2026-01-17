'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { AppIcon } from '@/components/ui/AppIcon';

type Task = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  points: number;
  icon: string | null;
  // auto_assign fields
  auto_assign?: boolean;
  instance_id?: string | null;
};

type TaskCompletion = {
  id: string;
  fix_request: {
    items?: string[];
    message?: string;
  } | null;
  status: string;
};

interface TaskCardNeedsWorkProps {
  task: Task;
  completion: TaskCompletion;
  onResubmit: (taskId: string, evidence?: any, instanceId?: string) => Promise<void>;
}

export default function TaskCardNeedsWork({ task, completion, onResubmit }: TaskCardNeedsWorkProps) {
  const t = useTranslations('tasks.needsWork');
  const tCard = useTranslations('tasks.taskCard');
  const [loading, setLoading] = useState(false);

  const handleResubmit = async () => {
    setLoading(true);
    try {
      await onResubmit(task.id, undefined, task.instance_id || undefined);
    } catch (error) {
      console.error('Failed to resubmit task:', error);
      toast.error(tCard('submitFailed'), { description: tCard('failedToSubmit') });
    } finally {
      setLoading(false);
    }
  };

  // v2 Category colors
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'learning':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'household':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'health':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border-2 border-orange-300 dark:border-orange-700 shadow-sm">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Icon & Content */}
          <div className="flex items-start gap-4 flex-1">
            {/* Icon */}
            <div className={`${getCategoryColor(task.category)} rounded-xl p-3 shrink-0`}>
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
              </div>
            </div>
          </div>

          {/* Points Badge */}
          <div className="shrink-0">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-sm font-bold text-primary">
                +{task.points} XP
              </span>
            </div>
          </div>
        </div>

        {/* Feedback Message */}
        {completion.fix_request && (
          <div className="mt-4 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                {t('pleaseCheck')}
              </p>
            </div>
            {completion.fix_request.items && completion.fix_request.items.length > 0 && (
              <ul className="ml-6 space-y-1 mb-2">
                {completion.fix_request.items.map((item, index) => (
                  <li key={index} className="text-sm text-orange-700 dark:text-orange-300 list-disc">
                    {item}
                  </li>
                ))}
              </ul>
            )}
            {completion.fix_request.message && (
              <p className="text-sm text-orange-700 dark:text-orange-300 ml-6">
                {completion.fix_request.message}
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleResubmit}
          disabled={loading}
          className="mt-4 w-full px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t('submitting') : t('tryAgain')}
        </button>
      </div>
    </div>
  );
}
