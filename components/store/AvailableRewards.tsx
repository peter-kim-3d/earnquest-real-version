'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { purchaseReward } from '@/lib/actions/store';
import { useToast } from '@/hooks/use-toast';

type Reward = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  points_cost: number;
  child_id: string | null;
  stock_quantity: number | null;
  template?: {
    name_default: string;
    icon: string;
    description_default: string | null;
  } | null;
};

type Child = {
  id: string;
  name: string;
  avatar_url: string | null;
  points_balance: number;
};

type Props = {
  rewards: Reward[];
  familyChildren: Child[];
};

const categoryIcons: Record<string, string> = {
  experience: '🎉',
  privilege: '👑',
  toy: '🎁',
  outing: '🚗',
  digital: '📱',
  food: '🍕',
};

const categoryColors: Record<string, string> = {
  experience: 'bg-purple-100 text-purple-700 border-purple-200',
  privilege: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  toy: 'bg-pink-100 text-pink-700 border-pink-200',
  outing: 'bg-blue-100 text-blue-700 border-blue-200',
  digital: 'bg-green-100 text-green-700 border-green-200',
  food: 'bg-orange-100 text-orange-700 border-orange-200',
};

export function AvailableRewards({ rewards, familyChildren }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  const handlePurchaseClick = (reward: Reward) => {
    setSelectedReward(reward);

    // If reward is assigned to specific child, pre-select them
    if (reward.child_id) {
      setSelectedChildId(reward.child_id);
    } else {
      setSelectedChildId('');
    }

    setPurchaseDialogOpen(true);
  };

  const handlePurchaseConfirm = async () => {
    if (!selectedReward || !selectedChildId) {
      toast({
        title: '❌ Oops!',
        description: 'Please select a child to purchase for',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    const child = familyChildren.find((c) => c.id === selectedChildId);
    if (!child) return;

    // Check if child has enough points
    if (child.points_balance < selectedReward.points_cost) {
      toast({
        title: '❌ Not Enough Points',
        description: `${child.name} needs ${selectedReward.points_cost - child.points_balance} more points!`,
        variant: 'destructive',
        duration: 5000,
      });
      return;
    }

    setLoading(selectedReward.id);
    const result = await purchaseReward(selectedChildId, selectedReward.id);
    setLoading(null);
    setPurchaseDialogOpen(false);

    if (result.success) {
      toast({
        title: '🎉 Reward Purchased!',
        description: `${child.name} bought "${selectedReward.name}" for ${selectedReward.points_cost} points!`,
        duration: 5000,
      });
    } else {
      toast({
        title: '❌ Purchase Failed',
        description: result.error || 'Could not complete purchase. Try again!',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  // Group rewards by category
  const rewardsByCategory = rewards.reduce((acc, reward) => {
    if (!acc[reward.category]) acc[reward.category] = [];
    acc[reward.category].push(reward);
    return acc;
  }, {} as Record<string, Reward[]>);

  // Get eligible children for a reward
  const getEligibleChildren = (reward: Reward) => {
    if (reward.child_id) {
      return familyChildren.filter((c) => c.id === reward.child_id);
    }
    return familyChildren;
  };

  if (rewards.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-6xl mb-4">🎁</div>
        <p className="text-lg text-gray-600 mb-2">No rewards available yet!</p>
        <p className="text-sm text-gray-500">Check back soon for awesome rewards to buy.</p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(rewardsByCategory).map(([category, categoryRewards]) => (
          <div key={category}>
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-2xl">{categoryIcons[category] || '🎁'}</span>
              <span className="capitalize">{category}</span>
              <Badge variant="secondary" className="ml-2">
                {categoryRewards.length}
              </Badge>
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categoryRewards.map((reward) => {
                const eligibleChildren = getEligibleChildren(reward);
                const canAfford = eligibleChildren.some(
                  (c) => c.points_balance >= reward.points_cost
                );

                return (
                  <Card
                    key={reward.id}
                    className={`p-5 border-2 hover:shadow-lg transition-shadow ${
                      categoryColors[reward.category] || ''
                    }`}
                  >
                    {/* Reward Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-4xl">
                        {reward.template?.icon || categoryIcons[reward.category] || '🎁'}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                          {reward.name}
                        </h4>
                        {reward.description && (
                          <p className="text-sm text-gray-600">{reward.description}</p>
                        )}
                      </div>
                    </div>

                    {/* Points Cost */}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-star-gold hover:bg-star-gold text-white font-bold text-base px-3 py-1">
                        ⭐ {reward.points_cost} points
                      </Badge>
                      {reward.stock_quantity !== null && reward.stock_quantity > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {reward.stock_quantity} left
                        </Badge>
                      )}
                      {reward.stock_quantity === 0 && (
                        <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                          Out of Stock
                        </Badge>
                      )}
                    </div>

                    {/* Assigned Child Info */}
                    {reward.child_id && (
                      <p className="text-xs text-gray-600 mb-3">
                        For: {eligibleChildren[0]?.name}
                      </p>
                    )}

                    {/* Purchase Button */}
                    <Button
                      onClick={() => handlePurchaseClick(reward)}
                      disabled={
                        loading === reward.id ||
                        reward.stock_quantity === 0 ||
                        !canAfford
                      }
                      className={`w-full font-semibold ${
                        canAfford
                          ? 'bg-quest-purple hover:bg-quest-purple/90'
                          : 'bg-gray-300 hover:bg-gray-300'
                      }`}
                      size="lg"
                    >
                      {loading === reward.id
                        ? '...'
                        : reward.stock_quantity === 0
                        ? 'Out of Stock'
                        : canAfford
                        ? '🛒 Buy Now'
                        : '🔒 Not Enough Points'}
                    </Button>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Purchase Dialog */}
      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Purchase Reward</DialogTitle>
            <DialogDescription>
              Select which child is purchasing this reward.
            </DialogDescription>
          </DialogHeader>

          {selectedReward && (
            <div className="py-4">
              {/* Reward Info */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                <span className="text-3xl">
                  {selectedReward.template?.icon || categoryIcons[selectedReward.category] || '🎁'}
                </span>
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedReward.name}</h4>
                  <p className="text-sm text-star-gold font-bold">
                    ⭐ {selectedReward.points_cost} points
                  </p>
                </div>
              </div>

              {/* Child Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Who is buying this?
                </label>
                <div className="space-y-2">
                  {getEligibleChildren(selectedReward).map((child) => {
                    const hasEnough = child.points_balance >= selectedReward.points_cost;
                    const remaining = child.points_balance - selectedReward.points_cost;

                    return (
                      <button
                        key={child.id}
                        onClick={() => setSelectedChildId(child.id)}
                        disabled={!hasEnough}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                          selectedChildId === child.id
                            ? 'border-quest-purple bg-purple-50'
                            : hasEnough
                            ? 'border-gray-200 hover:border-gray-300'
                            : 'border-gray-200 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{child.avatar_url || '👤'}</span>
                          <div className="text-left">
                            <p className="font-semibold text-gray-900">{child.name}</p>
                            <p className="text-xs text-gray-600">
                              Has ⭐ {child.points_balance} points
                            </p>
                          </div>
                        </div>
                        {hasEnough ? (
                          <p className="text-sm text-growth-green font-medium">
                            {remaining} left after
                          </p>
                        ) : (
                          <p className="text-sm text-red-600 font-medium">Not enough</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePurchaseConfirm}
              disabled={!selectedChildId}
              className="bg-quest-purple hover:bg-quest-purple/90"
            >
              Confirm Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
