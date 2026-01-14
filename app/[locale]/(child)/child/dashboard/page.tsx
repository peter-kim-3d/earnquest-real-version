import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import TaskList from '@/components/child/TaskList';
import StatsCard from '@/components/child/StatsCard';
import MotivationalBanner from '@/components/child/MotivationalBanner';

export default async function ChildDashboardPage() {
  const supabase = await createClient();

  // Get child session from cookie
  const cookieStore = await cookies();
  const childSessionCookie = cookieStore.get('child_session');

  if (!childSessionCookie) {
    redirect('/en-US/child-login');
  }

  let childSession;
  try {
    childSession = JSON.parse(childSessionCookie.value);
  } catch (error) {
    console.error('Invalid child session cookie:', error);
    redirect('/en-US/child-login');
  }

  const { childId } = childSession;

  if (!childId) {
    redirect('/en-US/child-login');
  }

  // Get the specific child from session
  const { data: child } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .is('deleted_at', null)
    .single();

  if (!child) {
    redirect('/en-US/child-login');
  }

  // Get tasks for this child
  // Get active tasks from the View
  // The view handles all scheduling (daily/weekly) and overrides
  const { data: tasks, error: tasksError } = await supabase
    .from('v_child_today_tasks')
    .select('*')
    .eq('child_id', child.id) // Filter by the View's resolved child_id
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  // DEBUG: Log the tasks data
  console.log('🔍 Child Dashboard Debug:', {
    childId: child.id,
    childName: child.name,
    tasksCount: tasks?.length || 0,
    tasks: tasks,
    error: tasksError,
  });

  // Cast the result to any to avoid 'never' type issues until database types are regenerated
  const typedTasks = (tasks || []) as any[];

  // Get task completions
  const { data: completions } = await supabase
    .from('task_completions')
    .select('*')
    .eq('child_id', child.id)
    .order('requested_at', { ascending: false });

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1 max-w-4xl">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-text-main dark:text-white mb-2">
            Ready for today&apos;s quests, {child.name}?
          </h1>
          <p className="text-lg text-text-muted dark:text-gray-400">
            Complete tasks to earn points and unlock rewards!
          </p>
        </div>

        {/* Motivational Banner */}
        <MotivationalBanner child={child} />

        {/* Task List with Tabs */}
        <TaskList
          tasks={tasks || []}
          completions={completions || []}
          childId={child.id}
          childName={child.name}
        />
      </div>

      {/* Sidebar - Stats */}
      <aside className="lg:w-80 space-y-6">
        <StatsCard child={child} />
      </aside>
    </div>
  );
}
