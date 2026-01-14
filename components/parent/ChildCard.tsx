'use client';

import { useState } from 'react';
import { Fire, TrendUp, Trash, Plus, Checks, Eye } from '@phosphor-icons/react';
import { AppIcon } from '@/components/ui/AppIcon';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import TaskFormDialog from './TaskFormDialog';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import AvatarDisplay from '@/components/profile/AvatarDisplay';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type Child = {
  id: string;
  name: string;
  age_group: string;
  points_balance: number;
  avatar_url: string | null;
  settings: {
    weeklyGoal?: number;
  };
};

type Task = {
  id: string;
  name: string;
  points: number;
  icon: string | null;
  category: string;
  frequency: string;
  isDisabled?: boolean;
};

interface ChildCardProps {
  child: Child;
  tasks?: Task[];
}

export default function ChildCard({ child, tasks = [] }: ChildCardProps) {
  const router = useRouter();
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const weeklyGoal = child.settings?.weeklyGoal || 500;
  const progressPercentage = Math.min((child.points_balance / weeklyGoal) * 100, 100);

  const handleViewProfile = () => {
    router.push(`/en-US/children/${child.id}`);
  };

  const handleCreateTask = () => {
    setIsTaskFormOpen(true);
  };

  const handleTaskDelete = (task: Task) => {
    setTaskToDelete(task);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      // One-time tasks should be removed for this child using overrides
      // This way other children can still see the task if it's global
      const response = await fetch('/api/tasks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: taskToDelete.id,
          childId: child.id,
          isEnabled: false, // Disable for this child
        }),
      });

      if (!response.ok) throw new Error('Failed to remove task');
      toast.success('Task removed for this child');
      router.refresh();
    } catch (error) {
      console.error('Error removing task:', error);
      toast.error('Failed to remove task');
    }
  };

  const handleTaskToggle = async (task: Task, isEnabled: boolean) => {
    try {
      const response = await fetch('/api/tasks/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          childId: child.id,
          isEnabled: isEnabled,
        }),
      });

      if (!response.ok) throw new Error('Failed to toggle task');
      toast.success(isEnabled ? 'Task visible again' : 'Task hidden for this child');
      router.refresh(); // Refresh to update UI state
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error('Failed to update task');
    }
  };

  return (
    <>
      <Dialog>
        <div className="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-card hover:shadow-card-hover transition-all duration-normal">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <AvatarDisplay
                avatarUrl={child.avatar_url}
                userName={child.name}
                size="md"
                editable={false}
              />
              <div>
                <h3 className="text-lg font-bold text-text-main dark:text-white leading-none mb-1">
                  {child.name}
                </h3>
                <p className="text-xs font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
                  {child.age_group}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/auth/impersonate', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ childId: child.id }),
                    });

                    if (!response.ok) throw new Error('Failed to switch view');

                    window.location.href = '/en-US/child/dashboard';
                  } catch (error) {
                    console.error(error);
                  }
                }}
                className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                title="View as Child"
              >
                <Eye size={20} />
              </button>
              <button
                onClick={() => {
                  // Navigate to settings page with child selected is tricky.
                  // For now, link to child profile in settings?
                  // Or just keep it as is (no edit button here usually? Wait, let's see original code)
                }}
              /* The original code had a dropdown or edit button? Let's check the File Content */
              >
                {/* Original code didn't have buttons in the header actually... */}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
            <Fire size={20} weight="fill" />
            <span className="text-sm font-bold">0</span>
          </div>

          {/* Points */}
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-3xl font-black text-text-main dark:text-white">
                {child.points_balance}
              </span>
              <span className="text-sm text-text-muted dark:text-gray-400">
                / {weeklyGoal} XP
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-green-400 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 mb-1">
                <TrendUp size={16} weight="bold" className="text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-blue-900 dark:text-blue-100">
                  This Week
                </span>
              </div>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {child.points_balance} XP
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <div className="flex items-center gap-2 mb-1">
                <Checks size={16} weight="bold" className="text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-semibold text-purple-900 dark:text-purple-100">
                  Assigned
                </span>
              </div>
              <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {tasks.length}
              </p>
            </div>
          </div>

          {/* Assigned Tasks Summary */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-text-muted dark:text-gray-500 uppercase tracking-wider">
                Assigned Tasks
              </h4>
              <DialogTrigger asChild>
                <button className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">
                  Manage
                </button>
              </DialogTrigger>
            </div>
            {tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.slice(0, 3).map(task => ( // Show top 3
                  <div key={task.id} className={`flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 ${task.isDisabled ? 'opacity-50 grayscale' : ''}`}>
                    <AppIcon name={task.icon} size={18} className="text-gray-500" />
                    <span className="text-sm font-medium text-text-main dark:text-white truncate flex-1">
                      {task.name}
                    </span>
                    <span className="text-xs font-bold text-primary">
                      {task.points}
                    </span>
                  </div>
                ))}
                {tasks.length > 3 && (
                  <DialogTrigger asChild>
                    <button className="w-full text-xs text-center text-text-muted dark:text-gray-500 mt-1 hover:text-primary transition-colors">
                      + {tasks.length - 3} more tasks
                    </button>
                  </DialogTrigger>
                )}
              </div>
            ) : (
              <div className="text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                <p className="text-xs text-text-muted dark:text-gray-500 mb-2">No tasks assigned yet</p>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Plus size={12} className="mr-1" />
                    Assign Task
                  </Button>
                </DialogTrigger>
              </div>
            )}
          </div>

          {/* View Profile Button */}
          <button
            onClick={handleViewProfile}
            className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-semibold transition-all"
          >
            View Profile
          </button>

          {/* Full Task List Dialog */}
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assigned Tasks for {child.name}</DialogTitle>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 group ${task.isDisabled ? 'bg-gray-100 dark:bg-gray-800/50' : ''}`}>
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-2xl shadow-sm ${task.isDisabled ? 'bg-gray-200 dark:bg-gray-700 grayscale opacity-50' : 'bg-white dark:bg-gray-700'}`}>
                      <AppIcon name={task.icon} size={24} className="text-primary" />
                    </div>
                    <div className={`flex-1 min-w-0 ${task.isDisabled ? 'opacity-50' : ''}`}>
                      <h4 className="font-semibold text-text-main dark:text-white truncate">
                        {task.name} {task.isDisabled && <span className="text-xs font-normal text-text-muted ml-2">(Off)</span>}
                      </h4>
                      <p className="text-xs text-text-muted dark:text-gray-400 uppercase tracking-wider">
                        {task.category}
                      </p>
                    </div>
                    <div className={`font-bold text-primary whitespace-nowrap mr-2 ${task.isDisabled ? 'opacity-50' : ''}`}>
                      {task.points} XP
                    </div>

                    {task.frequency === 'one_time' ? (
                      <button
                        onClick={() => handleTaskDelete(task)}
                        className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove task"
                      >
                        <Trash size={16} />
                      </button>
                    ) : (
                      <div className="flex items-center" title={task.isDisabled ? "Enable task" : "Disable task"}>
                        <Switch
                          checked={!task.isDisabled}
                          onCheckedChange={(checked) => handleTaskToggle(task, checked)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button
                onClick={handleCreateTask}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold"
              >
                <Plus size={16} className="mr-2" />
                Add New Task
              </Button>
            </div>
          </DialogContent>
        </div>
      </Dialog>
      <TaskFormDialog
        task={null}
        isOpen={isTaskFormOpen}
        onClose={() => setIsTaskFormOpen(false)}
        initialChildId={child.id}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Remove Task?"
        description={`Are you sure you want to remove "${taskToDelete?.name}" from ${child.name}'s task list? This task will no longer appear for this child.`}
        confirmLabel="Yes, Remove"
        cancelLabel="No, Keep It"
        variant="danger"
      />
    </>
  );
}
