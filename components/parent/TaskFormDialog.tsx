'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X, ImageIcon, Palette, Loader2 } from 'lucide-react';
import AvatarDisplay from '@/components/profile/AvatarDisplay';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ColorPicker } from '@/components/ui/color-picker';
import IconPicker from '@/components/tasks/IconPicker';
import TaskImageUpload from '@/components/tasks/TaskImageUpload';
import DefaultTaskImagePicker from '@/components/tasks/DefaultTaskImagePicker';
import { getIconById } from '@/lib/task-icons';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { getErrorMessage } from '@/lib/utils/error';
import type {
  TaskCategory,
  TaskTimeContext,
  TaskFrequency,
  ApprovalType,
  MonthlyMode,
  TaskMetadata,
} from '@/lib/types/task';
import {
  MIN_TASK_POINTS,
  MAX_TASK_POINTS,
  POINTS_STEP,
  DEFAULT_TIMER_MINUTES,
  MIN_TIMER_MINUTES,
  MAX_TIMER_MINUTES,
  DEFAULT_DAYS_OF_WEEK,
  DEFAULT_MONTHLY_DAY,
  MAX_CHECKLIST_ITEMS,
  MAX_CHECKLIST_ITEM_LENGTH,
  MAX_TASK_NAME_LENGTH,
} from '@/lib/constants';

/**
 * Minimal task props accepted by the dialog
 * Uses string types for category/frequency/approval_type to be compatible
 * with existing Task types that use string instead of union types
 */
interface TaskProps {
  id: string;
  name: string;
  description: string | null;
  category: string;
  points: number;
  frequency: string;
  approval_type: string;
  is_active: boolean;
  icon: string | null;
  image_url: string | null;
  // Extended fields (may be present depending on API response)
  monthly_mode?: string;
  monthly_day?: number;
  days_of_week?: number[];
  timer_minutes?: number;
  checklist?: string[];
  photo_required?: boolean;
  metadata?: TaskMetadata;
  child_id?: string | null;
  time_context?: string;
}

type Child = {
  id: string;
  name: string;
  avatar_url: string | null;
};

export interface TaskFormDialogProps {
  task: TaskProps | null;
  isOpen: boolean;
  onClose: () => void;
  initialChildId?: string | null;
  availableChildren?: Child[]; // List of children for multi-select
}

/** Form data state type with proper typing */
interface TaskFormState {
  name: string;
  description: string;
  category: TaskCategory;
  points: number;
  frequency: TaskFrequency;
  approval_type: ApprovalType;
  icon: string;
  image_url: string | null;
  is_active: boolean;
  auto_assign: boolean;
  monthly_mode: MonthlyMode;
  monthly_day: number;
  days_of_week: number[];
  timer_minutes: number;
  checklist: string[];
  photo_required: boolean;
  metadata: TaskMetadata;
  child_id: string | null;
  color: string;
  time_context: TaskTimeContext;
}

/** Creates default form state */
function createDefaultFormState(initialChildId: string | null): TaskFormState {
  return {
    name: '',
    description: '',
    category: 'life',
    points: 50,
    frequency: 'daily',
    approval_type: 'parent',
    icon: 'star',
    image_url: null,
    is_active: true,
    auto_assign: false,
    monthly_mode: 'any_day',
    monthly_day: DEFAULT_MONTHLY_DAY,
    days_of_week: [...DEFAULT_DAYS_OF_WEEK],
    timer_minutes: DEFAULT_TIMER_MINUTES,
    checklist: [],
    photo_required: false,
    metadata: {},
    child_id: initialChildId,
    color: '',
    time_context: 'anytime',
  };
}

/** Creates form state from existing task */
function createFormStateFromTask(task: TaskProps, initialChildId: string | null): TaskFormState {
  return {
    name: task.name,
    description: task.description || '',
    category: (task.category as TaskCategory) || 'life',
    points: task.points,
    frequency: (task.frequency as TaskFrequency) || 'daily',
    approval_type: (task.approval_type as ApprovalType) || 'parent',
    icon: task.icon || 'star',
    image_url: task.image_url || null,
    is_active: task.is_active,
    auto_assign: false,
    monthly_mode: (task.monthly_mode as MonthlyMode) || 'any_day',
    monthly_day: task.monthly_day || DEFAULT_MONTHLY_DAY,
    days_of_week: task.days_of_week || [...DEFAULT_DAYS_OF_WEEK],
    timer_minutes: task.timer_minutes || DEFAULT_TIMER_MINUTES,
    checklist: task.checklist || [],
    photo_required: task.photo_required || false,
    metadata: task.metadata || {},
    child_id: task.child_id || initialChildId,
    color: task.metadata?.color || '',
    time_context: (task.time_context as TaskTimeContext) || 'anytime',
  };
}

export default function TaskFormDialog({ task, isOpen, onClose, initialChildId = null, availableChildren = [] }: TaskFormDialogProps) {
  const router = useRouter();
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  // Track which children are selected (for task view, not child profile)
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set());
  // Icon/Image selection state
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showDefaultImagePicker, setShowDefaultImagePicker] = useState(false);
  const [imageMode, setImageMode] = useState<'icon' | 'image'>('icon');
  const [formData, setFormData] = useState<TaskFormState>(() => createDefaultFormState(initialChildId));

  // Update form when task changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormData(createFormStateFromTask(task, initialChildId));
        // Set image mode based on whether task has image_url
        setImageMode(task.image_url ? 'image' : 'icon');
      } else {
        // Reset form for new task
        setFormData(createDefaultFormState(initialChildId));
        setImageMode('icon');
      }
    }
  }, [task, isOpen, initialChildId]);

  // Memoize available children IDs to avoid unnecessary effect triggers
  const availableChildrenIds = useMemo(
    () => availableChildren.map(c => c.id),
    [availableChildren]
  );

  // Initialize selected children when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialChildId) {
      // Child profile/card: only select the specific child
      setSelectedChildIds(new Set([initialChildId]));
    } else if (availableChildrenIds.length > 0) {
      if (task?.id) {
        // Edit mode: fetch existing overrides to determine which children are selected
        fetchTaskOverrides(task.id, availableChildrenIds);
      } else {
        // Create mode: default to all children selected
        setSelectedChildIds(new Set(availableChildrenIds));
      }
    } else {
      setSelectedChildIds(new Set());
    }

    async function fetchTaskOverrides(taskId: string, childIds: string[]) {
      try {
        const response = await fetch(`/api/tasks/${taskId}/overrides`);
        if (response.ok) {
          const data: { overrides: Array<{ child_id: string; is_enabled: boolean }> } = await response.json();
          const excludedChildIds = new Set(
            data.overrides
              .filter(override => !override.is_enabled)
              .map(override => override.child_id)
          );

          // Select all children except those that are excluded
          const selected = childIds.filter(id => !excludedChildIds.has(id));
          setSelectedChildIds(new Set(selected));
        } else {
          // If fetch fails, default to all children (safer)
          setSelectedChildIds(new Set(childIds));
        }
      } catch (error: unknown) {
        console.error('Failed to fetch task overrides:', error);
        // If fetch fails, default to all children
        setSelectedChildIds(new Set(childIds));
      }
    }
  }, [isOpen, initialChildId, task?.id, availableChildrenIds]);

  // Note: Auto-calculate points for timer tasks was removed per user request.
  // Users now manually set points for all task types including timer tasks.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);

    if (!formData.name.trim()) {
      return;
    }

    setLoading(true);

    try {
      const url = task ? '/api/tasks/update' : '/api/tasks/create';
      const method = task ? 'PATCH' : 'POST';

      // Determine child_id and excluded_child_ids
      let childId = formData.child_id;
      let excludedChildIds: string[] | undefined = undefined;

      if (!initialChildId && availableChildren.length > 0) {
        // Task view: ALWAYS use overrides-based approach for consistency
        const selectedCount = selectedChildIds.size;

        if (selectedCount === 0) {
          // No children selected: shouldn't happen, but handle it
          toast.error(t('dialog.noChildrenSelected'), {
            description: t('dialog.noChildrenSelectedDesc'),
          });
          setLoading(false);
          return;
        }

        // SIMPLIFIED LOGIC: Always use child_id = null + overrides
        // This makes all cases consistent and easy to manage
        childId = null;
        excludedChildIds = availableChildren
          .filter(c => !selectedChildIds.has(c.id))
          .map(c => c.id);

        // excludedChildIds can be empty array (all children selected) - that's OK!
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(task && { taskId: task.id }),
          ...formData,
          metadata: {
            ...formData.metadata,
            ...(formData.color ? { color: formData.color } : {}),
          },
          child_id: childId,
          // IMPORTANT: Always send excluded_child_ids if defined (even if empty array)
          // Empty array means "all children selected" and should clear overrides
          ...(excludedChildIds !== undefined && { excluded_child_ids: excludedChildIds }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save task');
      }

      router.refresh();
      onClose();
    } catch (error: unknown) {
      console.error('Error saving task:', error);
      toast.error(t('dialog.saveFailed'), { description: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  // v2 categories with proper typing
  const categories: Array<{ value: TaskCategory; label: string; icon: string }> = [
    { value: 'learning', label: t('categoryLabels.learning'), icon: 'school' },
    { value: 'life', label: t('categoryLabels.life'), icon: 'home_work' },
    { value: 'health', label: t('categoryLabels.health'), icon: 'fitness_center' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {task ? t('dialog.editTitle') : t('dialog.createTitle')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Task Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('form.nameLabel')}</Label>
            <Input
              id="name"
              name="taskName"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('form.namePlaceholder')}
              maxLength={MAX_TASK_NAME_LENGTH}
              aria-invalid={hasSubmitted && !formData.name.trim()}
              aria-describedby={hasSubmitted && !formData.name.trim() ? 'task-name-error' : undefined}
              className={hasSubmitted && !formData.name.trim() ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {hasSubmitted && !formData.name.trim() && (
              <p id="task-name-error" className="text-sm text-red-500 font-medium" role="alert">{t('form.nameRequired')}</p>
            )}
          </div>

          {/* Icon/Image Selection */}
          <div className="space-y-3">
            <Label>{t('form.iconLabel')}</Label>

            {/* Mode Toggle */}
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-800">
              <button
                type="button"
                onClick={() => setImageMode('icon')}
                aria-pressed={imageMode === 'icon'}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  imageMode === 'icon'
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Palette className="w-4 h-4" aria-hidden="true" />
                {t('form.chooseIcon')}
              </button>
              <button
                type="button"
                onClick={() => setImageMode('image')}
                aria-pressed={imageMode === 'image'}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                  imageMode === 'image'
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4" aria-hidden="true" />
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
                    const selectedIcon = getIconById(formData.icon);
                    if (selectedIcon) {
                      const IconComponent = selectedIcon.component;
                      return (
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <IconComponent size={28} weight="fill" className="text-primary" />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedIcon.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Click to change</p>
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
                      alt="Task image"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: null })}
                      aria-label={t('form.removeImage')}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-red-500"
                    >
                      <span aria-hidden="true">✕</span>
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
                    <span className="text-2xl mb-1">&#128444;&#65039;</span>
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
          <IconPicker
            open={showIconPicker}
            onClose={() => setShowIconPicker(false)}
            onSelect={(iconId) => {
              setFormData({ ...formData, icon: iconId, image_url: null });
            }}
            selectedIcon={formData.icon}
          />

          {/* Default Image Picker Dialog */}
          <DefaultTaskImagePicker
            open={showDefaultImagePicker}
            onClose={() => setShowDefaultImagePicker(false)}
            onSelect={(imageUrl) => {
              setFormData({ ...formData, image_url: imageUrl, icon: 'star' });
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
                  aria-pressed={formData.category === cat.value}
                  className={`p-3 rounded-xl border-2 transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${formData.category === cat.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <span className="text-sm font-semibold">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Color Picker (Optional) */}
            <div className="mt-3 flex items-center gap-3">
              <Label className="text-sm text-gray-500 font-normal">{t('form.customColor')}</Label>
              <div className="w-48">
                <ColorPicker
                  value={formData.color}
                  onChange={(color) => setFormData({ ...formData, color })}
                />
              </div>
            </div>
          </div>

          {/* Time Context */}
          <div className="space-y-3">
            <Label>{t('form.timeContext')}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                { value: 'morning', label: t('timeContexts.morning'), icon: '☀️' },
                { value: 'after_school', label: t('timeContexts.afterSchool'), icon: '🏠' },
                { value: 'evening', label: t('timeContexts.evening'), icon: '🌙' },
                { value: 'anytime', label: t('timeContexts.anytime'), icon: '📚' },
              ] as const satisfies ReadonlyArray<{ value: TaskTimeContext; label: string; icon: string }>).map((context) => (
                <button
                  key={context.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, time_context: context.value })}
                  aria-pressed={formData.time_context === context.value}
                  className={`p-3 rounded-xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${formData.time_context === context.value
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <div className="text-2xl mb-1">{context.icon}</div>
                  <div className="text-sm font-semibold text-text-main dark:text-white">
                    {context.label}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('form.timeContextHelp')}
            </p>
          </div>

          {/* Child Selection - Only shown in Task View (not child profile) */}
          {!initialChildId && availableChildren.length > 0 && (
            <div className="space-y-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <Label>{t('form.assignLabel')}</Label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                {t('form.assignHelp')}
              </p>
              <div className="space-y-2">
                {availableChildren.map((child) => {
                  const isSelected = selectedChildIds.has(child.id);
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => {
                        const newSelected = new Set(selectedChildIds);
                        if (isSelected) {
                          newSelected.delete(child.id);
                        } else {
                          newSelected.add(child.id);
                        }
                        setSelectedChildIds(newSelected);
                      }}
                      aria-pressed={isSelected}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected
                          ? 'bg-primary border-primary'
                          : 'border-gray-300 dark:border-gray-600'
                          }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <AvatarDisplay
                          avatarUrl={child.avatar_url}
                          userName={child.name}
                          size="sm"
                        />
                        <span className="font-medium text-text-main dark:text-white">{child.name}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                {selectedChildIds.size === availableChildren.length && t('form.allChildrenSelected')}
                {selectedChildIds.size === 1 && t('form.oneChildSelected')}
                {selectedChildIds.size > 1 && selectedChildIds.size < availableChildren.length &&
                  t('form.multiChildSelected', { count: selectedChildIds.size, total: availableChildren.length })}
                {selectedChildIds.size === 0 && t('form.noChildSelected')}
              </div>
            </div>
          )}

          {/* Points */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{t('form.pointsLabel')}</Label>
              <span className="text-lg font-bold text-primary">{formData.points} XP</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, points: Math.max(MIN_TASK_POINTS, formData.points - POINTS_STEP) })}
                aria-label={t('form.decreasePoints')}
                className="h-10 w-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-all"
              >
                <span className="text-xl font-bold" aria-hidden="true">−</span>
              </button>
              <div className="flex-1">
                <input
                  type="range"
                  name="points"
                  min={MIN_TASK_POINTS}
                  max={MAX_TASK_POINTS}
                  step={POINTS_STEP}
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>{MIN_TASK_POINTS} XP</span>
                  <span>{MAX_TASK_POINTS} XP</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, points: Math.min(MAX_TASK_POINTS, formData.points + POINTS_STEP) })}
                aria-label={t('form.increasePoints')}
                className="h-10 w-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-all"
              >
                <span className="text-xl font-bold" aria-hidden="true">+</span>
              </button>
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-3">
            <Label>{t('form.frequencyLabel')}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                { value: 'daily', label: t('frequencies.daily'), icon: '☀️' },
                { value: 'weekly', label: t('frequencies.weekly'), icon: '📅' },
                { value: 'monthly', label: t('frequencies.monthly'), icon: '📆' },
                { value: 'one_time', label: t('frequencies.oneTime'), icon: '⚡' },
              ] as const satisfies ReadonlyArray<{ value: TaskFrequency; label: string; icon: string }>).map((freq) => (
                <button
                  key={freq.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, frequency: freq.value })}
                  aria-pressed={formData.frequency === freq.value}
                  className={`p-3 rounded-xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${formData.frequency === freq.value
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <div className="text-2xl mb-1">{freq.icon}</div>
                  <div className="text-sm font-semibold text-text-main dark:text-white">
                    {freq.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Approval Method */}
          <div className="space-y-3">
            <Label>{t('form.approvalLabel')}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {([
                { value: 'parent', label: t('form.approvalParent'), icon: '👤' },
                { value: 'timer', label: t('form.approvalTimer'), icon: '⏱️' },
                { value: 'checklist', label: t('form.approvalChecklist'), icon: '✓' },
                { value: 'auto', label: t('form.approvalAuto'), icon: '⚡' },
              ] as const satisfies ReadonlyArray<{ value: ApprovalType; label: string; icon: string }>).map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, approval_type: method.value })}
                  aria-pressed={formData.approval_type === method.value}
                  className={`p-3 rounded-xl border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${formData.approval_type === method.value
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                >
                  <div className="text-2xl mb-1">{method.icon}</div>
                  <div className="text-sm font-semibold text-text-main dark:text-white">
                    {method.label}
                  </div>
                </button>
              ))}
            </div>
            {formData.approval_type === 'auto' && (
              <p className="text-xs text-orange-600 dark:text-orange-400 p-2 rounded bg-orange-50 dark:bg-orange-900/20">
                {t('form.autoWarning')}
              </p>
            )}
          </div>

          {/* Timer Duration (conditional) */}
          {formData.approval_type === 'timer' && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⏱️</span>
                <Label className="text-green-700 dark:text-green-300 font-semibold">{t('form.timerLabel')}</Label>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  name="timerMinutes"
                  value={formData.timer_minutes === 0 ? '' : formData.timer_minutes}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setFormData({ ...formData, timer_minutes: 0 });
                    } else {
                      const num = parseInt(val);
                      if (!isNaN(num)) {
                        setFormData({ ...formData, timer_minutes: Math.min(MAX_TIMER_MINUTES, Math.max(0, num)) });
                      }
                    }
                  }}
                  onBlur={() => {
                    // Ensure minimum value on blur
                    if (formData.timer_minutes < MIN_TIMER_MINUTES) {
                      setFormData({ ...formData, timer_minutes: MIN_TIMER_MINUTES });
                    }
                  }}
                  min={MIN_TIMER_MINUTES}
                  max={MAX_TIMER_MINUTES}
                  step={1}
                  className="w-24 text-center text-lg font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-outer-spin-button]:opacity-100"
                  required
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">{t('form.timerMinutes')}</span>
              </div>
            </div>
          )}

          {/* v2: Checklist Items (conditional) */}
          {formData.approval_type === 'checklist' && (
            <div className="space-y-2 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <Label>{t('form.checklistLabel')}</Label>
              <div className="space-y-2">
                {formData.checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={item}
                      onChange={(e) => {
                        const newChecklist = [...formData.checklist];
                        newChecklist[index] = e.target.value;
                        setFormData({ ...formData, checklist: newChecklist });
                      }}
                      placeholder={t('form.checklistPlaceholder', { index: index + 1 })}
                      maxLength={MAX_CHECKLIST_ITEM_LENGTH}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newChecklist = formData.checklist.filter((_, i) => i !== index);
                        setFormData({ ...formData, checklist: newChecklist });
                      }}
                      aria-label={t('form.removeChecklistItem')}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {formData.checklist.length < MAX_CHECKLIST_ITEMS && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        checklist: [...formData.checklist, ''],
                      });
                    }}
                    className="w-full py-2 px-3 rounded-lg border-2 border-dashed border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 text-sm font-medium"
                  >
                    {t('form.addChecklistItem')}
                  </button>
                )}
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                {t('form.checklistHelp')}
              </p>
            </div>
          )}

          {/* Weekly Task Options */}
          {formData.frequency === 'weekly' && (
            <div className="space-y-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Label>{t('form.weeklyDaysLabel')}</Label>
              <div className="grid grid-cols-7 gap-2">
                {[
                  { label: t('days.sun'), value: 0 },
                  { label: t('days.mon'), value: 1 },
                  { label: t('days.tue'), value: 2 },
                  { label: t('days.wed'), value: 3 },
                  { label: t('days.thu'), value: 4 },
                  { label: t('days.fri'), value: 5 },
                  { label: t('days.sat'), value: 6 },
                ].map((day) => {
                  const isSelected = formData.days_of_week.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setFormData({
                            ...formData,
                            days_of_week: formData.days_of_week.filter((d) => d !== day.value),
                          });
                        } else {
                          setFormData({
                            ...formData,
                            days_of_week: [...formData.days_of_week, day.value].sort(),
                          });
                        }
                      }}
                      aria-pressed={isSelected}
                      className={`p-2 rounded-lg border-2 transition-all text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${isSelected
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t('form.weeklyDaysHelp')}
              </p>
            </div>
          )}

          {/* Monthly Task Options */}
          {formData.frequency === 'monthly' && (
            <div className="space-y-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <Label htmlFor="monthly_mode">{t('form.monthlyModeLabel')}</Label>
                <select
                  id="monthly_mode"
                  value={formData.monthly_mode}
                  onChange={(e) => {
                    const value = e.target.value as MonthlyMode;
                    setFormData({ ...formData, monthly_mode: value });
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-text-main dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="any_day">{t('form.monthlyAnyDay')}</option>
                  <option value="specific_day">{t('form.monthlySpecificDay')}</option>
                  <option value="first_day">{t('form.monthlyFirstDay')}</option>
                  <option value="last_day">{t('form.monthlyLastDay')}</option>
                </select>
              </div>

              {formData.monthly_mode === 'specific_day' && (
                <div className="space-y-2">
                  <Label htmlFor="monthly_day">{t('form.monthlyDayLabel')}</Label>
                  <Input
                    id="monthly_day"
                    name="monthlyDay"
                    type="number"
                    value={formData.monthly_day}
                    onChange={(e) => setFormData({ ...formData, monthly_day: parseInt(e.target.value) || 1 })}
                    min={1}
                    max={31}
                    placeholder={t('form.monthlyDayPlaceholder')}
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t('form.monthlyDayHelp')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-11"
            >
              {t('dialog.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 motion-safe:animate-spin" aria-hidden="true" />}
              {loading ? t('actions.saving') : task ? t('actions.update') : t('actions.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
