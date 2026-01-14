'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { AppIcon } from '@/components/ui/AppIcon';

type Reward = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  points_cost: number;
  screen_minutes: number | null;
  weekly_limit: number | null;
  is_active: boolean;
  icon: string | null;
};

interface RewardCardProps {
  reward: Reward;
  purchaseCount: number;
  onEdit: () => void;
}

export default function RewardCard({ reward, purchaseCount, onEdit }: RewardCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleToggleActive = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rewards/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId: reward.id,
          is_active: !reward.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update reward');
      }

      router.refresh();
    } catch (error) {
      console.error('Error toggling reward:', error);
      toast.error('Update Failed', { description: 'Failed to update reward. Please try again.' });
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
      const response = await fetch('/api/rewards/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId: reward.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete reward');
      }

      router.refresh();
    } catch (error) {
      console.error('Error deleting reward:', error);
      toast.error('Delete Failed', { description: 'Failed to delete reward. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'screen':
        return 'from-blue-500 to-blue-600';
      case 'autonomy':
        return 'from-orange-500 to-orange-600';
      case 'experience':
        return 'from-pink-500 to-red-500';
      case 'savings':
        return 'from-teal-500 to-teal-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const customColor = (reward as any).settings?.color;

  return (
    <div
      className={`rounded-xl bg-white dark:bg-gray-800 border shadow-card hover:shadow-card-hover overflow-hidden transition-all duration-300 ${reward.is_active
        ? 'border-gray-200 dark:border-gray-700'
        : 'border-gray-300 dark:border-gray-600 opacity-60'
        }`}
    >
      {/* Icon Header */}
      <div
        className={`aspect-video bg-gradient-to-br ${!customColor ? getCategoryColor(reward.category) : ''} p-6 flex items-center justify-center relative`}
        style={customColor ? { background: customColor } : {}}
      >
        <AppIcon name={reward.icon || 'redeem'} className="text-white" size={48} weight="duotone" />

        {/* Status Badge */}
        {!reward.is_active && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm">
            <span className="text-xs font-semibold text-white">Inactive</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-bold text-text-main dark:text-white flex-1 line-clamp-2">
            {reward.name}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                disabled={loading}
                className="h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors disabled:opacity-50"
              >
                <MoreVertical className="h-4 w-4 text-text-muted dark:text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleActive}>
                {reward.is_active ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 dark:text-red-400">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {reward.description && (
          <p className="text-sm text-text-muted dark:text-gray-400 mb-3 line-clamp-2">
            {reward.description}
          </p>
        )}

        {/* Reward Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted dark:text-gray-500">Cost:</span>
            <span className="font-bold text-primary">{reward.points_cost} QP</span>
          </div>
          {reward.screen_minutes && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted dark:text-gray-500">Screen Time:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {reward.screen_minutes} min
              </span>
            </div>
          )}
          {reward.weekly_limit && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted dark:text-gray-500">Weekly Limit:</span>
              <span className="font-semibold text-text-main dark:text-white">
                {reward.weekly_limit}×
              </span>
            </div>
          )}
        </div>

        {/* Purchase Stats */}
        {purchaseCount > 0 && (
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted dark:text-gray-500">Purchased (30d):</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">
                {purchaseCount}×
              </span>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Reward Permanently?"
        description={`Are you sure you want to permanently delete "${reward.name}"? This will remove it from all children and cannot be undone.`}
        confirmLabel="Yes, Delete"
        cancelLabel="No, Keep It"
        variant="danger"
        isLoading={loading}
      />
    </div>
  );
}
