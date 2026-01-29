'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Gift, X, Check, CircleNotch } from '@phosphor-icons/react/dist/ssr';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { getErrorMessage } from '@/lib/utils/error';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppIcon } from '@/components/ui/AppIcon';
import { getRewardIconById } from '@/lib/reward-icons';

type Reward = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  points_cost: number;
  screen_minutes: number | null;
  icon: string | null;
  image_url: string | null;
};

type Child = {
  id: string;
  name: string;
  avatar_url: string | null;
};

interface GiftRewardDialogProps {
  reward: Reward | null;
  familyChildren: Child[];
  isOpen: boolean;
  onClose: () => void;
}

export default function GiftRewardDialog({
  reward,
  familyChildren,
  isOpen,
  onClose,
}: GiftRewardDialogProps) {
  const router = useRouter();
  const t = useTranslations('rewards');
  const tCommon = useTranslations('common');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setSelectedChildId(null);
    setMessage('');
    onClose();
  };

  const handleGift = async () => {
    if (!reward || !selectedChildId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/rewards/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId: reward.id,
          childId: selectedChildId,
          message: message.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to gift reward');
      }

      const result = await response.json();
      toast.success(t('gift.success'), {
        description: t('gift.successDescription', {
          name: result.childName,
          reward: result.rewardName,
        }),
      });

      handleClose();
      router.refresh();
    } catch (error: unknown) {
      console.error('Gift error:', error);
      toast.error(t('gift.failed'), { description: getErrorMessage(error) });
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

  if (!reward) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-text-main dark:text-white">
            <Gift size={24} weight="fill" className="text-primary" aria-hidden="true" />
            {t('gift.title')}
          </DialogTitle>
          <DialogDescription className="text-text-muted dark:text-gray-400">
            {t('gift.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Reward Preview */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div
              className={`h-14 w-14 rounded-lg bg-gradient-to-br ${!reward.image_url ? getCategoryColor(reward.category) : ''} flex items-center justify-center overflow-hidden flex-shrink-0`}
            >
              {reward.image_url ? (
                <Image
                  src={reward.image_url}
                  alt={reward.name}
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              ) : (() => {
                const rewardIcon = getRewardIconById(reward.icon || 'gift');
                if (rewardIcon) {
                  const IconComponent = rewardIcon.component;
                  return <IconComponent size={28} weight="duotone" className="text-white" />;
                }
                return <AppIcon name={reward.icon || 'redeem'} className="text-white" size={28} weight="duotone" />;
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-text-main dark:text-white truncate">
                {reward.name}
              </h4>
              {reward.screen_minutes && (
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {t('stats.minutes', { count: reward.screen_minutes })}
                </p>
              )}
            </div>
          </div>

          {/* Child Selection */}
          <div>
            <label className="block text-sm font-semibold text-text-main dark:text-white mb-3">
              {t('gift.selectChild')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {familyChildren.map((child) => (
                <button
                  type="button"
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  aria-pressed={selectedChildId === child.id}
                  className={`
                    relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                    ${selectedChildId === child.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  {/* Selection indicator */}
                  {selectedChildId === child.id && (
                    <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check size={14} weight="bold" className="text-white" aria-hidden="true" />
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                    {child.avatar_url ? (
                      <Image
                        src={child.avatar_url}
                        alt={child.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-xl font-bold text-gray-500 dark:text-gray-400">
                        {child.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <span className="text-sm font-semibold text-text-main dark:text-white truncate max-w-full">
                    {child.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Gift Message */}
          <div>
            <label className="block text-sm font-semibold text-text-main dark:text-white mb-2">
              {t('gift.messageLabel')}{' '}
              <span className="font-normal text-text-muted dark:text-gray-500">
                ({tCommon('form.optional')})
              </span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('gift.messagePlaceholder')}
              rows={2}
              maxLength={500}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-text-main dark:text-white placeholder-text-muted dark:placeholder-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
              {message.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2"
          >
            {tCommon('buttons.cancel')}
          </button>
          <button
            type="button"
            onClick={handleGift}
            disabled={loading || !selectedChildId}
            aria-busy={loading}
            className="px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-black font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {loading ? (
              <CircleNotch size={18} className="motion-safe:animate-spin" aria-hidden="true" />
            ) : (
              <Gift size={18} weight="fill" aria-hidden="true" />
            )}
            {loading ? t('gift.sending') : t('gift.send')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
