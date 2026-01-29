import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TaskList from '@/components/child/TaskList';
import StatsCard from '@/components/child/StatsCard';
import MotivationalBanner from '@/components/child/MotivationalBanner';
import { getTranslations } from 'next-intl/server';
import { getChildSession, getDbClientForChildPage } from '@/lib/api/child-auth';

export default async function ChildDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('child.dashboard');
  const supabase = await createClient();

  // Get child session from cookie
  const childSession = await getChildSession();

  if (!childSession) {
    redirect(`/${locale}/child-login`);
  }

  const { childId, familyId } = childSession;

  // Get appropriate DB client (admin for child sessions, regular for parent)
  const dbClient = await getDbClientForChildPage(supabase);

  // Get the specific child from session
  const { data: child } = await dbClient
    .from('children')
    .select('*')
    .eq('id', childId)
    .eq('family_id', familyId) // Extra security: verify family
    .is('deleted_at', null)
    .single();

  if (!child) {
    redirect(`/${locale}/child-login`);
  }

  // Get tasks for this child
  // Get active tasks from the View
  // The view handles all scheduling (daily/weekly) and overrides
  const { data: tasks, error: tasksError } = await dbClient
    .from('v_child_today_tasks')
    .select('*')
    .eq('child_id', child.id) // Filter by the View's resolved child_id
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  // Cast to remove 'never' type from view query result
  const typedTasks = tasks || [];

  // Get task completions
  const { data: completions } = await dbClient
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
            {t('readyForQuests', { name: child.name })}
          </h1>
          <p className="text-lg text-text-muted dark:text-gray-400">
            {t('earnPointsSubtitle')}
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
