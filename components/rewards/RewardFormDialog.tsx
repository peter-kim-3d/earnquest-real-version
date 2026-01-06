'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createReward, updateReward } from '@/lib/actions/rewards';
import { useToast } from '@/hooks/use-toast';

type Reward = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  points_cost: number;
  child_id: string | null;
  stock_quantity: number | null;
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyChildren: Child[];
  templates: Template[];
  reward?: Reward;
};

const categories = [
  { value: 'experience', label: 'Experience', icon: '🎉' },
  { value: 'privilege', label: 'Privilege', icon: '👑' },
  { value: 'toy', label: 'Toy', icon: '🎁' },
  { value: 'outing', label: 'Outing', icon: '🚗' },
  { value: 'digital', label: 'Digital', icon: '📱' },
  { value: 'food', label: 'Food', icon: '🍕' },
];

export function RewardFormDialog({ open, onOpenChange, familyChildren, templates, reward }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(!reward);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('experience');
  const [description, setDescription] = useState('');
  const [pointsCost, setPointsCost] = useState(100);
  const [childId, setChildId] = useState<string>('');
  const [stockQuantity, setStockQuantity] = useState<number | null>(null);
  const [hasStock, setHasStock] = useState(false);

  // Initialize form with reward data if editing
  useEffect(() => {
    if (reward) {
      setName(reward.name);
      setCategory(reward.category);
      setDescription(reward.description || '');
      setPointsCost(reward.points_cost);
      setChildId(reward.child_id || '');
      setStockQuantity(reward.stock_quantity);
      setHasStock(reward.stock_quantity !== null);
      setShowTemplates(false);
    } else {
      // Reset form for new reward
      setName('');
      setCategory('experience');
      setDescription('');
      setPointsCost(100);
      setChildId('');
      setStockQuantity(null);
      setHasStock(false);
      setShowTemplates(true);
    }
  }, [reward, open]);

  const handleTemplateSelect = (template: Template) => {
    setName(template.name_default);
    setCategory(template.category);
    setDescription(template.description_default || '');
    setPointsCost(template.default_points_cost);
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: '❌ Validation Error',
        description: 'Reward name is required',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    if (pointsCost < 1 || pointsCost > 10000) {
      toast({
        title: '❌ Validation Error',
        description: 'Points must be between 1 and 10000',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setLoading(true);

    const rewardData = {
      name: name.trim(),
      category,
      description: description.trim() || undefined,
      points_cost: pointsCost,
      child_id: childId || null,
      stock_quantity: hasStock ? (stockQuantity || 0) : null,
    };

    const result = reward
      ? await updateReward(reward.id, rewardData)
      : await createReward(rewardData);

    setLoading(false);

    if (result.success) {
      toast({
        title: reward ? '✅ Reward Updated!' : '✅ Reward Created!',
        description: `"${name}" has been ${reward ? 'updated' : 'created'}`,
        duration: 3000,
      });
      onOpenChange(false);
    } else {
      toast({
        title: '❌ Error',
        description: result.error || `Failed to ${reward ? 'update' : 'create'} reward`,
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const filteredTemplates = templates.filter((t) => t.category === category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{reward ? 'Edit Reward' : 'Create New Reward'}</DialogTitle>
          <DialogDescription>
            {reward
              ? 'Update reward details below'
              : 'Create a custom reward or select from templates'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Template Quick Select - Only show when creating new reward */}
          {!reward && showTemplates && filteredTemplates.length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Quick Start Templates</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTemplates(false)}
                  className="text-xs"
                >
                  Create Custom
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {filteredTemplates.slice(0, 6).map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className="flex items-center gap-2 p-2 text-left bg-white border border-gray-200 rounded hover:border-quest-purple hover:bg-purple-50 transition-colors"
                  >
                    <span className="text-xl">{template.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {template.name_default}
                      </p>
                      <p className="text-xs text-gray-500">{template.default_points_cost} points</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Category */}
            <div>
              <Label htmlFor="category">Category</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                      category === cat.value
                        ? 'border-quest-purple bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <span className="text-xs font-medium">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reward Name */}
            <div>
              <Label htmlFor="name">Reward Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Extra 30 minutes screen time"
                className="mt-2"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about this reward..."
                className="mt-2"
              />
            </div>

            {/* Points Cost */}
            <div>
              <Label htmlFor="points">Points Cost *</Label>
              <Input
                id="points"
                type="number"
                min="1"
                max="10000"
                value={pointsCost}
                onChange={(e) => setPointsCost(parseInt(e.target.value) || 100)}
                className="mt-2"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                How many points this reward costs (1-10000)
              </p>
            </div>

            {/* Stock Quantity */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="has-stock"
                  checked={hasStock}
                  onChange={(e) => setHasStock(e.target.checked)}
                />
                <Label htmlFor="has-stock" className="cursor-pointer">
                  Limit stock quantity
                </Label>
              </div>
              {hasStock && (
                <Input
                  type="number"
                  min="0"
                  value={stockQuantity || 0}
                  onChange={(e) => setStockQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Number available"
                  className="mt-2"
                />
              )}
            </div>

            {/* Assign to Child */}
            <div>
              <Label htmlFor="child">Assign to Child (optional)</Label>
              <select
                id="child"
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-quest-purple"
              >
                <option value="">Available to all</option>
                {familyChildren.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.avatar_url} {child.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-quest-purple hover:bg-quest-purple/90"
            >
              {loading ? 'Saving...' : reward ? 'Update Reward' : 'Create Reward'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
