import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import WalletCard from '@/components/store/WalletCard';
import RewardCard from '@/components/store/RewardCard';
import CategoryFilters from '@/components/store/CategoryFilters';
import ScreenTimeBudgetCard from '@/components/store/ScreenTimeBudgetCard';

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const categoryFilter = params.category || 'all';

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/en-US/login');
  }

  // Get user's family
  const { data: userProfile } = await supabase
    .from('users')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (!userProfile) {
    redirect('/en-US/onboarding/add-child');
  }

  // Get first child
  const { data: child } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', userProfile.family_id)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!child) {
    redirect('/en-US/onboarding/add-child');
  }

  // Get all active rewards
  const { data: rewards } = await supabase
    .from('rewards')
    .select('*')
    .eq('family_id', userProfile.family_id)
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('points_cost', { ascending: true });

  // Get screen time budget
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const weekStart = new Date(today.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  const weekStartDate = weekStart.toISOString().split('T')[0];

  const { data: screenBudgetData } = await supabase
    .from('screen_time_budgets')
    .select('*')
    .eq('child_id', child.id)
    .eq('week_start_date', weekStartDate)
    .maybeSingle();

  // Fallback to legacy screen usage if no budget exists
  const { data: screenUsage } = await supabase
    .from('screen_usage_log')
    .select('minutes_used')
    .eq('child_id', child.id)
    .gte('created_at', weekStart.toISOString());

  const totalScreenMinutes = screenBudgetData?.used_minutes ||
    screenUsage?.reduce((sum, log) => sum + log.minutes_used, 0) || 0;
  const screenBudget = screenBudgetData
    ? (screenBudgetData.base_minutes + screenBudgetData.bonus_minutes)
    : (child.settings?.screenBudgetWeeklyMinutes || 300);

  // Get today's usage for daily limit
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data: todayUsage } = await supabase
    .from('screen_usage_log')
    .select('minutes_used')
    .eq('child_id', child.id)
    .gte('created_at', todayStart.toISOString());

  const usedTodayMinutes = todayUsage?.reduce((sum, log) => sum + log.minutes_used, 0) || 0;

  // Filter rewards by category
  const filteredRewards = categoryFilter === 'all'
    ? rewards
    : rewards?.filter((reward) => reward.category === categoryFilter);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-text-main dark:text-white mb-2">
          Reward Store
        </h1>
        <p className="text-lg text-text-muted dark:text-gray-400">
          Spend your Quest Points on awesome rewards!
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
            {categoryFilter === 'all' ? 'No rewards available yet' : `No ${categoryFilter} rewards available`}
          </p>
          <p className="text-sm text-text-muted dark:text-gray-500 mt-2">
            {categoryFilter === 'all' ? 'Ask your parents to add some rewards!' : 'Try selecting a different category'}
          </p>
        </div>
      )}
    </div>
  );
}
