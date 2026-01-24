'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Check, Clock, X, Sparkle, Gift } from '@phosphor-icons/react/dist/ssr';
import { AppIcon } from '@/components/ui/AppIcon';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getRewardIconById } from '@/lib/reward-icons';

type Purchase = {
  id: string;
  status: string;
  points_spent: number;
  purchased_at: string;
  fulfilled_at: string | null;
  used_at: string | null;
  is_gift?: boolean;
  gift_message?: string | null;
  reward: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    icon: string | null;
    image_url: string | null;
    screen_minutes: number | null;
  };
};

interface TicketCardProps {
  purchase: Purchase;
  viewMode: 'child' | 'parent';
  onRequestUse?: (ticketId: string) => void;
  onApprove?: (ticketId: string) => void;
  onFulfill?: (ticketId: string) => void;
  onCancel?: (ticketId: string) => void;
  hasPendingRequest?: boolean;
}

export default function TicketCard({
  purchase,
  viewMode,
  onRequestUse,
  onApprove,
  onFulfill,
  onCancel,
  hasPendingRequest = false,
}: TicketCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('child.tickets.card');
  const [canceling, setCanceling] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Safety checks for reward data
  if (!purchase.reward) {
    console.error('TicketCard: Missing reward data', purchase);
    return null;
  }

  const isScreen = purchase.reward.category === 'screen';
  const isActive = purchase.status === 'active';
  const isPending = purchase.status === 'use_requested';
  const isUsed = purchase.status === 'used';
  const isGift = purchase.is_gift === true;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCancelClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmCancel = async () => {
    setShowConfirmDialog(false);
    setCanceling(true);
    try {
      const response = await fetch('/api/rewards/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId: purchase.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel');
      }

      const result = await response.json();
      toast.success(t('toast.canceled'), {
        description: t('toast.refunded', { points: result.refundedPoints }),
      });
      // Call onCancel callback to update parent state immediately
      onCancel?.(purchase.id);
      router.refresh();
    } catch (error: any) {
      console.error('Cancel error:', error);
      toast.error(t('toast.cancelFailed'), {
        description: error.message || t('toast.tryAgain'),
      });
    } finally {
      setCanceling(false);
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
      case 'item':
        return 'from-purple-500 to-purple-600';
      case 'savings':
        return 'from-teal-500 to-teal-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  // Determine what actions to show
  const showUseButton = viewMode === 'child' && isActive && isScreen;
  const showAskParentMessage =
    viewMode === 'child' && isActive && !isScreen;
  const showApproveButton = viewMode === 'parent' && isPending;
  const showFulfillButton =
    viewMode === 'parent' && isActive && !isScreen;
  // Don't show cancel button for gifts (nothing to refund)
  const showCancelButton = viewMode === 'child' && isActive && !isGift;

  return (
    <div
      className={`
        rounded-xl bg-white dark:bg-gray-800 border shadow-sm overflow-hidden
        ${isPending
          ? 'border-yellow-200 dark:border-yellow-800'
          : isUsed
            ? 'border-green-200 dark:border-green-800 opacity-60'
            : 'border-gray-200 dark:border-gray-700'
        }
      `}
    >
      {/* Status Badge */}
      <div
        className={`
          px-4 py-2 flex items-center justify-between
          ${isPending
            ? 'bg-yellow-50 dark:bg-yellow-900/20'
            : isUsed
              ? 'bg-green-50 dark:bg-green-900/20'
              : isGift
                ? 'bg-pink-50 dark:bg-pink-900/20'
                : 'bg-gray-50 dark:bg-gray-900/20'
          }
        `}
      >
        <div className="flex items-center gap-2">
          {isGift && (
            <>
              <Gift size={16} weight="fill" className="text-pink-500" />
              <span className="text-sm font-semibold text-pink-600 dark:text-pink-400">
                {t('gift')}
              </span>
              <span className="text-text-muted dark:text-gray-500">·</span>
            </>
          )}
          {isPending ? (
            <>
              <Clock size={16} className="text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-300">
                {t('waitingForParent')}
              </span>
            </>
          ) : isUsed ? (
            <>
              <Check size={16} weight="bold" className="text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                {t('used')}
              </span>
            </>
          ) : (
            <>
              <Sparkle size={16} weight="fill" className="text-primary" />
              <span className="text-sm font-semibold text-text-main dark:text-white">
                {t('active')}
              </span>
            </>
          )}
        </div>
        <span className="text-xs text-text-muted dark:text-gray-500">
          {formatDate(purchase.purchased_at)}
        </span>
      </div>



      {/* Icon/Image Area */}
      <div
        className={`aspect-video ${!purchase.reward.image_url ? `bg-gradient-to-br ${getCategoryColor(purchase.reward.category)}` : ''} flex items-center justify-center relative overflow-hidden`}
      >
        {purchase.reward.image_url ? (
          <Image
            src={purchase.reward.image_url}
            alt={purchase.reward.name}
            fill
            className="object-cover"
          />
        ) : (() => {
          const rewardIcon = getRewardIconById(purchase.reward.icon || 'gift');
          if (rewardIcon) {
            const IconComponent = rewardIcon.component;
            return <IconComponent size={48} weight="fill" className="text-white" />;
          }
          return <AppIcon name={purchase.reward.icon} size={48} className="text-white" />;
        })()}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-text-main dark:text-white mb-1">
          {purchase.reward.name}
        </h3>

        {purchase.reward.description && (
          <p className="text-sm text-text-muted dark:text-gray-400 mb-3 line-clamp-2">
            {purchase.reward.description}
          </p>
        )}

        {/* Gift Message */}
        {isGift && purchase.gift_message && (
          <div className="mb-3 p-3 rounded-lg bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800">
            <p className="text-sm text-pink-800 dark:text-pink-200 italic">
              &ldquo;{purchase.gift_message}&rdquo;
            </p>
          </div>
        )}

        {/* Only show points spent if not a gift */}
        {!isGift && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-muted dark:text-gray-500">
              {t('pointsSpent')}
            </span>
            <span className="font-bold text-primary tabular-nums">
              {purchase.points_spent} QP
            </span>
          </div>
        )}

        {purchase.reward.screen_minutes && (
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-text-muted dark:text-gray-500">
              {t('screenTime')}
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {t('minutes', { minutes: purchase.reward.screen_minutes })}
            </span>
          </div>
        )}

        {/* Child View Actions */}
        {viewMode === 'child' && (
          <>
            {showUseButton && (
              <button
                onClick={() => onRequestUse?.(purchase.id)}
                disabled={hasPendingRequest}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary hover:bg-primary/90 text-black font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
              >
                {hasPendingRequest ? (
                  <>
                    <Clock size={20} />
                    {t('screenTimeRunning')}
                  </>
                ) : (
                  <>
                    <Sparkle size={20} weight="fill" />
                    {t('useNow')}
                  </>
                )}
              </button>
            )}

            {showAskParentMessage && (
              <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium text-center">
                  {t('askParent')}
                </p>
              </div>
            )}

            {showCancelButton && (
              <button
                onClick={handleCancelClick}
                disabled={canceling}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X size={16} />
                {canceling ? t('canceling') : t('cancelTicket')}
              </button>
            )}
          </>
        )}

        {/* Parent View Actions */}
        {viewMode === 'parent' && (
          <>
            {showApproveButton && (
              <button
                onClick={() => onApprove?.(purchase.id)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary hover:bg-primary/90 text-black font-bold transition-all"
              >
                <Check size={20} weight="bold" />
                {t('approveUse')}
              </button>
            )}

            {showFulfillButton && (
              <button
                onClick={() => onFulfill?.(purchase.id)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-primary text-primary hover:bg-primary/10 font-bold transition-all"
              >
                <Check size={20} weight="bold" />
                {t('markAsGiven')}
              </button>
            )}
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-text-main dark:text-white">
              {t('cancelDialog.title')}
            </DialogTitle>
            <DialogDescription className="text-text-muted dark:text-text-muted">
              {t('cancelDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {t('cancelDialog.pointsToRefund')}
              </span>
              <span className="text-lg font-bold text-primary tabular-nums">
                {purchase.points_spent} QP
              </span>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              onClick={() => setShowConfirmDialog(false)}
              className="px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold transition-all"
            >
              {t('cancelDialog.goBack')}
            </button>
            <button
              onClick={handleConfirmCancel}
              disabled={canceling}
              className="px-6 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canceling ? t('canceling') : t('cancelDialog.confirm')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
