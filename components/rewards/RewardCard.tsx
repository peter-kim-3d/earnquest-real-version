'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toggleRewardActive, deleteReward } from '@/lib/actions/rewards';
import { useToast } from '@/hooks/use-toast';
import { RewardFormDialog } from './RewardFormDialog';

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
  reward: Reward;
  familyChildren: Child[];
  templates?: Template[];
};

const categoryIcons: Record<string, string> = {
  experience: '🎉',
  privilege: '👑',
  toy: '🎁',
  outing: '🚗',
  digital: '📱',
  food: '🍕',
};

export function RewardCard({ reward, familyChildren, templates = [] }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const assignedChild = familyChildren.find((c) => c.id === reward.child_id);

  const handleToggleActive = async () => {
    setLoading(true);
    const result = await toggleRewardActive(reward.id);
    setLoading(false);

    if (result.success) {
      toast({
        title: reward.is_active ? 'Reward Deactivated' : 'Reward Activated',
        description: `"${reward.name}" is now ${reward.is_active ? 'inactive' : 'active'}`,
        duration: 3000,
      });
    } else {
      toast({
        title: '❌ Error',
        description: result.error || 'Failed to update reward',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${reward.name}"?`)) {
      return;
    }

    setLoading(true);
    const result = await deleteReward(reward.id);
    setLoading(false);

    if (result.success) {
      toast({
        title: '🗑️ Reward Deleted',
        description: `"${reward.name}" has been removed`,
        duration: 3000,
      });
    } else {
      toast({
        title: '❌ Error',
        description: result.error || 'Failed to delete reward',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  return (
    <>
      <Card className={`p-4 ${!reward.is_active ? 'opacity-60 border-dashed' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">
              {reward.template?.icon || categoryIcons[reward.category] || '🎁'}
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 leading-tight">{reward.name}</h3>
              {reward.description && (
                <p className="text-xs text-gray-600 mt-1">{reward.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Points Cost */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="bg-star-gold/20 text-star-gold border-star-gold/30">
            ⭐ {reward.points_cost} pts
          </Badge>
          {reward.stock_quantity !== null && (
            <Badge variant="outline" className="text-xs">
              Stock: {reward.stock_quantity}
            </Badge>
          )}
        </div>

        {/* Assigned Child */}
        <div className="mb-3">
          {assignedChild ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">For:</span>
              <div className="flex items-center gap-1">
                <span>{assignedChild.avatar_url || '👤'}</span>
                <span className="font-medium text-gray-900">{assignedChild.name}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded text-xs">Available to all</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditDialogOpen(true)}
            disabled={loading}
            className="flex-1"
          >
            ✏️ Edit
          </Button>
          <Button
            size="sm"
            variant={reward.is_active ? 'outline' : 'default'}
            onClick={handleToggleActive}
            disabled={loading}
            className={reward.is_active ? '' : 'bg-growth-green hover:bg-growth-green/90'}
          >
            {loading ? '...' : reward.is_active ? '⏸️' : '▶️'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            disabled={loading}
            className="text-red-600 hover:bg-red-50"
          >
            🗑️
          </Button>
        </div>
      </Card>

      {/* Edit Dialog */}
      <RewardFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        familyChildren={familyChildren}
        templates={templates}
        reward={reward}
      />
    </>
  );
}
