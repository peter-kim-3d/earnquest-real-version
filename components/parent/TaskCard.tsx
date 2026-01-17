'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PencilSimple, Trash, DotsThreeVertical, Archive, ArrowCounterClockwise, Users, Checks } from '@phosphor-icons/react';
import { ALL_AVATARS } from '@/lib/avatars';
import { AppIcon } from '@/components/ui/AppIcon';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ConfirmDialog from '@/components/ui/confirm-dialog';

type Task = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  points: number;
  frequency: string;
  approval_type: string;
  is_active: boolean;
  icon: string | null;
  image_url: string | null;
  archived_at: string | null;
  child_id: string | null;
};

type Assignee = {
  id: string;
  name: string;
  avatar_url: string | null;
} | null | undefined;

interface TaskCardProps {
  task: Task;
  completionCount: number;
  pendingCount?: number;
  assignee?: Assignee;
  onEdit: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export default function TaskCard({
  task,
  completionCount,
  pendingCount = 0,
  assignee,
  onEdit,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}: TaskCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');

  const handleToggleActive = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tasks/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          is_active: !task.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      router.refresh();
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error(t('card.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tasks/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      router.refresh();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error(t('card.deleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    const isArchived = task.archived_at !== null;
    const action = isArchived ? 'unarchive' : 'archive';

    setLoading(true);
    try {
      const response = await fetch('/api/tasks/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          archive: !isArchived,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} task`);
      }

      router.refresh();
    } catch (error) {
      console.error(`Error ${action}ing task:`, error);
      toast.error(t('card.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    // Check if task has custom color in metadata
    if ((task as any).metadata?.color) {
      return ''; // Allow custom color to take precedence via style
    }

    switch (category) {
      case 'hygiene':
        return 'from-blue-500 to-cyan-500';
      case 'chores':
        return 'from-orange-500 to-amber-500';
      case 'learning':
        return 'from-purple-500 to-pink-500';
      case 'exercise':
        return 'from-red-500 to-orange-500';
      case 'creativity':
        return 'from-pink-500 to-rose-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily':
        return t('frequencies.daily');
      case 'weekly':
        return t('frequencies.weekly');
      case 'monthly':
        return t('frequencies.monthly');
      case 'one_time':
        return t('frequencies.oneTime');
      default:
        return frequency;
    }
  };

  const customColor = (task as any).metadata?.color;

  return (
    <div
      className={`rounded-xl bg-white dark:bg-gray-800 border shadow-card hover:shadow-card-hover overflow-hidden transition-all duration-normal ${task.is_active
        ? 'border-gray-200 dark:border-gray-700'
        : 'border-gray-300 dark:border-gray-600 opacity-60'
        }`}
    >


      {/* Icon/Image Header */}
      <div
        className={`aspect-video ${task.image_url ? '' : `bg-gradient-to-br ${!customColor ? getCategoryColor(task.category) : ''}`} p-6 flex items-center justify-center relative cursor-pointer overflow-hidden`}
        style={customColor && !task.image_url ? { background: customColor } : {}}
        onClick={isSelectionMode ? onToggleSelect : onEdit}
      >
        {/* Selection Overlay */}
        {isSelectionMode && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 transition-all">
            <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
              ? 'bg-primary border-primary scale-110'
              : 'bg-white/20 border-white hover:bg-white/30'
              }`}>
              {isSelected && <Checks size={20} weight="bold" className="text-white" />}
            </div>
          </div>
        )}

        {/* Display image if available, otherwise show icon */}
        {task.image_url ? (
          <Image
            src={task.image_url}
            alt={task.name}
            fill
            className="object-cover"
          />
        ) : (
          <AppIcon name={task.icon} size={48} className="text-white" />
        )}

        {/* Assignee Badge */}
        <div className="absolute top-3 left-3">
          {assignee ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/10">
              {(() => {
                let avatarSrc = assignee.avatar_url;
                if (avatarSrc?.startsWith('preset:')) {
                  const presetId = avatarSrc.split(':')[1];
                  avatarSrc = ALL_AVATARS[presetId]?.image || null;
                }

                if (avatarSrc) {
                  return (
                    <Image
                      src={avatarSrc}
                      alt={assignee.name}
                      width={16}
                      height={16}
                      className="rounded-full object-cover"
                    />
                  );
                }

                return (
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
                    {assignee.name[0].toUpperCase()}
                  </div>
                );
              })()}
              <span className="text-xs font-medium text-white max-w-20 truncate">
                {assignee.name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/10">
              <Users size={14} className="text-white" />
              <span className="text-xs font-medium text-white">{t('card.shared')}</span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        {!task.is_active && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/10">
            <span className="text-xs font-semibold text-white">{t('card.inactive')}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3
            className="text-lg font-bold text-text-main dark:text-white flex-1 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
            onClick={isSelectionMode ? undefined : onEdit}
          >
            {task.name}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={loading}
                className="h-11 w-11 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <DotsThreeVertical size={20} className="text-text-muted dark:text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <PencilSimple size={16} className="mr-2" />
                {t('card.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleActive}>
                {task.is_active ? t('card.deactivate') : t('card.activate')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleArchive}>
                {task.archived_at ? (
                  <>
                    <ArrowCounterClockwise size={16} className="mr-2" />
                    {t('card.unarchive')}
                  </>
                ) : (
                  <>
                    <Archive size={16} className="mr-2" />
                    {t('card.archive')}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 dark:text-red-400">
                <Trash size={16} className="mr-2" />
                {t('card.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {task.description && (
          <p className="text-sm text-text-muted dark:text-gray-400 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Task Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted dark:text-gray-500">{t('card.points')}</span>
            <span className="font-bold text-primary">{task.points} QP</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted dark:text-gray-500">{t('card.frequency')}</span>
            <span className="font-semibold text-text-main dark:text-white">
              {getFrequencyLabel(task.frequency)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted dark:text-gray-500">{t('card.approval')}</span>
            <span className="font-semibold text-text-main dark:text-white">
              {task.approval_type === 'auto' ? t('card.autoApproval') : t('card.manualApproval')}
            </span>
          </div>
        </div>

        {/* Completion Stats & Pending Badge */}
        {(completionCount > 0 || pendingCount > 0) && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {completionCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted dark:text-gray-500">{t('card.completed30d')}</span>
                <span className="font-bold text-green-600 dark:text-green-400">
                  {completionCount}×
                </span>
              </div>
            )}

            {pendingCount > 0 && (
              <div className="flex items-center justify-between text-sm bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg">
                <span className="text-orange-700 dark:text-orange-300 font-medium flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                  {t('card.needsApproval')}
                </span>
                <span className="font-bold text-orange-700 dark:text-orange-300">
                  {pendingCount}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title={t('card.deleteTitle')}
        description={t('card.deleteDescription', { name: task.name })}
        confirmLabel={tCommon('confirm.yesDelete')}
        cancelLabel={tCommon('confirm.noKeep')}
        variant="danger"
        isLoading={loading}
      />
    </div>
  );
}
