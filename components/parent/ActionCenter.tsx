'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckSquare, Square, CheckCircle } from '@phosphor-icons/react/dist/ssr';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import ApprovalCard from './ApprovalCard';

type PendingCompletion = {
  id: string;
  requested_at: string;
  tasks: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    points: number;
    icon: string | null;
  };
  children: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};

interface ActionCenterProps {
  pendingCompletions: PendingCompletion[];
  familyId: string;
}

export default function ActionCenter({ pendingCompletions }: ActionCenterProps) {
  const router = useRouter();
  const t = useTranslations('parent.actionCenter');
  const count = pendingCompletions.length;
  const [selectedCompletions, setSelectedCompletions] = useState<string[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);

  const allSelected = count > 0 && selectedCompletions.length === count;
  const someSelected = selectedCompletions.length > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedCompletions([]);
    } else {
      setSelectedCompletions(pendingCompletions.map((c) => c.id));
    }
  };

  const toggleCompletion = (completionId: string) => {
    if (selectedCompletions.includes(completionId)) {
      setSelectedCompletions(selectedCompletions.filter((id) => id !== completionId));
    } else {
      setSelectedCompletions([...selectedCompletions, completionId]);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedCompletions.length === 0) return;

    setBatchLoading(true);
    try {
      const response = await fetch('/api/tasks/batch-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completionIds: selectedCompletions }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve tasks');
      }

      const result = await response.json();
      toast.success(t('tasksApproved'), {
        description: result.message || t('tasksApprovedDescription', { count: result.approvedCount }),
      });
      setSelectedCompletions([]);
      router.refresh();
    } catch (error: any) {
      console.error('Batch approve error:', error);
      toast.error(t('approvalFailed'), { description: error.message || t('approvalFailedDescription') });
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-text-main dark:text-white">
            {t('title')}
          </h2>
          {count > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800">
              <Bell size={16} weight="fill" className="text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                {t('new', { count })}
              </span>
            </span>
          )}
        </div>

        {/* Batch Actions */}
        {count > 0 && (
          <div className="flex items-center gap-3">
            {/* Select All Checkbox */}
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {allSelected ? (
                <CheckSquare size={20} weight="fill" className="text-primary" />
              ) : (
                <Square size={20} className="text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('selectAll')}
              </span>
            </button>

            {/* Batch Approve Button */}
            {someSelected && (
              <Button
                onClick={handleBatchApprove}
                disabled={batchLoading}
                className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
              >
                {batchLoading
                  ? t('approving')
                  : t('approveTasks', { count: selectedCompletions.length })}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Approval Cards */}
      {count > 0 ? (
        <div className="space-y-4">
          {pendingCompletions.map((completion) => {
            const isSelected = selectedCompletions.includes(completion.id);
            return (
              <div key={completion.id} className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                  onClick={() => toggleCompletion(completion.id)}
                  className="mt-6 flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {isSelected ? (
                    <CheckSquare size={24} weight="fill" className="text-primary" />
                  ) : (
                    <Square size={24} className="text-gray-400" />
                  )}
                </button>

                {/* Approval Card */}
                <div className="flex-1">
                  <ApprovalCard
                    completion={completion}
                    onApprove={() => {
                      // Remove from selection if it was selected
                      setSelectedCompletions((prev) =>
                        prev.filter((id) => id !== completion.id)
                      );
                    }}
                    onFixRequest={() => {
                      // Remove from selection if it was selected
                      setSelectedCompletions((prev) =>
                        prev.filter((id) => id !== completion.id)
                      );
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} weight="fill" className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-text-main dark:text-white mb-2">
              {t('allCaughtUp')}
            </h3>
            <p className="text-sm text-text-muted dark:text-gray-400">
              {t('noTasksDescription')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
