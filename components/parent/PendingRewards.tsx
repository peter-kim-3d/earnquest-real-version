'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { AppIcon } from '@/components/ui/AppIcon';
import { getErrorMessage } from '@/lib/utils/error';

type PendingReward = {
  id: string;
  points_spent: number;
  purchased_at: string;
  rewards: {
    name: string;
    description: string | null;
    category: string;
    icon: string | null;
    screen_minutes: number | null;
  };
  children: {
    name: string;
  };
};

interface PendingRewardsProps {
  pendingRewards: PendingReward[];
}

export default function PendingRewards({ pendingRewards }: PendingRewardsProps) {
  const router = useRouter();
  const t = useTranslations('rewards.pending');
  const [loading, setLoading] = useState<string | null>(null);

  const handleGrant = async (purchaseId: string) => {
    setLoading(purchaseId);
    try {
      const response = await fetch('/api/rewards/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to grant reward');
      }

      router.refresh();
    } catch (error: unknown) {
      console.error('Failed to grant reward:', error);
      toast.error(t('toast.grantFailed'), { description: getErrorMessage(error) });
    } finally {
      setLoading(null);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 60) {
      return t('time.minutesAgo', { count: diffInMinutes });
    } else if (diffInMinutes < 1440) {
      return t('time.hoursAgo', { count: Math.floor(diffInMinutes / 60) });
    } else {
      return t('time.daysAgo', { count: Math.floor(diffInMinutes / 1440) });
    }
  };

  if (pendingRewards.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
        <Gift className="h-6 w-6 text-purple-500" aria-hidden="true" />
        {t('title')}
        <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-bold">
          {pendingRewards.length}
        </span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingRewards.map((purchase) => (
          <div
            key={purchase.id}
            className="rounded-xl bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 p-4 shadow-sm hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition-all"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="shrink-0 h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <AppIcon name={purchase.rewards.icon || 'redeem'} size={24} weight="duotone" className="text-purple-600 dark:text-purple-400" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="text-lg font-bold text-text-main dark:text-white mb-1">
                  {purchase.rewards.name}
                </h3>
                <p className="text-sm text-text-muted dark:text-gray-400 mb-2">
                  {t('requestedBy', { name: purchase.children.name })}
                </p>
                <div className="flex items-center gap-3 text-sm text-text-muted dark:text-gray-500">
                  <span>{formatTime(purchase.purchased_at)}</span>
                  <span aria-hidden="true">•</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400 tabular-nums">
                    {purchase.points_spent} QP
                  </span>
                  {purchase.rewards.screen_minutes && (
                    <>
                      <span aria-hidden="true">•</span>
                      <span className="tabular-nums">{purchase.rewards.screen_minutes} min</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Grant Button */}
            <button
              type="button"
              onClick={() => handleGrant(purchase.id)}
              disabled={loading === purchase.id}
              aria-busy={loading === purchase.id}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            >
              {loading === purchase.id ? (
                <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-4 w-4" aria-hidden="true" />
              )}
              {loading === purchase.id ? t('granting') : t('grantReward')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
