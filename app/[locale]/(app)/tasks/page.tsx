import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TaskList from '@/components/parent/TaskList';
import TaskCard from '@/components/tasks/TaskCard';
import { Checks, CheckCircle, TrendUp, ListChecks } from '@/components/ui/ClientIcons';

type Task = {
  id: string;
  created_at: string;
  name: string;
  description: string | null;
  points: number;
  category: string;
  icon: string | null;
  image_url: string | null;
  frequency: string;
  is_active: boolean;
  family_id: string;
  deleted_at: string | null;
  approval_type: string;
  archived_at: string | null;
  child_id: string | null;
};

export default async function TaskManagementPage() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/en-US/login');
  }

  // Get user's family
  const { data: userProfile } = await supabase
    .from('users')
    .select('family_id, full_name')
    .eq('id', user.id)
    .single() as { data: { family_id: string; full_name: string } | null };

  if (!userProfile?.family_id) {
    redirect('/en-US/onboarding/add-child');
  }

  // Get all tasks for this family (exclude deleted)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('family_id', userProfile.family_id)
    .is('deleted_at', null)
    .order('category', { ascending: true })
    .order('name', { ascending: true }) as { data: Task[] | null };

  // Get children for assignee lookup
  const { data: children } = await supabase
    .from('children')
    .select('id, name, avatar_url')
    .eq('family_id', userProfile.family_id) as { data: any[] | null };

  // Get task completion stats (including pending)
  const { data: completionStats } = await supabase
    .from('task_completions')
    .select('task_id, status')
    .eq('family_id', userProfile.family_id)
    .in('status', ['approved', 'auto_approved', 'pending_approval'])
    .gte('completed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) as { data: { task_id: string; status: string }[] | null };

  // Calculate completion count per task (approved/auto_approved)
  const taskCompletions = new Map<string, number>();
  // Calculate pending count per task
  const pendingCounts = new Map<string, number>();

  completionStats?.forEach((completion) => {
    if (completion.status === 'pending_approval') {
      const count = pendingCounts.get(completion.task_id) || 0;
      pendingCounts.set(completion.task_id, count + 1);
    } else {
      const count = taskCompletions.get(completion.task_id) || 0;
      taskCompletions.set(completion.task_id, count + 1);
    }
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-text-main dark:text-white mb-2">
          Task Management
        </h1>
        <p className="text-lg text-text-muted dark:text-gray-400">
          Create and manage tasks for your family
        </p>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Checks size={24} className="text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
              Total Tasks
            </h3>
          </div>
          <p className="text-4xl font-black text-text-main dark:text-white">
            {tasks?.length || 0}
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle size={24} weight="fill" className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
              Active Tasks
            </h3>
          </div>
          <p className="text-4xl font-black text-text-main dark:text-white">
            {tasks?.filter((t) => t.is_active).length || 0}
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendUp size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
              Completions (30d)
            </h3>
          </div>
          <p className="text-4xl font-black text-text-main dark:text-white">
            {/* Count only approved completions here */}
            {completionStats?.filter(c => c.status !== 'pending_approval').length || 0}
          </p>
        </div>
      </div>

      {/* Task List */}
      <TaskList
        tasks={tasks || []}
        taskCompletions={taskCompletions}
        pendingCounts={pendingCounts}
        childrenData={children || []}
      />

      {/* Empty State */}
      {tasks?.length === 0 && (
        <div className="text-center py-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
            <ListChecks size={48} className="text-gray-400 dark:text-gray-600" />
          </div>
          <p className="text-lg font-semibold text-text-muted dark:text-gray-400 mb-2">
            No tasks yet
          </p>
          <p className="text-sm text-text-muted dark:text-gray-500">
            Click &quot;New Task&quot; above to create your first task!
          </p>
        </div>
      )}
    </div>
  );
}
