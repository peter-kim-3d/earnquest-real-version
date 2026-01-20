'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Target, Info, Sparkle } from '@phosphor-icons/react/dist/ssr';
import { getTierForPoints, getTierLabel, TIER_RANGES, Tier } from '@/lib/utils/tiers';
import { EffortBadge, TierBadge } from '@/components/ui/EffortBadge';
import { useTranslations } from 'next-intl';
import {
  calculatePointsFromDollars,
  calculateDollarValue,
  formatCentsAsDollars,
  dollarsToCents,
  calculateTimeEstimate,
  ExchangeRate,
  DEFAULT_EXCHANGE_RATE,
} from '@/lib/utils/exchange-rate';
import {
  calculateTotalMilestoneBonus,
  calculateNetPointsNeeded,
  getSuggestedMilestoneBonuses,
  MILESTONE_PERCENTAGES,
} from '@/lib/utils/milestones';
import { MilestoneBonuses } from '@/lib/types/goal';

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
  real_value_cents?: number | null;
  milestone_bonuses?: MilestoneBonuses | null;
}

interface GoalFormDialogProps {
  goal: Goal | null;
  isOpen: boolean;
  onClose: () => void;
  childrenList: Child[];
  exchangeRate?: ExchangeRate;
}

export default function GoalFormDialog({ goal, isOpen, onClose, childrenList, exchangeRate = DEFAULT_EXCHANGE_RATE }: GoalFormDialogProps) {
  const router = useRouter();
  const t = useTranslations('goals');
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    childId: '',
    name: '',
    description: '',
    targetPoints: 1000,
    dollarValue: '', // For $ input (optional)
  });

  // Milestone bonuses state
  const [enableMilestones, setEnableMilestones] = useState(false);
  const [milestoneValues, setMilestoneValues] = useState<MilestoneBonuses>({
    25: 0,
    50: 0,
    75: 0,
  });

  // Calculate suggested bonuses when target changes
  const suggestedBonuses = useMemo(
    () => getSuggestedMilestoneBonuses(formData.targetPoints),
    [formData.targetPoints]
  );

  // Update form when goal changes
  useEffect(() => {
    if (goal) {
      setFormData({
        childId: goal.child_id,
        name: goal.name,
        description: goal.description || '',
        targetPoints: goal.target_points,
        dollarValue: goal.real_value_cents ? (goal.real_value_cents / 100).toString() : '',
      });
      // Load existing milestones
      if (goal.milestone_bonuses && Object.keys(goal.milestone_bonuses).length > 0) {
        setEnableMilestones(true);
        setMilestoneValues({
          25: goal.milestone_bonuses[25] || 0,
          50: goal.milestone_bonuses[50] || 0,
          75: goal.milestone_bonuses[75] || 0,
        });
      } else {
        setEnableMilestones(false);
        setMilestoneValues({ 25: 0, 50: 0, 75: 0 });
      }
    } else {
      // Reset form for new goal
      setFormData({
        childId: childrenList.length === 1 ? childrenList[0].id : '',
        name: '',
        description: '',
        targetPoints: 1000,
        dollarValue: '',
      });
      setEnableMilestones(false);
      setMilestoneValues({ 25: 0, 50: 0, 75: 0 });
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

    // Prepare milestone bonuses
    const m25 = milestoneValues[25] ?? 0;
    const m50 = milestoneValues[50] ?? 0;
    const m75 = milestoneValues[75] ?? 0;
    const milestoneBonuses: MilestoneBonuses | undefined = enableMilestones
      ? {
          ...(m25 > 0 ? { 25: m25 } : {}),
          ...(m50 > 0 ? { 50: m50 } : {}),
          ...(m75 > 0 ? { 75: m75 } : {}),
        }
      : undefined;

    // Calculate real value in cents if dollar value provided
    const realValueCents = formData.dollarValue
      ? dollarsToCents(parseFloat(formData.dollarValue))
      : undefined;

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
            realValueCents,
            milestoneBonuses,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to update goal');
        }

        toast.success(t('toast.updated'), {
          description: t('toast.updatedDescription', { name: formData.name }),
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
            realValueCents,
            milestoneBonuses,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create goal');
        }

        toast.success(t('toast.created'), {
          description: t('toast.createdDescription', {
            name: formData.name,
            childName: childrenList.find(c => c.id === formData.childId)?.name || ''
          }),
        });
      }

      router.refresh();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error saving goal:', error);
      toast.error(t('toast.saveFailed'), {
        description: errorMessage || t('toast.error'),
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle dollar value change - auto-calculate points
  const handleDollarValueChange = (value: string) => {
    setFormData(prev => ({ ...prev, dollarValue: value }));
    if (value && !isNaN(parseFloat(value))) {
      const dollars = parseFloat(value);
      const points = calculatePointsFromDollars(dollars, exchangeRate);
      setFormData(prev => ({ ...prev, dollarValue: value, targetPoints: points }));
    }
  };

  // Apply suggested milestone bonuses
  const applySuggestedBonuses = () => {
    setMilestoneValues(suggestedBonuses);
  };

  // Calculate total bonus and net points needed
  const totalBonus = enableMilestones ? calculateTotalMilestoneBonus(milestoneValues) : 0;
  const netPointsNeeded = enableMilestones
    ? calculateNetPointsNeeded(formData.targetPoints, milestoneValues)
    : formData.targetPoints;
  const timeEstimate = calculateTimeEstimate(formData.targetPoints, 0, 220);

  const tier = getTierForPoints(formData.targetPoints);
  const tierLabel = getTierLabel(tier);

  // Preset target amounts (doubled for v2)
  const presets = [
    { label: t('form.presets.small', { points: 200 }), value: 200, tier: 'small' as Tier },
    { label: t('form.presets.medium', { points: 500 }), value: 500, tier: 'medium' as Tier },
    { label: t('form.presets.large', { points: 1000 }), value: 1000, tier: 'large' as Tier },
    { label: t('form.presets.xl', { points: 2000 }), value: 2000, tier: 'xl' as Tier },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Target size={24} className="text-primary" />
            {goal ? t('form.editTitle') : t('form.createTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Child Selection */}
          {!goal && childrenList.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="childId">{t('form.forWhichChild')} *</Label>
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
                <p className="text-sm text-red-500 font-medium">{t('form.selectChild')}</p>
              )}
            </div>
          )}

          {/* Goal Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('form.name')} *</Label>
            <Input
              id="name"
              name="goalName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('form.namePlaceholder')}
              maxLength={100}
              className={hasSubmitted && !formData.name.trim() ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {hasSubmitted && !formData.name.trim() && (
              <p className="text-sm text-red-500 font-medium">{t('form.nameRequired')}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('form.description')}</Label>
            <Textarea
              id="description"
              name="goalDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('form.descriptionPlaceholder')}
              className="min-h-20"
              maxLength={500}
            />
          </div>

          {/* Dollar Value (Parent Reference) */}
          <div className="space-y-2">
            <Label htmlFor="dollarValue" className="flex items-center gap-2">
              {t('form.dollarValue')}
              <span className="text-xs text-gray-500">({t('form.parentOnly')})</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="dollarValue"
                name="dollarValue"
                type="number"
                value={formData.dollarValue}
                onChange={(e) => handleDollarValueChange(e.target.value)}
                placeholder="10.00"
                step="0.01"
                min="0"
                className="pl-7"
              />
            </div>
            <p className="text-xs text-gray-500">
              {t('form.dollarValueHelp', { rate: exchangeRate })}
            </p>
          </div>

          {/* Target Points */}
          <div className="space-y-2">
            <Label htmlFor="targetPoints">{t('form.targetPoints')} *</Label>
            <Input
              id="targetPoints"
              name="targetPoints"
              type="number"
              value={formData.targetPoints}
              onChange={(e) => setFormData({ ...formData, targetPoints: parseInt(e.target.value) || 0 })}
              min={100}
              max={10000}
              step={10}
              required
            />
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <Label>{t('form.quickPresets')}</Label>
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

          {/* Milestone Bonuses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Sparkle size={16} className="text-yellow-500" />
                {t('form.milestoneBonuses')}
              </Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="enableMilestones"
                  checked={enableMilestones}
                  onCheckedChange={(checked: boolean | 'indeterminate') => setEnableMilestones(!!checked)}
                />
                <label htmlFor="enableMilestones" className="text-sm cursor-pointer">
                  {t('form.enableMilestones')}
                </label>
              </div>
            </div>

            {enableMilestones && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-700 dark:text-yellow-300">
                    {t('form.milestoneHelp')}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applySuggestedBonuses}
                    className="text-xs"
                  >
                    {t('form.useSuggested')}
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {MILESTONE_PERCENTAGES.map((pct) => (
                    <div key={pct} className="space-y-1">
                      <label className="text-xs font-medium">{pct}%</label>
                      <Input
                        type="number"
                        value={milestoneValues[pct] || ''}
                        onChange={(e) =>
                          setMilestoneValues((prev) => ({
                            ...prev,
                            [pct]: parseInt(e.target.value) || 0,
                          }))
                        }
                        placeholder={`${suggestedBonuses[pct]} XP`}
                        min={0}
                        className="text-sm"
                      />
                    </div>
                  ))}
                </div>

                {totalBonus > 0 && (
                  <div className="pt-2 border-t border-yellow-200 dark:border-yellow-800">
                    <div className="flex justify-between text-sm">
                      <span className="text-yellow-700 dark:text-yellow-300">
                        {t('form.totalBonus')}:
                      </span>
                      <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                        +{totalBonus} XP
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-yellow-700 dark:text-yellow-300">
                        {t('form.childNeeds')}:
                      </span>
                      <span className="font-semibold text-yellow-800 dark:text-yellow-200">
                        {netPointsNeeded.toLocaleString()} XP
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tier Preview & Time Estimate */}
          {formData.targetPoints > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('form.goalTier')}</span>
                <div className="flex items-center gap-2">
                  <TierBadge tier={tier} />
                  <EffortBadge tier={tier} variant="stars" size="sm" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t(`form.tierDescriptions.${tier}`)}
              </p>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('form.estimatedTime')}:</span>
                  <span className="font-medium">{timeEstimate}</span>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm">
            <div className="flex items-start gap-2">
              <Info size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                  {t('form.howGoalsWork')}
                </p>
                <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                  {t('form.howGoalsWorkDescription')}
                </p>
              </div>
            </div>
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
              {t('form.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {loading ? t('form.saving') : goal ? t('actions.update') : t('actions.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
