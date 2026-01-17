'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import FixRequestModal from './FixRequestModal';

type TaskCompletion = {
  id: string;
  requested_at: string;
  tasks: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    points: number;
    icon: string | null;
    metadata?: {
      source?: {
        templateKey?: string;
      };
    };
  };
  children: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};

interface ApprovalCardProps {
  completion: TaskCompletion;
  onApprove?: () => void;
  onFixRequest?: () => void;
}

export default function ApprovalCard({ completion, onApprove, onFixRequest }: ApprovalCardProps) {
  const router = useRouter();
  const t = useTranslations('parent.actionCenter');
  const [loading, setLoading] = useState(false);
  const [showFixRequestModal, setShowFixRequestModal] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tasks/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completionId: completion.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve');
      }

      onApprove?.();
      router.refresh();
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error(t('approvalFailed'), { description: t('approvalFailedDescription') });
    } finally {
      setLoading(false);
    }
  };

  const handleFixRequestClose = () => {
    setShowFixRequestModal(false);
    onFixRequest?.();
  };

  const formatTime = (dateString: string) => {
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
    <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-6">
        {/* Child Info & Task */}
        <div className="flex items-start gap-4 mb-4">
          {/* Child Avatar */}
          <div className="shrink-0">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                {completion.children.name[0].toUpperCase()}
              </span>
            </div>
          </div>

          {/* Task Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="text-lg font-bold text-text-main dark:text-white">
                  {completion.tasks.name}
                </h3>
                <p className="text-sm text-text-muted dark:text-gray-400">
                  {t('by', { name: completion.children.name })}
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10">
                <span className="text-sm font-bold text-primary">
                  +{completion.tasks.points} XP
                </span>
              </div>
            </div>

            {completion.tasks.description && (
              <p className="text-sm text-text-muted dark:text-gray-400 mb-2">
                {completion.tasks.description}
              </p>
            )}

            <div className="flex items-center gap-3 text-sm text-text-muted dark:text-gray-500">
              <Clock className="h-4 w-4" />
              <span>{t('submitted', { time: formatTime(completion.requested_at) })}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all disabled:opacity-50"
          >
            <Check className="h-5 w-5" />
            {t('confirmComplete')}
          </button>
          <button
            onClick={() => setShowFixRequestModal(true)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold transition-all disabled:opacity-50"
          >
            <MessageSquare className="h-5 w-5" />
            {t('requestFix')}
          </button>
        </div>
      </div>

      {/* Fix Request Modal */}
      <FixRequestModal
        completionId={completion.id}
        taskName={completion.tasks.name}
        templateKey={completion.tasks.metadata?.source?.templateKey}
        isOpen={showFixRequestModal}
        onClose={handleFixRequestClose}
      />
    </div>
  );
}
