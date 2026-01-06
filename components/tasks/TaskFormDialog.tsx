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
import { Badge } from '@/components/ui/badge';
import { createTask, updateTask } from '@/lib/actions/tasks';
import { useToast } from '@/hooks/use-toast';

type Task = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  points: number;
  approval_type: string;
  is_trust_task: boolean;
  child_id: string | null;
  is_active: boolean;
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
  default_points: number;
  default_approval_type: string;
  icon: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyChildren: Child[];
  templates: Template[];
  task?: Task;
};

const categories = [
  { value: 'learning', label: 'Learning', icon: '📚' },
  { value: 'life', label: 'Life Skills', icon: '🏠' },
  { value: 'health', label: 'Health', icon: '💪' },
  { value: 'creativity', label: 'Creativity', icon: '🎨' },
];

const approvalTypes = [
  { value: 'parent', label: 'Parent Approval', description: 'Requires parent to approve completion' },
  { value: 'auto', label: 'Auto-Approve', description: 'Automatically approved when child submits' },
  { value: 'timer', label: 'Timer Based', description: 'Auto-approves after set time period' },
  { value: 'checklist', label: 'Checklist', description: 'Requires completing all checklist items' },
];

export function TaskFormDialog({ open, onOpenChange, familyChildren, templates, task }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(!task);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('learning');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(10);
  const [approvalType, setApprovalType] = useState('parent');
  const [isTrustTask, setIsTrustTask] = useState(false);
  const [childId, setChildId] = useState<string>('');

  // Initialize form with task data if editing
  useEffect(() => {
    if (task) {
      setName(task.name);
      setCategory(task.category);
      setDescription(task.description || '');
      setPoints(task.points);
      setApprovalType(task.approval_type);
      setIsTrustTask(task.is_trust_task);
      setChildId(task.child_id || '');
      setShowTemplates(false);
    } else {
      // Reset form for new task
      setName('');
      setCategory('learning');
      setDescription('');
      setPoints(10);
      setApprovalType('parent');
      setIsTrustTask(false);
      setChildId('');
      setShowTemplates(true);
    }
  }, [task, open]);

  const handleTemplateSelect = (template: Template) => {
    setName(template.name_default);
    setCategory(template.category);
    setDescription(template.description_default || '');
    setPoints(template.default_points);
    setApprovalType(template.default_approval_type);
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: '❌ Validation Error',
        description: 'Task name is required',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    if (points < 1 || points > 1000) {
      toast({
        title: '❌ Validation Error',
        description: 'Points must be between 1 and 1000',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    setLoading(true);

    const taskData = {
      name: name.trim(),
      category,
      description: description.trim() || undefined,
      points,
      approval_type: approvalType,
      is_trust_task: isTrustTask,
      child_id: childId || null,
    };

    const result = task
      ? await updateTask(task.id, taskData)
      : await createTask(taskData);

    setLoading(false);

    if (result.success) {
      toast({
        title: task ? '✅ Task Updated!' : '✅ Task Created!',
        description: `"${name}" has been ${task ? 'updated' : 'created'}`,
        duration: 3000,
      });
      onOpenChange(false);
    } else {
      toast({
        title: '❌ Error',
        description: result.error || `Failed to ${task ? 'update' : 'create'} task`,
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
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {task
              ? 'Update task details below'
              : 'Create a custom task or select from templates'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Template Quick Select - Only show when creating new task */}
          {!task && showTemplates && filteredTemplates.length > 0 && (
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
                      <p className="text-xs text-gray-500">{template.default_points} points</p>
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
              <div className="grid grid-cols-4 gap-2 mt-2">
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

            {/* Task Name */}
            <div>
              <Label htmlFor="name">Task Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Complete homework"
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
                placeholder="Add more details about this task..."
                className="mt-2"
              />
            </div>

            {/* Points */}
            <div>
              <Label htmlFor="points">Points *</Label>
              <Input
                id="points"
                type="number"
                min="1"
                max="1000"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 10)}
                className="mt-2"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                How many points this task is worth (1-1000)
              </p>
            </div>

            {/* Approval Type */}
            <div>
              <Label>Approval Type *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {approvalTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setApprovalType(type.value)}
                    className={`flex flex-col items-start gap-1 p-3 rounded-lg border-2 transition-all text-left ${
                      approvalType === type.value
                        ? 'border-quest-purple bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm font-semibold">{type.label}</span>
                    <span className="text-xs text-gray-600">{type.description}</span>
                  </button>
                ))}
              </div>
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
                <option value="">Unassigned (available to all)</option>
                {familyChildren.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.avatar_url} {child.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trust Task */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="trust-task"
                checked={isTrustTask}
                onChange={(e) => setIsTrustTask(e.target.checked)}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor="trust-task" className="cursor-pointer">
                  🤝 Trust Task
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Mark as a trust-building task that helps develop responsibility
                </p>
              </div>
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
            <Button type="submit" disabled={loading} className="bg-quest-purple hover:bg-quest-purple/90">
              {loading ? 'Saving...' : task ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
