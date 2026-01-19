'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus, Sparkle, Pause } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import RewardCard from './RewardCard';

// Dynamic import for heavy dialog component
const RewardFormDialog = dynamic(() => import('./RewardFormDialog'), {
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

interface RewardListProps {
  rewards: Reward[];
  rewardPurchases: Map<string, number>;
}

export default function RewardList({ rewards, rewardPurchases }: RewardListProps) {
  const t = useTranslations('rewards');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
            onClick={() => setFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${filter === 'all'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <Sparkle size={16} weight="bold" />
            {t('filter.all')}
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${filter === 'active'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <Sparkle size={16} weight="fill" />
            {t('filter.active')}
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${filter === 'inactive'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <Pause size={16} weight="bold" />
            {t('filter.inactive')}
          </button>
        </div>

        {/* New Reward Button */}
        <button
          onClick={handleNew}
          className="px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
        >
          <Plus size={18} weight="bold" />
          {t('newReward')}
        </button>
      </div>

      {/* Reward Groups */}
      {
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
                />
              ))}
            </div>
          </div>
        ))
      }

      {/* Reward Form Dialog */}
      <RewardFormDialog
        reward={selectedReward}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
      />
    </div >
  );
}
