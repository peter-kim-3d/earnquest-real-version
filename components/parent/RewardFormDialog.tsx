'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ColorPicker } from '@/components/ui/color-picker';
import ValueContextPanel from '@/components/parent/ValueContextPanel';

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
};

interface RewardFormDialogProps {
  reward: Reward | null;
  isOpen: boolean;
  onClose: () => void;
  existingRewards?: Array<{ name: string; points_cost: number }>;
}

export default function RewardFormDialog({ reward, isOpen, onClose, existingRewards = [] }: RewardFormDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'screen',
    points_cost: 100,
    screen_minutes: null as number | null,
    weekly_limit: null as number | null,
    icon: 'redeem',
    is_active: true,
    color: '', // Custom color
  });

  // Update form when reward changes
  useEffect(() => {
    if (reward) {
      setFormData({
        name: reward.name,
        description: reward.description || '',
        category: reward.category,
        points_cost: reward.points_cost,
        screen_minutes: reward.screen_minutes,
        weekly_limit: reward.weekly_limit,
        icon: reward.icon || 'redeem',
        is_active: reward.is_active,
        color: (reward as any).settings?.color || '',
      });
    } else {
      // Reset form for new reward
      setFormData({
        name: '',
        description: '',
        category: 'screen',
        points_cost: 100,
        screen_minutes: null,
        weekly_limit: null,
        icon: 'redeem',
        is_active: true,
        color: '',
      });
    }
  }, [reward]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);

    if (!formData.name.trim()) {
      return;
    }

    setLoading(true);

    try {
      const url = reward ? '/api/rewards/update' : '/api/rewards/create';
      const method = reward ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(reward && { rewardId: reward.id }),
          ...formData,
          settings: {
            ...(reward as any)?.settings,
            ...(formData.color ? { color: formData.color } : {}),
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save reward');
      }

      router.refresh();
      onClose();
    } catch (error: any) {
      console.error('Error saving reward:', error);
      toast.error('Save Failed', { description: error.message || 'Failed to save reward. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'screen', label: '📺 Screen Time', icon: 'tv' },
    { value: 'autonomy', label: '🔓 Power Ups', icon: 'stars' },
    { value: 'experience', label: '🎉 Fun Stuff', icon: 'celebration' },
    { value: 'savings', label: '💰 Savings', icon: 'savings' },
    { value: 'other', label: '🎁 Other', icon: 'redeem' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {reward ? 'Edit Reward' : 'Create New Reward'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Reward Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Reward Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., 30 Minutes TV Time"
              maxLength={100}
              className={hasSubmitted && !formData.name.trim() ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {hasSubmitted && !formData.name.trim() && (
              <p className="text-sm text-red-500 font-medium">Reward name is required</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional details about the reward"
              className="w-full min-h-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={500}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value, icon: cat.icon })}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${formData.category === cat.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <span className="text-sm font-semibold">{cat.label}</span>
                </button>
              ))}
            </div>
            {/* Redemption Info Box */}
            <div className={`mt-3 p-4 rounded-lg text-sm transition-colors ${formData.category === 'screen' ? 'bg-purple-50 text-purple-900 dark:bg-purple-900/20 dark:text-purple-100' :
              formData.category === 'autonomy' ? 'bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100' :
                formData.category === 'savings' ? 'bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-100' :
                  'bg-orange-50 text-orange-900 dark:bg-orange-900/20 dark:text-orange-100'
              }`}>
              <p className="font-semibold mb-1">
                {formData.category === 'screen' ? '⏱️ How Screen Time Works:' :
                  formData.category === 'autonomy' ? '⚡ Instant Redemption:' :
                    formData.category === 'savings' ? '💰 Instant Deduction:' :
                      '🎁 Manual Fulfillment:'}
              </p>
              <p className="opacity-90 leading-relaxed">
                {formData.category === 'screen' ? 'Child requests usage → Parent approves → Timer starts automatically.' :
                  formData.category === 'autonomy' ? 'Reward is marked "Used" immediately upon purchase. No parent approval needed.' :
                    formData.category === 'savings' ? 'Points are deducted immediately. Great for long-term saving goals.' :
                      'Child purchases this reward → Parent marks it as "Given" when it is physically received.'}
              </p>
            </div>
          </div>

          {/* Points Cost */}
          <div className="space-y-2">
            <Label htmlFor="points_cost">Points Cost *</Label>
            <Input
              id="points_cost"
              type="number"
              value={formData.points_cost}
              onChange={(e) => setFormData({ ...formData, points_cost: parseInt(e.target.value) || 0 })}
              min={10}
              max={5000}
              step={10}
              required
            />
          </div>

          {/* Value Context Panel - Parent Guidance */}
          {formData.points_cost > 0 && (
            <ValueContextPanel
              pointsCost={formData.points_cost}
              existingRewards={existingRewards.filter(r => r.name !== formData.name)}
            />
          )}

          {/* Screen Minutes (optional) */}
          <div className="space-y-2">
            <Label htmlFor="screen_minutes">
              Screen Time (minutes)
              <span className="text-xs text-text-muted dark:text-gray-500 ml-2">Optional - for screen rewards</span>
            </Label>
            <Input
              id="screen_minutes"
              type="number"
              value={formData.screen_minutes || ''}
              onChange={(e) => setFormData({ ...formData, screen_minutes: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="e.g., 30"
              min={5}
              max={240}
              step={5}
            />
          </div>

          {/* Weekly Limit (optional) */}
          <div className="space-y-2">
            <Label htmlFor="weekly_limit">
              Weekly Purchase Limit
              <span className="text-xs text-text-muted dark:text-gray-500 ml-2">Optional - max purchases per week</span>
            </Label>
            <Input
              id="weekly_limit"
              type="number"
              value={formData.weekly_limit || ''}
              onChange={(e) => setFormData({ ...formData, weekly_limit: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="e.g., 2"
              min={1}
              max={10}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {loading ? 'Saving...' : reward ? 'Update Reward' : 'Create Reward'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
