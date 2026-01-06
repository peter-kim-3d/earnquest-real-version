'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RewardFormDialog } from './RewardFormDialog';
import { RewardCard } from './RewardCard';

type Reward = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  points_cost: number;
  child_id: string | null;
  is_active: boolean;
  stock_quantity: number | null;
  template?: {
    name_default: string;
    icon: string;
  } | null;
};

type Child = {
  id: string;
  name: string;
  avatar_url: string | null;
};

type Template = {
  id: string;
  category: string;
  name_default: string;
  description_default: string | null;
  default_points_cost: number;
  icon: string;
};

type Props = {
  rewards: Reward[];
  familyChildren: Child[];
  templates: Template[];
};

export function RewardList({ rewards, familyChildren, templates }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedChild, setSelectedChild] = useState<string>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const categories = [
    { value: 'all', label: 'All Categories', icon: '🎁' },
    { value: 'experience', label: 'Experience', icon: '🎉' },
    { value: 'privilege', label: 'Privilege', icon: '👑' },
    { value: 'toy', label: 'Toy', icon: '🎁' },
    { value: 'outing', label: 'Outing', icon: '🚗' },
    { value: 'digital', label: 'Digital', icon: '📱' },
    { value: 'food', label: 'Food', icon: '🍕' },
  ];

  // Filter rewards
  const filteredRewards = rewards.filter((reward) => {
    const matchesSearch = reward.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || reward.category === selectedCategory;
    const matchesChild =
      selectedChild === 'all' ||
      (selectedChild === 'unassigned' && !reward.child_id) ||
      reward.child_id === selectedChild;
    const matchesActive = showInactive || reward.is_active;

    return matchesSearch && matchesCategory && matchesChild && matchesActive;
  });

  // Group by category
  const rewardsByCategory = filteredRewards.reduce((acc, reward) => {
    if (!acc[reward.category]) acc[reward.category] = [];
    acc[reward.category].push(reward);
    return acc;
  }, {} as Record<string, Reward[]>);

  return (
    <div>
      {/* Search and Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search rewards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-quest-purple"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>

            {/* Child Filter */}
            <select
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-quest-purple"
            >
              <option value="all">All Children</option>
              <option value="unassigned">Unassigned</option>
              {familyChildren.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.avatar_url} {child.name}
                </option>
              ))}
            </select>

            {/* Show Inactive Toggle */}
            <Button
              variant={showInactive ? 'default' : 'outline'}
              onClick={() => setShowInactive(!showInactive)}
              size="sm"
            >
              {showInactive ? 'Hiding' : 'Show'} Inactive
            </Button>

            {/* Add Reward Button */}
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-quest-purple">
              + Add Reward
            </Button>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || selectedCategory !== 'all' || selectedChild !== 'all') && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm text-gray-600">Filters:</span>
            {searchQuery && (
              <Badge variant="secondary">
                Search: {searchQuery}
                <button onClick={() => setSearchQuery('')} className="ml-1">
                  ✕
                </button>
              </Badge>
            )}
            {selectedCategory !== 'all' && (
              <Badge variant="secondary">
                {categories.find((c) => c.value === selectedCategory)?.label}
                <button onClick={() => setSelectedCategory('all')} className="ml-1">
                  ✕
                </button>
              </Badge>
            )}
            {selectedChild !== 'all' && (
              <Badge variant="secondary">
                {selectedChild === 'unassigned'
                  ? 'Unassigned'
                  : familyChildren.find((c) => c.id === selectedChild)?.name}
                <button onClick={() => setSelectedChild('all')} className="ml-1">
                  ✕
                </button>
              </Badge>
            )}
          </div>
        )}
      </Card>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredRewards.length} of {rewards.length} rewards
        </p>
        {filteredRewards.length === 0 && rewards.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedChild('all');
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Rewards List */}
      {filteredRewards.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-2">
            {rewards.length === 0 ? 'No rewards yet' : 'No rewards match your filters'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {rewards.length === 0
              ? 'Create your first reward to get started'
              : 'Try adjusting your filters or search query'}
          </p>
          {rewards.length === 0 && (
            <Button onClick={() => setCreateDialogOpen(true)} className="bg-quest-purple">
              + Create First Reward
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(rewardsByCategory).map(([category, categoryRewards]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span>{categories.find((c) => c.value === category)?.icon}</span>
                <span>{categories.find((c) => c.value === category)?.label || category}</span>
                <Badge variant="secondary" className="ml-2">
                  {categoryRewards.length}
                </Badge>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryRewards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    familyChildren={familyChildren}
                    templates={templates}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Reward Dialog */}
      <RewardFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        familyChildren={familyChildren}
        templates={templates}
      />
    </div>
  );
}
