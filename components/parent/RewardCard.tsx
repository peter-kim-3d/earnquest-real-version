'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Edit, Trash2, MoreVertical, Gift } from 'lucide-react';
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
import { AppIcon } from '@/components/ui/AppIcon';
import { getRewardIconById } from '@/lib/reward-icons';

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
  image_url: string | null;
};

interface RewardCardProps {
  reward: Reward;
  purchaseCount: number;
  onEdit: () => void;
  onGift?: () => void;
}

export default function RewardCard({ reward, purchaseCount, onEdit, onGift }: RewardCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const t = useTranslations('rewards');
  const tCommon = useTranslations('common');

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
      toast.error(t('card.deleteFailed'));
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
      {/* Icon/Image Header */}
      <div
        className={`aspect-video bg-gradient-to-br ${!customColor && !reward.image_url ? getCategoryColor(reward.category) : ''} flex items-center justify-center relative overflow-hidden cursor-pointer`}
        style={customColor && !reward.image_url ? { background: customColor } : {}}
        onClick={onEdit}
      >
        {reward.image_url ? (
          <Image
            src={reward.image_url}
            alt={reward.name}
            fill
            className="object-cover"
          />
        ) : (() => {
          const rewardIcon = getRewardIconById(reward.icon || 'gift');
          if (rewardIcon) {
            const IconComponent = rewardIcon.component;
            return <IconComponent size={48} weight="duotone" className="text-white" />;
          }
          return <AppIcon name={reward.icon || 'redeem'} className="text-white" size={48} weight="duotone" />;
        })()}

        {/* Status Badge */}
        {!reward.is_active && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm">
            <span className="text-xs font-semibold text-white">{t('card.inactive')}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3
            className="text-lg font-bold text-text-main dark:text-white flex-1 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
            onClick={onEdit}
          >
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
                {t('card.edit')}
              </DropdownMenuItem>
              {onGift && reward.is_active && (
                <DropdownMenuItem onClick={onGift}>
                  <Gift className="h-4 w-4 mr-2" />
                  {t('gift.menuItem')}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleToggleActive}>
                {reward.is_active ? t('actions.deactivate') : t('actions.activate')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 dark:text-red-400">
                <Trash2 className="h-4 w-4 mr-2" />
                {t('actions.delete')}
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
            <span className="text-text-muted dark:text-gray-500">{t('stats.cost')}</span>
            <span className="font-bold text-primary">{reward.points_cost} QP</span>
          </div>
          {reward.screen_minutes && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted dark:text-gray-500">{t('stats.screenTime')}</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {t('stats.minutes', { count: reward.screen_minutes })}
              </span>
            </div>
          )}
          {reward.weekly_limit && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted dark:text-gray-500">{t('stats.weeklyLimit')}</span>
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
              <span className="text-text-muted dark:text-gray-500">{t('stats.purchased30d')}</span>
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
        title={t('confirm.deleteTitle')}
        description={t('confirm.deleteDescription', { name: reward.name })}
        confirmLabel={tCommon('confirm.yesDelete')}
        cancelLabel={tCommon('confirm.noKeep')}
        variant="danger"
        isLoading={loading}
      />
    </div>
  );
}
