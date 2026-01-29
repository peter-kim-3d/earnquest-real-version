import { Target, Trophy, TrendUp } from '@phosphor-icons/react/dist/ssr';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import GoalList from '@/components/parent/GoalList';
import { getAuthUserWithProfile } from '@/lib/supabase/cached-queries';
import { DEFAULT_EXCHANGE_RATE, ExchangeRate } from '@/lib/utils/exchange-rate';

export default async function GoalsManagementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('goals');
  const supabase = await createClient();

  // Use cached queries - deduplicated with layout
  const { user, profile: userProfile } = await getAuthUserWithProfile();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  if (!userProfile?.family_id) {
    redirect(`/${locale}/onboarding/add-child`);
  }

  // Calculate date for weekly earnings query
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Parallelize all queries that depend on family_id
  const [
    childrenResult,
    goalsResult,
    weeklyTransactionsResult,
    familyResult,
  ] = await Promise.all([
    // Get children
    supabase
      .from('children')
      .select('id, name')
      .eq('family_id', userProfile.family_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),

    // Get all goals for this family
    supabase
      .from('goals')
      .select('*')
      .eq('family_id', userProfile.family_id)
      .is('deleted_at', null)
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: false }),

    // Get weekly earnings (last 7 days)
    supabase
      .from('point_transactions')
      .select('amount')
      .eq('family_id', userProfile.family_id)
      .eq('type', 'earn')
      .gte('created_at', weekAgo.toISOString()),

    // Get family settings for exchange rate
    supabase
      .from('families')
      .select('point_exchange_rate')
      .eq('id', userProfile.family_id)
      .single(),
  ]);

  const children = childrenResult.data || [];
  const goals = goalsResult.data || [];
  const weeklyEarnings = weeklyTransactionsResult.data?.reduce((sum, tx) => sum + tx.amount, 0) || 350;
  const exchangeRate = (familyResult.data?.point_exchange_rate || DEFAULT_EXCHANGE_RATE) as ExchangeRate;

  // Calculate stats
  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);
  const totalDeposited = goals.reduce((sum, g) => sum + (g.current_points || 0), 0);

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
              <Target size={24} className="text-primary" aria-hidden="true" />
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
              <Trophy size={24} className="text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
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
              <TrendUp size={24} className="text-green-600 dark:text-green-400" aria-hidden="true" />
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
        exchangeRate={exchangeRate}
      />
    </div>
  );
}
