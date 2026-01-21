import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import WalletCard from '@/components/store/WalletCard';
import RewardCard from '@/components/store/RewardCard';
import CategoryFilters from '@/components/store/CategoryFilters';
import ScreenTimeBudgetCard from '@/components/store/ScreenTimeBudgetCard';
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

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const queryParams = await searchParams;
  const categoryFilter = queryParams.category || 'all';

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

  if (!childId || !familyId) {
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
    .eq('family_id', familyId)
    .is('deleted_at', null)
    .single();

  if (!child) {
    redirect(`/${locale}/child-login`);
  }

  // Calculate date ranges for queries
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekStart = new Date(today.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  const weekStartDate = weekStart.toISOString().split('T')[0];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Parallelize all queries
  const [
    rewardsResult,
    screenBudgetResult,
    screenUsageResult,
    todayUsageResult,
  ] = await Promise.all([
    // Get all active rewards
    dbClient
      .from('rewards')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('points_cost', { ascending: true }),

    // Get screen time budget
    dbClient
      .from('screen_time_budgets')
      .select('*')
      .eq('child_id', child.id)
      .eq('week_start_date', weekStartDate)
      .maybeSingle(),

    // Get weekly screen usage (fallback for legacy)
    dbClient
      .from('screen_usage_log')
      .select('minutes_used')
      .eq('child_id', child.id)
      .gte('created_at', weekStart.toISOString()),

    // Get today's usage for daily limit
    dbClient
      .from('screen_usage_log')
      .select('minutes_used')
      .eq('child_id', child.id)
      .gte('created_at', todayStart.toISOString()),
  ]);

  const rewards = rewardsResult.data;
  const screenBudgetData = screenBudgetResult.data;
  const screenUsage = screenUsageResult.data;
  const todayUsage = todayUsageResult.data;

  const totalScreenMinutes = screenBudgetData?.used_minutes ||
    screenUsage?.reduce((sum, log) => sum + log.minutes_used, 0) || 0;
  const screenBudget = screenBudgetData
    ? (screenBudgetData.base_minutes + screenBudgetData.bonus_minutes)
    : (child.settings?.screenBudgetWeeklyMinutes || 300);
  const usedTodayMinutes = todayUsage?.reduce((sum, log) => sum + log.minutes_used, 0) || 0;

  // Filter rewards by category
  const filteredRewards = categoryFilter === 'all'
    ? rewards
    : rewards?.filter((reward) => reward.category === categoryFilter);

  const t = await getTranslations('child.store');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-text-main dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-lg text-text-muted dark:text-gray-400">
          {t('subtitle')}
        </p>
      </div>

      {/* Wallet & Screen Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WalletCard
          balance={child.points_balance}
          childName={child.name}
        />

        <ScreenTimeBudgetCard
          baseMinutes={screenBudgetData?.base_minutes || 180}
          bonusMinutes={screenBudgetData?.bonus_minutes || 0}
          usedMinutes={totalScreenMinutes}
          dailyLimitMinutes={screenBudgetData?.daily_limit_minutes || 60}
          usedTodayMinutes={usedTodayMinutes}
        />
      </div>

      {/* Category Filters */}
      <CategoryFilters />

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredRewards?.map((reward) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            childId={child.id}
            currentBalance={child.points_balance}
            screenUsed={totalScreenMinutes}
            screenBudget={screenBudget}
          />
        ))}
      </div>

      {filteredRewards?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-text-muted dark:text-gray-400">
            {categoryFilter === 'all' ? t('noRewards') : t('noCategoryRewards', { category: categoryFilter })}
          </p>
          <p className="text-sm text-text-muted dark:text-gray-500 mt-2">
            {categoryFilter === 'all' ? t('askParents') : t('tryDifferentCategory')}
          </p>
        </div>
      )}
    </div>
  );
}
