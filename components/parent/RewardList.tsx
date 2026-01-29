'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus, Sparkle, Pause } from '@phosphor-icons/react/dist/ssr';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import RewardCard from './RewardCard';
import { ExchangeRate, DEFAULT_EXCHANGE_RATE } from '@/lib/utils/exchange-rate';

// Dynamic import for heavy dialog components
const RewardFormDialog = dynamic(() => import('./RewardFormDialog'), {
  ssr: false,
});

const GiftRewardDialog = dynamic(() => import('./GiftRewardDialog'), {
  ssr: false,
});

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
  created_at: string;
};

type Child = {
  id: string;
  name: string;
  avatar_url: string | null;
};

interface RewardListProps {
  rewards: Reward[];
  rewardPurchases: Map<string, number>;
  exchangeRate?: ExchangeRate;
  familyChildren?: Child[];
}

export default function RewardList({ rewards, rewardPurchases, exchangeRate = DEFAULT_EXCHANGE_RATE, familyChildren = [] }: RewardListProps) {
  const t = useTranslations('rewards');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGiftDialogOpen, setIsGiftDialogOpen] = useState(false);
  const [giftReward, setGiftReward] = useState<Reward | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const handleNew = useCallback(() => {
    setSelectedReward(null);
    setIsDialogOpen(true);
  }, []);

  const handleEdit = useCallback((reward: Reward) => {
    setSelectedReward(reward);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setSelectedReward(null);
    setIsDialogOpen(false);
  }, []);

  const handleGift = useCallback((reward: Reward) => {
    setGiftReward(reward);
    setIsGiftDialogOpen(true);
  }, []);

  const handleCloseGiftDialog = useCallback(() => {
    setGiftReward(null);
    setIsGiftDialogOpen(false);
  }, []);

  const filteredRewards = useMemo(() => rewards.filter((reward) => {
    if (filter === 'active') return reward.is_active;
    if (filter === 'inactive') return !reward.is_active;
    return true;
  }), [rewards, filter]);

  // Group rewards by category (memoized)
  const groupedRewards = useMemo(() => filteredRewards.reduce((acc, reward) => {
    const category = reward.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(reward);
    return acc;
  }, {} as Record<string, Reward[]>), [filteredRewards]);

  const categoryLabels: Record<string, string> = {
    screen: t('categoryLabels.screen'),
    autonomy: t('categoryLabels.autonomy'),
    experience: t('categoryLabels.experience'),
    savings: t('categoryLabels.savings'),
    other: t('categoryLabels.other'),
  };

  return (
    <div className="space-y-6">
      {/* Filters and New Button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${filter === 'all'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <Sparkle size={16} weight="bold" aria-hidden="true" />
            {t('filter.all')}
          </button>
          <button
            type="button"
            onClick={() => setFilter('active')}
            aria-pressed={filter === 'active'}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${filter === 'active'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <Sparkle size={16} weight="fill" aria-hidden="true" />
            {t('filter.active')}
          </button>
          <button
            type="button"
            onClick={() => setFilter('inactive')}
            aria-pressed={filter === 'inactive'}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${filter === 'inactive'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <Pause size={16} weight="bold" aria-hidden="true" />
            {t('filter.inactive')}
          </button>
        </div>

        {/* New Reward Button */}
        <button
          type="button"
          onClick={handleNew}
          className="px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Plus size={18} weight="bold" aria-hidden="true" />
          {t('newReward')}
        </button>
      </div>

      {/* Reward Groups */}
      {filteredRewards.length === 0 ? (
        <div className="text-center py-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <Sparkle size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
          <p className="text-lg font-semibold text-text-muted dark:text-gray-400 mb-2">
            {filter === 'inactive' ? t('noInactiveRewards') : t('noRewards')}
          </p>
          <p className="text-sm text-text-muted dark:text-gray-500 mb-4">
            {t('emptyDescription')}
          </p>
          <button
            type="button"
            onClick={handleNew}
            className="px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-md transition-all inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Plus size={18} weight="bold" aria-hidden="true" />
            {t('createFirstButton')}
          </button>
        </div>
      ) : (
        Object.entries(groupedRewards).map(([category, categoryRewards]) => (
          <div key={category}>
            <h2 className="text-xl font-bold text-text-main dark:text-white mb-4">
              {categoryLabels[category] || category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {categoryRewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  purchaseCount={rewardPurchases.get(reward.id) || 0}
                  onEdit={() => handleEdit(reward)}
                  onGift={familyChildren.length > 0 ? () => handleGift(reward) : undefined}
                />
              ))}
            </div>
          </div>
        ))
      )}

      {/* Reward Form Dialog */}
      <RewardFormDialog
        reward={selectedReward}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        exchangeRate={exchangeRate}
      />

      {/* Gift Reward Dialog */}
      <GiftRewardDialog
        reward={giftReward}
        familyChildren={familyChildren}
        isOpen={isGiftDialogOpen}
        onClose={handleCloseGiftDialog}
      />
    </div >
  );
}
