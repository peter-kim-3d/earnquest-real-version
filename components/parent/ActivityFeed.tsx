'use client';

import { useTranslations } from 'next-intl';

type Completion = {
  id: string;
  completed_at: string | null;
  status: string;
  points_awarded: number | null;
  tasks: {
    name: string;
  } | null;
  children: {
    name: string;
  } | null;
};

interface ActivityFeedProps {
  completions: Completion[];
}

export default function ActivityFeed({ completions }: ActivityFeedProps) {
  const t = useTranslations('parent.activity');

  const formatTime = (dateString: string | null) => {
    if (!dateString) return t('recently');

    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return t('minutesAgo', { count: diffInMinutes });
    } else if (diffInMinutes < 1440) {
      return t('hoursAgo', { count: Math.floor(diffInMinutes / 60) });
    } else {
      return t('daysAgo', { count: Math.floor(diffInMinutes / 1440) });
    }
  };

  return (
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-text-main dark:text-white mb-4">
        {t('title')}
      </h3>

      {completions.length > 0 ? (
        <div className="space-y-4">
          {completions.map((completion, index) => (
            <div key={completion.id} className="flex gap-4">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div className={`h-2 w-2 rounded-full ${
                  completion.status === 'approved' || completion.status === 'auto_approved'
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`} />
                {index < completions.length - 1 && (
                  <div className="flex-1 w-px bg-gray-200 dark:bg-gray-700 my-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-4">
                <p className="text-sm text-text-main dark:text-white">
                  <span className="font-semibold">{completion.children?.name || t('someone')}</span>
                  {' ' + t('completed') + ' '}
                  <span className="font-semibold">{completion.tasks?.name || t('aTask')}</span>
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-text-muted dark:text-gray-500">
                    {formatTime(completion.completed_at)}
                  </span>
                  {completion.points_awarded && (
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                      +{completion.points_awarded} XP
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-text-muted dark:text-gray-400">
            {t('noActivity')}
          </p>
        </div>
      )}
    </div>
  );
}
