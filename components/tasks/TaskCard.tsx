'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toggleTaskActive, deleteTask } from '@/lib/actions/tasks';
import { useToast } from '@/hooks/use-toast';
import { TaskFormDialog } from './TaskFormDialog';

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
  default_points: number;
  default_approval_type: string;
  icon: string;
};

type Props = {
  task: Task;
  familyChildren: Child[];
  templates?: Template[];
};

const approvalTypeLabels: Record<string, string> = {
  parent: 'Parent Approval',
  auto: 'Auto-Approve',
  timer: 'Timer Based',
  checklist: 'Checklist',
};

const categoryIcons: Record<string, string> = {
  learning: '📚',
  life: '🏠',
  health: '💪',
  creativity: '🎨',
};

export function TaskCard({ task, familyChildren, templates = [] }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const assignedChild = familyChildren.find((c) => c.id === task.child_id);

  const handleToggleActive = async () => {
    setLoading(true);
    const result = await toggleTaskActive(task.id);
    setLoading(false);

    if (result.success) {
      toast({
        title: task.is_active ? 'Task Deactivated' : 'Task Activated',
        description: `"${task.name}" is now ${task.is_active ? 'inactive' : 'active'}`,
        duration: 3000,
      });
    } else {
      toast({
        title: '❌ Error',
        description: result.error || 'Failed to update task',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${task.name}"?`)) {
      return;
    }

    setLoading(true);
    const result = await deleteTask(task.id);
    setLoading(false);

    if (result.success) {
      toast({
        title: '🗑️ Task Deleted',
        description: `"${task.name}" has been removed`,
        duration: 3000,
      });
    } else {
      toast({
        title: '❌ Error',
        description: result.error || 'Failed to delete task',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  return (
    <>
      <Card className={`p-4 ${!task.is_active ? 'opacity-60 border-dashed' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">
              {task.template?.icon || categoryIcons[task.category] || '📋'}
            </span>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 leading-tight">{task.name}</h3>
              {task.description && (
                <p className="text-xs text-gray-600 mt-1">{task.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Points and Approval Type */}
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="secondary" className="bg-star-gold/20 text-star-gold border-star-gold/30">
            ⭐ {task.points} pts
          </Badge>
          <Badge variant="outline" className="text-xs">
            {approvalTypeLabels[task.approval_type] || task.approval_type}
          </Badge>
          {task.is_trust_task && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
              🤝 Trust
            </Badge>
          )}
        </div>

        {/* Assigned Child */}
        <div className="mb-3">
          {assignedChild ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Assigned to:</span>
              <div className="flex items-center gap-1">
                <span>{assignedChild.avatar_url || '👤'}</span>
                <span className="font-medium text-gray-900">{assignedChild.name}</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded text-xs">Unassigned</span>
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
            variant={task.is_active ? 'outline' : 'default'}
            onClick={handleToggleActive}
            disabled={loading}
            className={task.is_active ? '' : 'bg-growth-green hover:bg-growth-green/90'}
          >
            {loading ? '...' : task.is_active ? '⏸️' : '▶️'}
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
      <TaskFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        familyChildren={familyChildren}
        templates={templates}
        task={task}
      />
    </>
  );
}
