'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, ImageIcon, Palette } from 'lucide-react';
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
import { getIconById, TASK_ICON_POOL } from '@/lib/task-icons';
import Image from 'next/image';

type Task = {
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
};

type Child = {
  id: string;
  name: string;
  avatar_url: string | null;
};

interface TaskFormDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  initialChildId?: string | null;
  availableChildren?: Child[]; // List of children for multi-select
}

export default function TaskFormDialog({ task, isOpen, onClose, initialChildId = null, availableChildren = [] }: TaskFormDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  // Track which children are selected (for task view, not child profile)
  const [selectedChildIds, setSelectedChildIds] = useState<Set<string>>(new Set());
  // Icon/Image selection state
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showDefaultImagePicker, setShowDefaultImagePicker] = useState(false);
  const [imageMode, setImageMode] = useState<'icon' | 'image'>('icon');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'household',
    points: 50,
    frequency: 'daily',
    approval_type: 'parent',
    icon: 'star', // Default icon
    image_url: null as string | null, // Custom image URL
    is_active: true,
    auto_assign: false, // Changed to false - we don't use task instances
    monthly_mode: 'any_day' as 'any_day' | 'specific_day' | 'first_day' | 'last_day',
    monthly_day: 15,
    days_of_week: [0, 1, 2, 3, 4, 5, 6] as number[], // Default: all days
    // v2 fields
    timer_minutes: 20,
    checklist: [] as string[],
    photo_required: false,
    metadata: {} as Record<string, any>,
    child_id: initialChildId,
    color: '', // Custom color override
  });

  // Update form when task changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormData({
          name: task.name,
          description: task.description || '',
          category: task.category,
          points: task.points,
          frequency: task.frequency,
          approval_type: task.approval_type,
          icon: task.icon || 'star',
          image_url: task.image_url || null,
          is_active: task.is_active,
          auto_assign: false, // Always false - we don't use task instances
          monthly_mode: (task as any).monthly_mode || 'any_day',
          monthly_day: (task as any).monthly_day || 15,
          days_of_week: (task as any).days_of_week || [0, 1, 2, 3, 4, 5, 6],
          timer_minutes: (task as any).timer_minutes || 20,
          checklist: (task as any).checklist || [],
          photo_required: (task as any).photo_required || false,
          metadata: (task as any).metadata || {},
          child_id: (task as any).child_id || initialChildId, // Use task's child_id or fallback to initial
          color: (task as any).metadata?.color || '',
        });
        // Set image mode based on whether task has image_url
        setImageMode(task.image_url ? 'image' : 'icon');
      } else {
        // Reset form for new task
        setFormData({
          name: '',
          description: '',
          category: 'household',
          points: 50,
          frequency: 'daily',
          approval_type: 'parent',
          icon: 'star',
          image_url: null,
          is_active: true,
          auto_assign: false, // Always false - we don't use task instances
          monthly_mode: 'any_day',
          monthly_day: 15,
          days_of_week: [0, 1, 2, 3, 4, 5, 6],
          timer_minutes: 20,
          checklist: [],
          photo_required: false,
          metadata: {},
          child_id: initialChildId,
          color: '',
        });
        setImageMode('icon');
      }
    }
  }, [task, isOpen, initialChildId]);

  // Initialize selected children when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (initialChildId) {
        // Child profile/card: only select the specific child
        setSelectedChildIds(new Set([initialChildId]));
      } else if (availableChildren.length > 0) {
        if (task?.id) {
          // Edit mode: fetch existing overrides to determine which children are selected
          fetchTaskOverrides(task.id);
        } else {
          // Create mode: default to all children selected
          setSelectedChildIds(new Set(availableChildren.map(c => c.id)));
        }
      } else {
        setSelectedChildIds(new Set());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialChildId, task?.id]);

  // Fetch child_task_overrides for a task
  const fetchTaskOverrides = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/overrides`);
      if (response.ok) {
        const data = await response.json();
        const excludedChildIds = new Set(
          data.overrides
            .filter((override: any) => !override.is_enabled)
            .map((override: any) => override.child_id)
        );

        // Select all children except those that are excluded
        const selected = availableChildren
          .filter(c => !excludedChildIds.has(c.id))
          .map(c => c.id);

        setSelectedChildIds(new Set(selected));
      } else {
        // If fetch fails, default to all children (safer)
        setSelectedChildIds(new Set(availableChildren.map(c => c.id)));
      }
    } catch (error) {
      console.error('Failed to fetch task overrides:', error);
      // If fetch fails, default to all children
      setSelectedChildIds(new Set(availableChildren.map(c => c.id)));
    }
  };

  // v2: Auto-calculate points for timer tasks
  useEffect(() => {
    if (formData.approval_type === 'timer') {
      const POINTS_PER_MINUTE = 1.5;
      const calculatedPoints = Math.round(formData.timer_minutes * POINTS_PER_MINUTE);
      // Round to nearest 5
      const roundedPoints = Math.round(calculatedPoints / 5) * 5;

      // Only update if different to avoid infinite loops if we had bi-directional sync (we don't here but good practice)
      // and ensure there's a minimum
      const finalPoints = Math.max(5, roundedPoints);

      if (finalPoints !== formData.points) {
        setFormData(prev => ({ ...prev, points: finalPoints }));
      }
    }
  }, [formData.timer_minutes, formData.approval_type]);

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
          toast.error('No children selected', {
            description: 'Please select at least one child for this task',
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
        console.log('Task Form: Child assignment', {
          selectedCount,
          totalChildren: availableChildren.length,
          excludedCount: excludedChildIds.length,
          excludedIds: excludedChildIds,
        });
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
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task', {
        description: error.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // v2 categories
  const categories = [
    { value: 'learning', label: '📚 Learning', icon: 'school' },
    { value: 'household', label: '🏠 Household', icon: 'home_work' },
    { value: 'health', label: '💪 Health', icon: 'fitness_center' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Task Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Task Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Brush teeth"
              maxLength={100}
              className={hasSubmitted && !formData.name.trim() ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {hasSubmitted && !formData.name.trim() && (
              <p className="text-sm text-red-500 font-medium">Task name is required</p>
            )}
          </div>

          {/* Icon/Image Selection */}
          <div className="space-y-3">
            <Label>Task Icon/Image</Label>

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
                Choose Icon
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
                Upload Image
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
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Select an icon</p>
                        <p className="text-xs text-gray-400">Click to browse</p>
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
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold hover:bg-red-600"
                    >
                      X
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
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Images</span>
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

            {/* Color Picker (Optional) */}
            <div className="mt-3 flex items-center gap-3">
              <Label className="text-sm text-gray-500 font-normal">Custom Color (Optional):</Label>
              <div className="w-48">
                <ColorPicker
                  value={formData.color}
                  onChange={(color) => setFormData({ ...formData, color })}
                />
              </div>
            </div>
          </div>

          {/* Child Selection - Only shown in Task View (not child profile) */}
          {!initialChildId && availableChildren.length > 0 && (
            <div className="space-y-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <Label>Assign to Children *</Label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Select which children should see this task. Default is all children.
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
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${isSelected
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
                {selectedChildIds.size === availableChildren.length && '✓ All children selected (Global Task)'}
                {selectedChildIds.size === 1 && '✓ Assigned to one child'}
                {selectedChildIds.size > 1 && selectedChildIds.size < availableChildren.length &&
                  `✓ ${selectedChildIds.size} of ${availableChildren.length} children selected`}
                {selectedChildIds.size === 0 && '⚠️ Please select at least one child'}
              </div>
            </div>
          )}

          {/* Points */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Reward Points *</Label>
              <span className="text-lg font-bold text-primary">{formData.points} XP</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, points: Math.max(5, formData.points - 5) })}
                className="h-10 w-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-all"
              >
                <span className="text-xl font-bold">−</span>
              </button>
              <div className="flex-1">
                <input
                  type="range"
                  min="5"
                  max="500"
                  step="5"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>5 XP</span>
                  <span>500 XP</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, points: Math.min(500, formData.points + 5) })}
                className="h-10 w-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5 flex items-center justify-center transition-all"
              >
                <span className="text-xl font-bold">+</span>
              </button>
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-3">
            <Label>Frequency *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 'daily', label: 'Daily', icon: '☀️' },
                { value: 'weekly', label: 'Weekly', icon: '📅' },
                { value: 'monthly', label: 'Monthly', icon: '📆' },
                { value: 'one_time', label: 'One Time', icon: '⚡' },
              ].map((freq) => (
                <button
                  key={freq.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, frequency: freq.value })}
                  className={`p-3 rounded-xl border-2 transition-all ${formData.frequency === freq.value
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
            <Label>Approval Method *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: 'parent', label: 'Parent', icon: '👤' },
                { value: 'timer', label: 'Timer', icon: '⏱️' },
                { value: 'checklist', label: 'List', icon: '✓' },
                { value: 'auto', label: 'Auto', icon: '⚡' },
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, approval_type: method.value })}
                  className={`p-3 rounded-xl border-2 transition-all ${formData.approval_type === method.value
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
                ⚠️ Auto-approval should only be used for simple, trust-based tasks.
              </p>
            )}
          </div>

          {/* Timer Duration (conditional) */}
          {formData.approval_type === 'timer' && (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⏱️</span>
                <Label className="text-green-700 dark:text-green-300 font-semibold">Set Timer Duration</Label>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={formData.timer_minutes}
                  onChange={(e) => setFormData({ ...formData, timer_minutes: parseInt(e.target.value) || 1 })}
                  min={1}
                  max={180}
                  step={1}
                  className="w-24 text-center text-lg font-bold"
                  required
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">minutes</span>
              </div>
            </div>
          )}

          {/* v2: Checklist Items (conditional) */}
          {formData.approval_type === 'checklist' && (
            <div className="space-y-2 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <Label>Checklist Items *</Label>
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
                      placeholder={`Step ${index + 1}`}
                      maxLength={100}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newChecklist = formData.checklist.filter((_, i) => i !== index);
                        setFormData({ ...formData, checklist: newChecklist });
                      }}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {formData.checklist.length < 10 && (
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
                    + Add Checklist Item
                  </button>
                )}
              </div>
              <p className="text-xs text-green-700 dark:text-green-300">
                Child must check off all items to complete this task. Perfect for routines with multiple steps (e.g., brush teeth AM/PM, make bed).
              </p>
            </div>
          )}

          {/* Auto-Assign (for daily/weekly/monthly tasks) */}
          {['daily', 'weekly', 'monthly'].includes(formData.frequency) && (
            <div className="space-y-2 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="auto_assign"
                  checked={formData.auto_assign}
                  onChange={(e) => setFormData({ ...formData, auto_assign: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div className="flex-1">
                  <Label htmlFor="auto_assign" className="cursor-pointer font-semibold text-blue-900 dark:text-blue-100">
                    Auto-assign daily (Recommended)
                  </Label>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Task automatically appears in child&apos;s todo list each day/week. Uncheck for manual template mode where child can complete whenever they want.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Weekly Task Options */}
          {formData.frequency === 'weekly' && (
            <div className="space-y-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <Label>Which days should this task appear?</Label>
              <div className="grid grid-cols-7 gap-2">
                {[
                  { label: 'Sun', value: 0 },
                  { label: 'Mon', value: 1 },
                  { label: 'Tue', value: 2 },
                  { label: 'Wed', value: 3 },
                  { label: 'Thu', value: 4 },
                  { label: 'Fri', value: 5 },
                  { label: 'Sat', value: 6 },
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
                      className={`p-2 rounded-lg border-2 transition-all text-xs font-semibold ${isSelected
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
                Select at least one day. Task will appear on selected days each week.
              </p>
            </div>
          )}

          {/* Monthly Task Options */}
          {formData.frequency === 'monthly' && (
            <div className="space-y-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="space-y-2">
                <Label htmlFor="monthly_mode">When should this task appear?</Label>
                <select
                  id="monthly_mode"
                  value={formData.monthly_mode}
                  onChange={(e) => setFormData({ ...formData, monthly_mode: e.target.value as any })}
                  className="w-full h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="any_day">Anytime during the month</option>
                  <option value="specific_day">Specific day of month</option>
                  <option value="first_day">First day of month</option>
                  <option value="last_day">Last day of month</option>
                </select>
              </div>

              {formData.monthly_mode === 'specific_day' && (
                <div className="space-y-2">
                  <Label htmlFor="monthly_day">Day of Month (1-31)</Label>
                  <Input
                    id="monthly_day"
                    type="number"
                    value={formData.monthly_day}
                    onChange={(e) => setFormData({ ...formData, monthly_day: parseInt(e.target.value) || 1 })}
                    min={1}
                    max={31}
                    placeholder="e.g., 15 for the 15th"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    For months with fewer days, task will appear on the last available day.
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
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
