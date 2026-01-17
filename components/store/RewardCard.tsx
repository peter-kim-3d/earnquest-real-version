'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Image from 'next/image';
import { Sparkle, Lock } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/AppIcon';
import { toast } from 'sonner';
import { EffortBadge, TierBadge } from '@/components/ui/EffortBadge';
import { getTierForPoints, Tier } from '@/lib/utils/tiers';
import { getRewardIconById } from '@/lib/reward-icons';

type Reward = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  points_cost: number;
  icon: string | null;
  image_url: string | null;
  screen_minutes: number | null;
  weekly_limit: number | null;
  tier?: Tier;
};

interface RewardCardProps {
  reward: Reward;
  childId: string;
  currentBalance: number;
  screenUsed: number;
  screenBudget: number;
}

export default function RewardCard({
  reward,
  childId,
  currentBalance,
  screenUsed,
  screenBudget,
}: RewardCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);

  const canAfford = currentBalance >= reward.points_cost;
  const isScreenReward = reward.category === 'screen';
  const screenRemaining = screenBudget - screenUsed;
  const hasScreenBudget = !isScreenReward || (reward.screen_minutes || 0) <= screenRemaining;

  const canPurchase = canAfford && hasScreenBudget;

  // Get tier for effort badge display
  const tier = reward.tier || getTierForPoints(reward.points_cost);

  // Category colors
  const getCategoryGradient = (category: string) => {
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

  const handlePurchase = async () => {
    if (!canPurchase) return;

    setLoading(true);
    try {
      const response = await fetch('/api/rewards/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardId: reward.id,
          childId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to purchase');
      }

      const result = await response.json();
      toast.success('Ticket purchased!', {
        description: `You now have ${result.newBalance} QP left.`,
      });
      router.refresh();
      router.push(`/${locale}/child/tickets`);
    } catch (error: any) {
      console.error('Failed to purchase:', error);
      toast.error('Purchase failed', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`
        group rounded-xl bg-white dark:bg-gray-800 border shadow-card hover:shadow-card-hover transition-all duration-normal
        ${canPurchase ? 'border-gray-200 dark:border-gray-700 hover:border-primary/50' : 'border-gray-300 dark:border-gray-600 opacity-60'}
      `}
    >
      {/* Icon/Image Area */}
      <div className={`aspect-square rounded-t-xl ${!reward.image_url ? `bg-gradient-to-br ${getCategoryGradient(reward.category)}` : ''} flex items-center justify-center relative overflow-hidden`}>
        {/* Category Badge */}
        <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-10">
          <span className="text-xs font-bold text-gray-900 dark:text-white capitalize">
            {reward.category}
          </span>
        </div>

        {/* Icon or Image */}
        {reward.image_url ? (
          <Image
            src={reward.image_url}
            alt={reward.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex justify-center text-white">
            {(() => {
              const rewardIcon = getRewardIconById(reward.icon || 'gift');
              if (rewardIcon) {
                const IconComponent = rewardIcon.component;
                return <IconComponent size={64} weight="fill" className="drop-shadow-sm" />;
              }
              return <AppIcon name={reward.icon} size={64} className="drop-shadow-sm" />;
            })()}
          </div>
        )}

        {/* Screen Minutes Badge */}
        {isScreenReward && reward.screen_minutes && (
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm z-10">
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              {reward.screen_minutes} min
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-text-main dark:text-white mb-1 line-clamp-2">
          {reward.name}
        </h3>

        {reward.description && (
          <p className="text-sm text-text-muted dark:text-gray-400 mb-3 line-clamp-2">
            {reward.description}
          </p>
        )}

        {/* Tier & Effort Badge */}
        <div className="flex items-center gap-2 mb-2">
          <TierBadge tier={tier} />
          <EffortBadge tier={tier} variant="stars" size="sm" />
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Sparkle size={16} weight="fill" className="text-primary" />
            <span className="text-xl font-black text-text-main dark:text-white">
              {reward.points_cost}
            </span>
            <span className="text-sm text-text-muted dark:text-gray-400">
              XP
            </span>
          </div>

          {reward.weekly_limit && (
            <span className="text-xs text-text-muted dark:text-gray-500">
              {reward.weekly_limit}x/week max
            </span>
          )}
        </div>

        {/* Progress Bar for Locked Rewards */}
        {!canAfford && (
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-text-muted dark:text-gray-400">
                {Math.floor((currentBalance / reward.points_cost) * 100)}% Saved
              </span>
              <span className="text-primary font-bold">
                {reward.points_cost - currentBalance} QP to go
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-slow"
                style={{
                  width: `${Math.min((currentBalance / reward.points_cost) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Purchase Button */}
        <button
          onClick={handlePurchase}
          disabled={!canPurchase || loading}
          className={`
            w-full px-4 py-3 rounded-xl font-bold text-sm transition-all
            ${canPurchase
              ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {loading ? (
            'Purchasing...'
          ) : !canAfford ? (
            <span className="flex items-center justify-center gap-2">
              <Lock size={16} />
              Locked
            </span>
          ) : !hasScreenBudget ? (
            <span className="flex items-center justify-center gap-2">
              <Lock size={16} />
              Screen limit reached
            </span>
          ) : (
            'Buy Now'
          )}
        </button>
      </div>
    </div>
  );
}
