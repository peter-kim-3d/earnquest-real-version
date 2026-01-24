import { Gift } from '@phosphor-icons/react/dist/ssr';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import RewardList from '@/components/parent/RewardList';
import { CheckCircle, Ticket, Package } from '@/components/ui/ClientIcons';
import { getAuthUserWithProfile } from '@/lib/supabase/cached-queries';
import { DEFAULT_EXCHANGE_RATE, ExchangeRate } from '@/lib/utils/exchange-rate';

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

export default async function RewardManagementPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('rewards');
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
  const [rewardsResult, purchaseStatsResult, familyResult, childrenResult] = await Promise.all([
    // Get all rewards for this family (exclude deleted)
    supabase
      .from('rewards')
      .select('*')
      .eq('family_id', userProfile.family_id)
      .is('deleted_at', null)
      .order('category', { ascending: true })
      .order('name', { ascending: true }),

    // Get reward purchase stats
    supabase
      .from('reward_purchases')
      .select('reward_id, status')
      .eq('family_id', userProfile.family_id)
      .gte('purchased_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

    // Get family settings for exchange rate
    supabase
      .from('families')
      .select('point_exchange_rate')
      .eq('id', userProfile.family_id)
      .single(),

    // Get children for gift feature
    supabase
      .from('children')
      .select('id, name, avatar_url, avatar_preset')
      .eq('family_id', userProfile.family_id)
      .order('name'),
  ]);

  const rewards = (rewardsResult.data || []) as any[];
  const purchaseStats = (purchaseStatsResult.data || []) as { reward_id: string; status: string }[];
  const exchangeRate = (familyResult.data?.point_exchange_rate || DEFAULT_EXCHANGE_RATE) as ExchangeRate;

  // Debug: log children query result
  console.log('[rewards/page] Children query result:', {
    data: childrenResult.data,
    error: childrenResult.error,
    familyId: userProfile.family_id
  });

  const children = (childrenResult.data || []) as { id: string; name: string; avatar_url: string | null; avatar_preset: string | null }[];

  // Calculate purchase count per reward
  const rewardPurchases = new Map<string, number>();
  purchaseStats?.forEach((purchase) => {
    const count = rewardPurchases.get(purchase.reward_id) || 0;
    rewardPurchases.set(purchase.reward_id, count + 1);
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

      {/* Reward Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Gift size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-sm font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
              {t('pageStats.totalRewards')}
            </h3>
          </div>
          <p className="text-4xl font-black text-text-main dark:text-white">
            {rewards?.length || 0}
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle size={24} weight="fill" className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
              {t('pageStats.activeRewards')}
            </h3>
          </div>
          <p className="text-4xl font-black text-text-main dark:text-white">
            {rewards?.filter((r) => r.is_active).length || 0}
          </p>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Ticket size={24} className="text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-sm font-semibold text-text-muted dark:text-gray-400 uppercase tracking-wider">
              {t('pageStats.purchases30d')}
            </h3>
          </div>
          <p className="text-4xl font-black text-text-main dark:text-white">
            {purchaseStats?.length || 0}
          </p>
        </div>
      </div>

      {/* Debug: Show children count */}
      {process.env.NODE_ENV === 'development' || true ? (
        <div className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-sm">
          Debug: Children count = {children.length}, Error = {childrenResult.error?.message || 'none'}
        </div>
      ) : null}

      {/* Reward List */}
      <RewardList rewards={rewards || []} rewardPurchases={rewardPurchases} exchangeRate={exchangeRate} familyChildren={children} />

      {/* Empty State */}
      {rewards?.length === 0 && (
        <div className="text-center py-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
            <Package size={48} className="text-gray-400 dark:text-gray-600" />
          </div>
          <p className="text-lg font-semibold text-text-muted dark:text-gray-400 mb-2">
            {t('noRewards')}
          </p>
          <p className="text-sm text-text-muted dark:text-gray-500">
            {t('clickNewReward')}
          </p>
        </div>
      )}
    </div>
  );
}
