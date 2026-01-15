'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Sparkle, Timer, ListChecks, Checks } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/AppIcon';
import { toast } from 'sonner';
import TimerModal from './TimerModal';
import ChecklistModal from './ChecklistModal';

type Task = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  points: number;
  icon: string | null;
  image_url?: string | null;
  frequency: string;
  // v2 fields
  approval_type?: string;
  timer_minutes?: number | null;
  checklist?: string[] | null;
  metadata?: any;
};

interface TaskCardProps {
  task: Task;
  onComplete: (taskId: string, evidence?: {
    timerCompleted?: boolean;
    checklistState?: boolean[];
  }) => Promise<void>;
}

export default function TaskCard({ task, onComplete }: TaskCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  // Local state for optimistic updates
  const [localMetadata, setLocalMetadata] = useState(task.metadata || {});

  const handleComplete = async () => {
    // v2: Check approval type and show appropriate modal
    if (task.approval_type === 'timer' && task.timer_minutes) {
      setShowTimer(true);
      return;
    }

    if (task.approval_type === 'checklist' && task.checklist && task.checklist.length > 0) {
      setShowChecklist(true);
      return;
    }

    // For parent/auto approval, proceed directly
    setLoading(true);
    try {
      await onComplete(task.id);
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Submit Failed', { description: 'Failed to submit. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTimerComplete = async () => {
    setShowTimer(false);
    setLoading(true);
    try {
      await onComplete(task.id, { timerCompleted: true });
      // Reset local metadata
      setLocalMetadata({ ...localMetadata, timer_state: null });
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Submit Failed', { description: 'Failed to submit. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChecklistComplete = async (checklistState: boolean[]) => {
    setShowChecklist(false);
    setLoading(true);
    try {
      await onComplete(task.id, { checklistState });
    } catch (error) {
      console.error('Failed to complete task:', error);
      toast.error('Submit Failed', { description: 'Failed to submit. Please try again.' });
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

  // Get button text based on approval type
  const getButtonText = () => {
    if (loading) return 'Submitting...';
    if (task.approval_type === 'timer') {
      if (localMetadata?.timer_state?.remainingSeconds) {
        return '⏱️ Resume Timer';
      }
      return '⏱️ Start Timer';
    }
    if (task.approval_type === 'checklist') return '✓ Open Checklist';
    return 'I Did It! 🎉';
  };

  const getButtonIcon = () => {
    if (task.approval_type === 'timer') return <Timer size={20} className="mr-2" />;
    if (task.approval_type === 'checklist') return <ListChecks size={20} className="mr-2" />;
    return null;
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Icon/Image & Content */}
          <div className="flex items-start gap-4 flex-1">
            {/* Icon or Image */}
            {task.image_url ? (
              <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0">
                <Image
                  src={task.image_url}
                  alt={task.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className={`${getCategoryColor(task.category)} rounded-xl p-3 shrink-0`}>
                <AppIcon name={task.icon} size={24} className="text-black/60 dark:text-white/80" />
              </div>
            )}

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

                {/* v2: Timer Duration Badge */}
                {task.approval_type === 'timer' && task.timer_minutes && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${localMetadata?.timer_state?.remainingSeconds && localMetadata?.timer_state?.remainingSeconds < task.timer_minutes * 60
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    }`}>
                    <Timer className="w-3 h-3 mr-1" />
                    {localMetadata?.timer_state?.remainingSeconds
                      ? `${Math.ceil(localMetadata.timer_state.remainingSeconds / 60)}m left`
                      : `${task.timer_minutes}m`
                    }
                  </span>
                )}

                {/* Frequency */}
                <span className="text-xs text-text-muted dark:text-gray-500 capitalize">
                  {task.frequency}
                </span>
              </div>
            </div>
          </div>

          {/* Points Badge */}
          <div className="shrink-0">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Sparkle size={16} weight="fill" className="text-primary" />
              <span className="text-sm font-bold text-primary">
                +{task.points} XP
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleComplete}
          disabled={loading}
          className="mt-4 w-full px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {getButtonIcon()}
          {getButtonText()}
        </button>
      </div>

      {/* v2: Timer Modal */}
      {task.approval_type === 'timer' && task.timer_minutes && (
        <TimerModal
          taskName={task.name}
          timerMinutes={task.timer_minutes}
          initialState={localMetadata?.timer_state}
          isOpen={showTimer}
          onComplete={handleTimerComplete}
          onCancel={() => setShowTimer(false)} // Just close, state is saved internally via onSave
          onSave={async (state) => {
            // Optimistic update
            const newMetadata = { ...localMetadata, timer_state: state };
            setLocalMetadata(newMetadata);

            // Persist timer state to metadata
            try {
              await fetch('/api/tasks/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  taskId: task.id,
                  metadata: newMetadata
                })
              });

              router.refresh();

            } catch (err) {
              console.error("Failed to save timer state", err);
            }
          }}
        />
      )}

      {/* v2: Checklist Modal */}
      {task.approval_type === 'checklist' && task.checklist && task.checklist.length > 0 && (
        <ChecklistModal
          taskName={task.name}
          items={task.checklist}
          isOpen={showChecklist}
          onComplete={handleChecklistComplete}
          onCancel={() => setShowChecklist(false)}
        />
      )}
    </div>
  );
}
