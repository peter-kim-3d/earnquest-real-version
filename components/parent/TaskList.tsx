'use client';

import { useState } from 'react';
import { Plus, CheckSquare, Pause, Archive } from '@phosphor-icons/react';
import TaskCard from './TaskCard';
import TaskFormDialog from './TaskFormDialog';

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
  created_at: string;
  archived_at: string | null;
  child_id: string | null;
};

type Child = {
  id: string;
  name: string;
  avatar_url: string | null;
};

interface TaskListProps {
  tasks: Task[];
  taskCompletions: Map<string, number>;
  pendingCounts?: Map<string, number>;
  childrenData: Child[];
}

export default function TaskList({ tasks, taskCompletions, pendingCounts, childrenData = [] }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');

  // Bulk Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

  const handleNew = () => {
    setSelectedTask(null);
    setIsDialogOpen(true);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'archived') {
      return task.archived_at !== null;
    } else {
      if (task.archived_at !== null) return false;
      if (filter === 'active') return task.is_active;
      if (filter === 'inactive') return !task.is_active;
      return true;
    }
  });

  const handleEdit = (task: Task) => {
    if (isSelectionMode) return; // Disable edit in selection mode
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedTask(null);
    setIsDialogOpen(false);
  };

  // Selection Handlers
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedTaskIds(new Set()); // Clear selection when toggling
  };

  const toggleTaskSelection = (taskId: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTaskIds(newSelected);
  };

  const selectAll = () => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)));
    }
  };

  // Bulk Actions
  const handleBulkArchive = async (archive: boolean) => {
    if (!confirm(`Are you sure you want to ${archive ? 'archive' : 'unarchive'} ${selectedTaskIds.size} tasks?`)) return;

    setIsBulkProcessing(true);
    try {
      await Promise.all(Array.from(selectedTaskIds).map(id =>
        fetch('/api/tasks/archive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: id, archive }),
        })
      ));
      // Refresh logic would ideally go here or rely on router refresh
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Bulk archive failed', error);
      alert('Some tasks failed to update.');
    } finally {
      setIsBulkProcessing(false);
      setIsSelectionMode(false);
      setSelectedTaskIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to DELETE ${selectedTaskIds.size} tasks? This cannot be undone.`)) return;

    setIsBulkProcessing(true);
    try {
      await Promise.all(Array.from(selectedTaskIds).map(id =>
        fetch('/api/tasks/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: id }),
        })
      ));
      window.location.reload();
    } catch (error) {
      console.error('Bulk delete failed', error);
      alert('Some tasks failed to delete.');
    } finally {
      setIsBulkProcessing(false);
      setIsSelectionMode(false);
      setSelectedTaskIds(new Set());
    }
  };

  // Group tasks by category
  const groupedTasks = filteredTasks.reduce((acc, task) => {
    const category = task.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const categoryLabels: Record<string, string> = {
    hygiene: '🧼 Hygiene',
    chores: '🏠 Chores',
    learning: '📚 Learning',
    exercise: '💪 Exercise',
    creativity: '🎨 Creativity',
    other: '📋 Other',
  };

  return (
    <div className="space-y-6">
      {/* Filters and New Button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${filter === 'all'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <CheckSquare size={16} weight="bold" />
            All Tasks
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${filter === 'active'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <CheckSquare size={16} weight="fill" />
            Active
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${filter === 'inactive'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <Pause size={16} weight="bold" />
            Inactive
          </button>
          <button
            onClick={() => setFilter('archived')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${filter === 'archived'
              ? 'bg-primary text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-text-muted dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
          >
            <Archive size={16} weight="bold" />
            Archived
          </button>
        </div>

        {/* Actions Group */}
        <div className="flex items-center gap-2">
          {!isSelectionMode ? (
            <>
              <button
                onClick={toggleSelectionMode}
                className="px-4 py-2 rounded-full border-2 border-gray-200 dark:border-gray-700 text-text-main dark:text-white font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Select
              </button>
              <button
                onClick={handleNew}
                className="px-4 py-2 rounded-full bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
              >
                <Plus size={18} weight="bold" />
                New Task
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="px-4 py-2 rounded-full border-2 border-gray-200 dark:border-gray-700 text-text-main dark:text-white font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                {selectedTaskIds.size === filteredTasks.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                onClick={toggleSelectionMode}
                className="px-4 py-2 rounded-full border-2 border-gray-200 dark:border-gray-700 text-text-main dark:text-white font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Action Bar - Sticky Bottom */}
      {isSelectionMode && selectedTaskIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-gray-800 rounded-full shadow-xl border border-gray-200 dark:border-gray-700 p-2 px-6 flex items-center gap-4 animate-in slide-in-from-bottom-4">
          <span className="text-sm font-semibold text-text-main dark:text-white whitespace-nowrap">
            {selectedTaskIds.size} selected
          </span>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />

          {filter !== 'archived' ? (
            <button
              onClick={() => handleBulkArchive(true)}
              disabled={isBulkProcessing}
              className="text-sm font-medium text-text-muted hover:text-primary transition-colors"
            >
              Archive
            </button>
          ) : (
            <button
              onClick={() => handleBulkArchive(false)}
              disabled={isBulkProcessing}
              className="text-sm font-medium text-text-muted hover:text-primary transition-colors"
            >
              Unarchive
            </button>
          )}

          <button
            onClick={handleBulkDelete}
            disabled={isBulkProcessing}
            className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      )}

      {/* Task Groups */}
      {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
        <div key={category}>
          <h2 className="text-xl font-bold text-text-main dark:text-white mb-4">
            {categoryLabels[category] || category}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoryTasks.map((task) => {
              const assignee = task.child_id ? childrenData.find(c => c.id === task.child_id) : null;
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  assignee={assignee}
                  completionCount={taskCompletions.get(task.id) || 0}
                  pendingCount={pendingCounts?.get(task.id) || 0}
                  onEdit={() => handleEdit(task)}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedTaskIds.has(task.id)}
                  onToggleSelect={() => toggleTaskSelection(task.id)}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Task Form Dialog */}
      <TaskFormDialog
        task={selectedTask}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        availableChildren={childrenData}
      />
    </div>
  );
}
