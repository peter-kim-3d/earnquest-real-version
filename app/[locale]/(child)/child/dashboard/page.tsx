import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import TaskList from '@/components/child/TaskList';
import StatsCard from '@/components/child/StatsCard';
import MotivationalBanner from '@/components/child/MotivationalBanner';
import { getTranslations } from 'next-intl/server';

// Create admin client for child session (bypasses RLS)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export default async function ChildDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('child.dashboard');
  const supabase = await createClient();

  // Get child session from cookie
  const cookieStore = await cookies();
  const childSessionCookie = cookieStore.get('child_session');

  if (!childSessionCookie) {
    redirect(`/${locale}/child-login`);
  }

  let childSession;
  try {
    childSession = JSON.parse(childSessionCookie.value);
  } catch (error) {
    console.error('Invalid child session cookie:', error);
    redirect(`/${locale}/child-login`);
  }

  const { childId, familyId } = childSession;

  if (!childId) {
    redirect(`/${locale}/child-login`);
  }

  // Check if parent is logged in (for RLS)
  const { data: { user } } = await supabase.auth.getUser();

  // Use admin client if no parent auth (child direct login)
  // This bypasses RLS for verified child sessions
  const dbClient = user ? supabase : (getAdminClient() || supabase);

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

  // Cast the result to any to avoid 'never' type issues until database types are regenerated
  const typedTasks = (tasks || []) as any[];

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
