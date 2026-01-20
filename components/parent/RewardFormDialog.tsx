'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ImageIcon, Palette } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ColorPicker } from '@/components/ui/color-picker';
import ValueContextPanel from '@/components/parent/ValueContextPanel';
import RewardIconPicker from '@/components/rewards/RewardIconPicker';
import DefaultRewardImagePicker from '@/components/rewards/DefaultRewardImagePicker';
import TaskImageUpload from '@/components/tasks/TaskImageUpload';
import { getRewardIconById } from '@/lib/reward-icons';

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
};

interface RewardFormDialogProps {
  reward: Reward | null;
  isOpen: boolean;
  onClose: () => void;
  existingRewards?: Array<{ name: string; points_cost: number }>;
}

export default function RewardFormDialog({ reward, isOpen, onClose, existingRewards = [] }: RewardFormDialogProps) {
  const router = useRouter();
  const t = useTranslations('rewards');
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showDefaultImagePicker, setShowDefaultImagePicker] = useState(false);
  const [imageMode, setImageMode] = useState<'icon' | 'image'>('icon');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'screen',
    points_cost: 100,
    screen_minutes: null as number | null,
    weekly_limit: null as number | null,
    icon: 'gift',
    image_url: null as string | null,
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
        icon: reward.icon || 'gift',
        image_url: reward.image_url || null,
        is_active: reward.is_active,
        color: (reward as any).settings?.color || '',
      });
      setImageMode(reward.image_url ? 'image' : 'icon');
    } else {
      // Reset form for new reward
      setFormData({
        name: '',
        description: '',
        category: 'screen',
        points_cost: 100,
        screen_minutes: null,
        weekly_limit: null,
        icon: 'gift',
        image_url: null,
        is_active: true,
        color: '',
      });
      setImageMode('icon');
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

      // Extract color from formData - it goes into settings, not as a direct column
      const { color, ...dataWithoutColor } = formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(reward && { rewardId: reward.id }),
          ...dataWithoutColor,
          settings: {
            ...(reward as any)?.settings,
            ...(color ? { color } : {}),
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
      toast.error(t('dialog.saveFailed'), { description: error.message || t('toast.error') });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'screen', label: t('categoryLabels.screen'), icon: 'tv' },
    { value: 'autonomy', label: t('categoryLabels.autonomy'), icon: 'stars' },
    { value: 'experience', label: t('categoryLabels.experience'), icon: 'celebration' },
    { value: 'savings', label: t('categoryLabels.savings'), icon: 'savings' },
    { value: 'item', label: t('categoryLabels.item'), icon: 'gift' },
    { value: 'other', label: t('categoryLabels.other'), icon: 'redeem' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {reward ? t('dialog.editTitle') : t('dialog.createTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Reward Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('form.nameLabel')}</Label>
            <Input
              id="name"
              name="rewardName"
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
              name="rewardDescription"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('form.descriptionPlaceholder')}
              className="min-h-20"
              maxLength={500}
            />
          </div>

          {/* Icon/Image Selection */}
          <div className="space-y-3">
            <Label>{t('form.iconLabel')}</Label>

            {/* Mode Toggle */}
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setImageMode('icon')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  imageMode === 'icon'
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Palette className="w-4 h-4" />
                {t('form.chooseIcon')}
              </button>
              <button
                type="button"
                onClick={() => setImageMode('image')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  imageMode === 'image'
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                {t('form.uploadImage')}
              </button>
            </div>

            {/* Icon Selection */}
            {imageMode === 'icon' && (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(true)}
                  className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary transition-colors bg-gray-50 dark:bg-gray-800/50"
                >
                  {(() => {
                    const selectedIcon = getRewardIconById(formData.icon);
                    if (selectedIcon) {
                      const IconComponent = selectedIcon.component;
                      return (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <IconComponent size={28} weight="fill" className="text-primary" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedIcon.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('form.clickToChange')}</p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('form.selectIcon')}</p>
                        <p className="text-xs text-gray-400">{t('form.clickToBrowse')}</p>
                      </div>
                    );
                  })()}
                </button>
              </div>
            )}

            {/* Image Selection */}
            {imageMode === 'image' && (
              <div className="space-y-4">
                {/* Current Image Preview */}
                {formData.image_url && (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-primary">
                    <Image
                      src={formData.image_url}
                      alt="Reward image"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: null })}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Image Options */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDefaultImagePicker(true)}
                    className="h-[88px] px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary dark:hover:border-primary transition-colors bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center"
                  >
                    <span className="text-2xl mb-1">🖼️</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.defaultImages')}</span>
                  </button>
                  <div className="h-[88px]">
                    <TaskImageUpload
                      currentImageUrl={null}
                      onUpload={(url) => setFormData({ ...formData, image_url: url })}
                      onRemove={() => {}}
                      compact
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Icon Picker Dialog */}
          <RewardIconPicker
            open={showIconPicker}
            onClose={() => setShowIconPicker(false)}
            onSelect={(iconId) => {
              setFormData({ ...formData, icon: iconId, image_url: null });
            }}
            selectedIcon={formData.icon}
          />

          {/* Default Image Picker Dialog */}
          <DefaultRewardImagePicker
            open={showDefaultImagePicker}
            onClose={() => setShowDefaultImagePicker(false)}
            onSelect={(imageUrl) => {
              setFormData({ ...formData, image_url: imageUrl, icon: 'gift' });
            }}
            selectedImageUrl={formData.image_url}
          />

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">{t('form.categoryLabel')}</Label>
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
                {formData.category === 'screen' ? `⏱️ ${t('categoryInfo.screen.title')}` :
                  formData.category === 'autonomy' ? `⚡ ${t('categoryInfo.autonomy.title')}` :
                    formData.category === 'savings' ? `💰 ${t('categoryInfo.savings.title')}` :
                      `🎁 ${t('categoryInfo.experience.title')}`}
              </p>
              <p className="opacity-90 leading-relaxed">
                {formData.category === 'screen' ? t('categoryInfo.screen.description') :
                  formData.category === 'autonomy' ? t('categoryInfo.autonomy.description') :
                    formData.category === 'savings' ? t('categoryInfo.savings.description') :
                      t('categoryInfo.experience.description')}
              </p>
            </div>
          </div>

          {/* Points Cost */}
          <div className="space-y-2">
            <Label htmlFor="points_cost">{t('form.costLabel')}</Label>
            <Input
              id="points_cost"
              name="pointsCost"
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
              {t('form.screenMinutes')}
              <span className="text-xs text-text-muted dark:text-gray-500 ml-2">{t('form.screenMinutesHelp')}</span>
            </Label>
            <Input
              id="screen_minutes"
              name="screenMinutes"
              type="number"
              value={formData.screen_minutes || ''}
              onChange={(e) => setFormData({ ...formData, screen_minutes: e.target.value ? parseInt(e.target.value) : null })}
              placeholder={t('form.screenMinutesPlaceholder')}
              min={5}
              max={240}
              step={5}
            />
          </div>

          {/* Weekly Limit (optional) */}
          <div className="space-y-2">
            <Label htmlFor="weekly_limit">
              {t('form.weeklyLimit')}
              <span className="text-xs text-text-muted dark:text-gray-500 ml-2">{t('form.weeklyLimitHelp')}</span>
            </Label>
            <Input
              id="weekly_limit"
              name="weeklyLimit"
              type="number"
              value={formData.weekly_limit || ''}
              onChange={(e) => setFormData({ ...formData, weekly_limit: e.target.value ? parseInt(e.target.value) : null })}
              placeholder={t('form.weeklyLimitPlaceholder')}
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
              {t('dialog.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {loading ? t('actions.saving') : reward ? t('actions.update') : t('actions.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
