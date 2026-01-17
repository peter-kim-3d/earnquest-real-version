import { Target, Trophy, TrendUp } from '@phosphor-icons/react/dist/ssr';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import GoalList from '@/components/parent/GoalList';

export default async function GoalsManagementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('goals');
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Get user's family
  const { data: userProfile } = await supabase
    .from('users')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (!userProfile?.family_id) {
    redirect(`/${locale}/onboarding/add-child`);
  }

  // Get children
  const { data: childrenData } = await supabase
    .from('children')
    .select('id, name')
    .eq('family_id', userProfile.family_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  const children = (childrenData || []) as { id: string; name: string }[];

  // Get all goals for this family
  const { data: goalsData } = await supabase
    .from('goals')
    .select('*')
    .eq('family_id', userProfile.family_id)
    .is('deleted_at', null)
    .order('is_completed', { ascending: true })
    .order('created_at', { ascending: false });

  const goals = (goalsData || []) as any[];

  // Calculate stats
  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);
  const totalDeposited = goals.reduce((sum, g) => sum + (g.current_points || 0), 0);

  // Calculate average weekly earnings (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: weeklyTransactions } = await supabase
    .from('point_transactions')
    .select('amount')
    .eq('family_id', userProfile.family_id)
    .eq('type', 'earn')
    .gte('created_at', weekAgo.toISOString());

  const weeklyEarnings = weeklyTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 350;

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

      {/* Goal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target size={24} className="text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
              {t('stats.activeGoals')}
            </h3>
          </div>
          <p className="text-4xl font-black text-text-main dark:text-white">
            {activeGoals.length}
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Trophy size={24} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-sm font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
              {t('stats.completed')}
            </h3>
          </div>
          <p className="text-4xl font-black text-text-main dark:text-white">
            {completedGoals.length}
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendUp size={24} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
              {t('stats.totalSaved')}
            </h3>
          </div>
          <p className="text-4xl font-black text-text-main dark:text-white">
            {totalDeposited.toLocaleString()} <span className="text-lg font-bold text-gray-500">XP</span>
          </p>
        </div>
      </div>

      {/* Goal List */}
      <GoalList
        goals={goals}
        childrenList={children}
        weeklyEarnings={weeklyEarnings}
      />
    </div>
  );
}
