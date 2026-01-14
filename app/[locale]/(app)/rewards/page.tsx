import { Gift, Plus, ShoppingCart } from '@phosphor-icons/react/dist/ssr';
import { getUser } from '@/lib/services/user';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RewardList from '@/components/parent/RewardList';
import { CheckCircle, Ticket, Package } from '@/components/ui/ClientIcons';

export default async function RewardManagementPage() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/en-US/login');
  }



  // ...

  // Get user's family
  const userProfile = await getUser(user.id) as { family_id: string } | null;

  if (!userProfile) {
    redirect('/en-US/onboarding/add-child');
  }

  // Get all rewards for this family (exclude deleted)
  const { data: rewardsData } = await supabase
    .from('rewards')
    .select('*')
    .eq('family_id', userProfile.family_id)
    .is('deleted_at', null)
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  // Explicitly type rewards to avoid 'never'
  const rewards = (rewardsData || []) as any[];

  // Get reward purchase stats
  const { data: purchaseStatsData } = await supabase
    .from('reward_purchases')
    .select('reward_id, status')
    .eq('family_id', userProfile.family_id)
    .gte('purchased_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const purchaseStats = (purchaseStatsData || []) as { reward_id: string; status: string }[];

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
          Reward Management
        </h1>
        <p className="text-lg text-text-muted dark:text-gray-400">
          Create and manage rewards your children can redeem
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
              Total Rewards
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
              Active Rewards
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
              Purchases (30d)
            </h3>
          </div>
          <p className="text-4xl font-black text-text-main dark:text-white">
            {purchaseStats?.length || 0}
          </p>
        </div>
      </div>

      {/* Reward List */}
      <RewardList rewards={rewards || []} rewardPurchases={rewardPurchases} />

      {/* Empty State */}
      {rewards?.length === 0 && (
        <div className="text-center py-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <div className="h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
            <Package size={48} className="text-gray-400 dark:text-gray-600" />
          </div>
          <p className="text-lg font-semibold text-text-muted dark:text-gray-400 mb-2">
            No rewards yet
          </p>
          <p className="text-sm text-text-muted dark:text-gray-500">
            Click &quot;New Reward&quot; above to create your first reward!
          </p>
        </div>
      )}
    </div>
  );
}
