'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

type TaskCompletion = {
  id: string;
  status: string;
  requested_at: string;
  completed_at: string | null;
  fix_request_message: string | null;
  fix_request_count: number;
  task: {
    name: string;
    points: number;
    category: string;
  } | null;
};

type Props = {
  completions: TaskCompletion[];
};

const statusConfig: Record<
  string,
  { label: string; color: string; icon: string; description: string }
> = {
  pending: {
    label: 'Waiting for Parent',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: '⏳',
    description: 'Your parent will check this soon!',
  },
  approved: {
    label: 'Approved',
    color: 'bg-growth-green/20 text-growth-green border-growth-green/30',
    icon: '✅',
    description: 'Great job! You earned the points.',
  },
  fix_requested: {
    label: 'Needs Fixing',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: '↩️',
    description: 'Please try again with the feedback below.',
  },
};

const categoryIcons: Record<string, string> = {
  learning: '📚',
  life: '🏠',
  health: '💪',
  creativity: '🎨',
};

export function MyCompletions({ completions }: Props) {
  if (completions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-6xl mb-4">📝</div>
        <p className="text-lg text-gray-600 mb-2">No submissions yet!</p>
        <p className="text-sm text-gray-500">
          Complete tasks above to see your submissions here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {completions.map((completion) => {
        const config = statusConfig[completion.status] || statusConfig.pending;
        const task = completion.task;

        return (
          <Card
            key={completion.id}
            className={`p-4 border-2 ${config.color}`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Task Info */}
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl">
                  {task ? categoryIcons[task.category] : '⭐'}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">
                      {task?.name || 'Unknown Task'}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      ⭐ {task?.points || 0} pts
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    Submitted {formatDistanceToNow(new Date(completion.requested_at), { addSuffix: true })}
                  </p>

                  {/* Status Message */}
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {config.description}
                      </p>
                      {completion.status === 'fix_requested' && completion.fix_request_message && (
                        <div className="mt-2 p-2 bg-white rounded border border-red-200">
                          <p className="text-xs font-semibold text-red-700 mb-1">
                            Parent&apos;s feedback:
                          </p>
                          <p className="text-sm text-gray-700">
                            {completion.fix_request_message}
                          </p>
                        </div>
                      )}
                      {completion.fix_request_count > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Attempt #{completion.fix_request_count + 1}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <Badge className={`${config.color} font-semibold whitespace-nowrap`}>
                {config.label}
              </Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
