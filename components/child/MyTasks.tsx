'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { completeTask } from '@/lib/actions/child';
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
  template?: {
    name_default: string;
    icon: string;
  } | null;
};

type Props = {
  tasks: Task[];
  childId: string;
};

const categoryIcons: Record<string, string> = {
  learning: '📚',
  life: '🏠',
  health: '💪',
  creativity: '🎨',
};

const categoryColors: Record<string, string> = {
  learning: 'bg-blue-100 text-blue-700 border-blue-200',
  life: 'bg-green-100 text-green-700 border-green-200',
  health: 'bg-red-100 text-red-700 border-red-200',
  creativity: 'bg-purple-100 text-purple-700 border-purple-200',
};

const approvalTypeLabels: Record<string, string> = {
  parent: 'Needs parent check',
  auto: 'Auto-approved',
  timer: 'Timed task',
  checklist: 'Checklist',
};

export function MyTasks({ tasks, childId }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleComplete = async (taskId: string, taskName: string, points: number) => {
    setLoading(taskId);
    const result = await completeTask(childId, taskId);
    setLoading(null);

    if (result.success) {
      toast({
        title: '🎉 Quest Completed!',
        description: `You finished "${taskName}"! Earn ${points} points when approved.`,
        duration: 5000,
      });
    } else {
      toast({
        title: '❌ Oops!',
        description: result.error || 'Could not complete task. Try again!',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  // Group tasks by category
  const tasksByCategory = tasks.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  if (tasks.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-6xl mb-4">🎯</div>
        <p className="text-lg text-gray-600 mb-2">No quests available right now!</p>
        <p className="text-sm text-gray-500">Check back soon for new tasks to complete.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-2xl">{categoryIcons[category]}</span>
            <span className="capitalize">{category}</span>
            <Badge variant="secondary" className="ml-2">
              {categoryTasks.length}
            </Badge>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {categoryTasks.map((task) => (
              <Card
                key={task.id}
                className={`p-5 border-2 hover:shadow-lg transition-shadow ${categoryColors[task.category] || ''}`}
              >
                {/* Task Header */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-3xl">
                    {task.template?.icon || categoryIcons[task.category] || '⭐'}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                      {task.name}
                    </h4>
                    {task.description && (
                      <p className="text-sm text-gray-600">{task.description}</p>
                    )}
                  </div>
                </div>

                {/* Points Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-star-gold hover:bg-star-gold text-white font-bold text-base px-3 py-1">
                    ⭐ {task.points} points
                  </Badge>
                  {task.is_trust_task && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                      🤝 Trust Task
                    </Badge>
                  )}
                </div>

                {/* Approval Type Info */}
                <p className="text-xs text-gray-500 mb-4">
                  {approvalTypeLabels[task.approval_type] || task.approval_type}
                </p>

                {/* Complete Button */}
                <Button
                  onClick={() => handleComplete(task.id, task.name, task.points)}
                  disabled={loading === task.id}
                  className="w-full bg-growth-green hover:bg-growth-green/90 text-white font-semibold"
                  size="lg"
                >
                  {loading === task.id ? '...' : '✓ Mark as Complete'}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
