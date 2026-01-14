'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Target } from '@phosphor-icons/react';
import { getTierForPoints, getTierLabel, TIER_RANGES, Tier } from '@/lib/utils/tiers';
import { EffortBadge, TierBadge } from '@/components/ui/EffortBadge';

interface Child {
  id: string;
  name: string;
}

interface Goal {
  id: string;
  child_id: string;
  name: string;
  description: string | null;
  target_points: number;
  current_points: number;
  tier: Tier;
  is_completed: boolean;
}

interface GoalFormDialogProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  childrenList: Child[];
}

export default function GoalFormDialog({ goal, isOpen, onClose, childrenList }: GoalFormDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    childId: '',
    name: '',
    description: '',
    targetPoints: 500,
  });

  // Update form when goal changes
  useEffect(() => {
    if (goal) {
      setFormData({
        childId: goal.child_id,
        name: goal.name,
        description: goal.description || '',
        targetPoints: goal.target_points,
      });
    } else {
      // Reset form for new goal
      setFormData({
        childId: childrenList.length === 1 ? childrenList[0].id : '',
        name: '',
        description: '',
        targetPoints: 500,
      });
    }
    setHasSubmitted(false);
  }, [goal, childrenList, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);

    if (!formData.name.trim() || !formData.childId) {
      return;
    }

    setLoading(true);

    try {
      if (goal) {
        // Update existing goal
        const response = await fetch('/api/goals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            goalId: goal.id,
            name: formData.name,
            description: formData.description || null,
            targetPoints: formData.targetPoints,
            reason: 'Updated by parent',
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update goal');
        }

        toast.success('Goal Updated', {
          description: `"${formData.name}" has been updated.`,
        });
      } else {
        // Create new goal
        const response = await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            childId: formData.childId,
            name: formData.name,
            description: formData.description || null,
            targetPoints: formData.targetPoints,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create goal');
        }

        toast.success('Goal Created', {
          description: `"${formData.name}" has been created for ${childrenList.find(c => c.id === formData.childId)?.name}.`,
        });
      }

      router.refresh();
      onClose();
    } catch (error: any) {
      console.error('Error saving goal:', error);
      toast.error('Save Failed', {
        description: error.message || 'Failed to save goal. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const tier = getTierForPoints(formData.targetPoints);
  const tierLabel = getTierLabel(tier);

  // Preset target amounts
  const presets = [
    { label: 'Small (100 XP)', value: 100, tier: 'small' as Tier },
    { label: 'Medium (250 XP)', value: 250, tier: 'medium' as Tier },
    { label: 'Large (500 XP)', value: 500, tier: 'large' as Tier },
    { label: 'XL (1000 XP)', value: 1000, tier: 'xl' as Tier },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Target size={24} className="text-primary" />
            {goal ? 'Edit Goal' : 'Create New Goal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Child Selection */}
          {!goal && childrenList.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="childId">For which child? *</Label>
              <div className="grid grid-cols-2 gap-2">
                {childrenList.map((child) => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, childId: child.id })}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      formData.childId === child.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <span className="font-semibold">{child.name}</span>
                  </button>
                ))}
              </div>
              {hasSubmitted && !formData.childId && (
                <p className="text-sm text-red-500 font-medium">Please select a child</p>
              )}
            </div>
          )}

          {/* Goal Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., LEGO Star Wars Set, New Video Game"
              maxLength={100}
              className={hasSubmitted && !formData.name.trim() ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {hasSubmitted && !formData.name.trim() && (
              <p className="text-sm text-red-500 font-medium">Goal name is required</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional details about the goal"
              className="w-full min-h-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={500}
            />
          </div>

          {/* Target Points */}
          <div className="space-y-2">
            <Label htmlFor="targetPoints">Target Points *</Label>
            <Input
              id="targetPoints"
              type="number"
              value={formData.targetPoints}
              onChange={(e) => setFormData({ ...formData, targetPoints: parseInt(e.target.value) || 0 })}
              min={50}
              max={5000}
              step={10}
              required
            />
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <Label>Quick Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, targetPoints: preset.value })}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    formData.targetPoints === preset.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{preset.label}</span>
                    <TierBadge tier={preset.tier} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tier Preview */}
          {formData.targetPoints > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Goal Tier:</span>
                <div className="flex items-center gap-2">
                  <TierBadge tier={tier} />
                  <EffortBadge tier={tier} variant="stars" size="sm" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {tier === 'small' && 'A quick goal - achievable in about a week'}
                {tier === 'medium' && 'A moderate goal - takes 2-3 weeks of saving'}
                {tier === 'large' && 'A bigger goal - requires patience and dedication'}
                {tier === 'xl' && 'An ambitious goal - a major milestone to work toward!'}
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm">
            <p className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
              How Goals Work
            </p>
            <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
              Your child can deposit points toward this goal from their dashboard.
              Once they reach the target, the goal is marked complete and they can redeem it!
            </p>
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
              {loading ? 'Saving...' : goal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
