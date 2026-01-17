'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2 } from 'lucide-react';
import TaskFormDialog from './TaskFormDialog';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { DialogTrigger, Dialog } from '@/components/ui/dialog';

type Task = {
    id: string;
    name: string;
    description: string | null;
    category: string;
    points: number;
    icon: string | null;
    approval_type: string;
    frequency: string;
    isDisabled?: boolean;
};

interface ChildProfileTasksProps {
    child: {
        id: string;
        name: string;
    };
    tasks: Task[];
    completionCounts: Record<string, number>;
}

import { AppIcon } from '@/components/ui/AppIcon';

// ... (existing imports)

export default function ChildProfileTasks({ child, tasks, completionCounts }: ChildProfileTasksProps) {
    const router = useRouter();
    const t = useTranslations('parent.childProfileTasks');
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

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
            toast.success(t('toast.taskRemoved'));
            router.refresh();
        } catch (error) {
            console.error('Error removing task:', error);
            toast.error(t('toast.taskRemoveFailed'));
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
            toast.success(isEnabled ? t('toast.taskVisible') : t('toast.taskHidden'));
            router.refresh(); // Refresh UI
        } catch (error) {
            console.error('Error toggling task:', error);
            toast.error(t('toast.taskUpdateFailed'));
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
                    <AppIcon name="task_alt" className="text-primary h-6 w-6" />
                    {t('title')}
                </h2>
                <Button onClick={handleCreateTask} size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold h-9">
                    <Plus className="h-4 w-4 mr-1.5" />
                    {t('addTask')}
                </Button>
            </div>

            {tasks && tasks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                    {tasks.map((task) => (
                        <div key={task.id} className={`rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm group relative flex flex-col ${task.isDisabled ? 'bg-gray-50' : ''}`}>
                            <div className="p-4 flex-1">
                                {/* Header row with icon and toggle */}
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${task.isDisabled ? 'bg-gray-100 grayscale opacity-50' : 'bg-primary/10'}`}>
                                        <AppIcon
                                            name={task.icon || 'task'}
                                            className="text-primary h-6 w-6"
                                            size={24}
                                        />
                                    </div>
                                    {/* Toggle or Delete */}
                                    <div className="flex-shrink-0">
                                        {task.frequency === 'one_time' ? (
                                            <button
                                                onClick={() => handleTaskDelete(task)}
                                                className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 dark:hover:bg-red-900/30 shadow-sm"
                                                title={t('removeTask')}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        ) : (
                                            <Switch
                                                checked={!task.isDisabled}
                                                onCheckedChange={(checked) => handleTaskToggle(task, checked)}
                                            />
                                        )}
                                    </div>
                                </div>
                                {/* Content */}
                                <div className={`${task.isDisabled ? 'opacity-50' : ''}`}>
                                    <h3 className="font-bold text-text-main dark:text-white mb-1 flex items-center gap-2">
                                        <span className="truncate">{task.name}</span>
                                        {task.isDisabled && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 font-bold uppercase flex-shrink-0">Off</span>}
                                    </h3>
                                    <p className="text-xs text-text-muted dark:text-gray-400 uppercase tracking-wider mb-1">
                                        {task.category} • {task.points} XP
                                    </p>
                                    {task.description && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                            {task.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {/* Footer stats */}
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-text-muted dark:text-gray-400">
                                <span>
                                    {task.approval_type === 'auto' ? t('autoApproval') : t('manualApproval')}
                                </span>
                                {completionCounts[task.id] ? (
                                    <span className="font-medium text-green-600 dark:text-green-400">
                                        {t('completions30d', { count: completionCounts[task.id] })}
                                    </span>
                                ) : (
                                    <span>{t('noRecentActivity')}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
                        <AppIcon name="task" className="text-gray-400 dark:text-gray-600 h-8 w-8" size={32} />
                    </div>
                    <p className="text-base font-semibold text-text-muted dark:text-gray-400 mb-4">
                        {t('noActiveTasks')}
                    </p>
                    <Button onClick={handleCreateTask} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        {t('assignFirstTask')}
                    </Button>
                </div>
            )}

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
                title={t('removeTaskTitle')}
                description={t('removeTaskDescription', { taskName: taskToDelete?.name || '', childName: child.name })}
                confirmLabel={t('yesRemove')}
                cancelLabel={t('noKeep')}
                variant="danger"
            />
        </div>
    );
}
