import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import TaskList from '@/components/parent/TaskList';
import { Checks, CheckCircle, TrendUp, ListChecks } from '@/components/ui/ClientIcons';
import { getAuthUserWithProfile } from '@/lib/supabase/cached-queries';
import { HISTORY_LOOKBACK_DAYS, TIME_MS } from '@/lib/constants';
import { DEFAULT_EXCHANGE_RATE, ExchangeRate } from '@/lib/utils/exchange-rate';

export default async function TaskManagementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('tasks');
  const supabase = await createClient();

  // Use cached queries - deduplicated with layout
  const { user, profile: userProfile } = await getAuthUserWithProfile();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (!userProfile?.family_id) {
    redirect(`/${locale}/onboarding/add-child`);
  }

  // Parallelize all queries that depend on family_id
  const [tasksResult, childrenResult, completionStatsResult, familyResult] = await Promise.all([
    // Get all tasks for this family (exclude deleted)
    supabase
      .from('tasks')
      .select('*')
      .eq('family_id', userProfile.family_id)
      .is('deleted_at', null)
      .order('category', { ascending: true })
      .order('name', { ascending: true }),

    // Get children for assignee lookup
    supabase
      .from('children')
      .select('id, name, avatar_url')
      .eq('family_id', userProfile.family_id),

    // Get task completion stats (including pending)
    supabase
      .from('task_completions')
      .select('task_id, status')
      .eq('family_id', userProfile.family_id)
      .in('status', ['approved', 'auto_approved', 'pending_approval'])
      .gte('completed_at', new Date(Date.now() - HISTORY_LOOKBACK_DAYS * TIME_MS.DAY).toISOString()),

    // Get family settings for exchange rate
    supabase
      .from('families')
      .select('point_exchange_rate')
      .eq('id', userProfile.family_id)
      .single(),
  ]);

  const tasks = tasksResult.data;
  const children = childrenResult.data;
  const completionStats = completionStatsResult.data as { task_id: string; status: string }[] | null;
  const exchangeRate = (familyResult.data?.point_exchange_rate || DEFAULT_EXCHANGE_RATE) as ExchangeRate;

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
          {t('pageTitle')}
        </h1>
        <p className="text-lg text-text-muted dark:text-gray-400">
          {t('pageSubtitle')}
        </p>
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Checks size={24} className="text-primary" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
              {t('stats.totalTasks')}
            </h3>
          </div>
          <p className="text-4xl font-black text-text-main dark:text-white">
            {tasks?.length || 0}
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle size={24} weight="fill" className="text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
              {t('stats.activeTasks')}
            </h3>
          </div>
          <p className="text-4xl font-black text-text-main dark:text-white">
            {tasks?.filter((task) => task.is_active).length || 0}
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <TrendUp size={24} className="text-purple-600 dark:text-purple-400" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
              {t('stats.completions30d')}
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
        exchangeRate={exchangeRate}
      />

      {/* Empty State */}
      {tasks?.length === 0 && (
        <div className="text-center py-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
            <ListChecks size={48} className="text-gray-400 dark:text-gray-600" aria-hidden="true" />
          </div>
          <p className="text-lg font-semibold text-text-muted dark:text-gray-400 mb-2">
            {t('noTasks')}
          </p>
          <p className="text-sm text-text-muted dark:text-gray-500">
            {t('clickNewTask')}
          </p>
        </div>
      )}
    </div>
  );
}
