import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Star, Trophy, Gift } from 'lucide-react';
import AvatarDisplay from '@/components/profile/AvatarDisplay';
import LogoutButton from '@/components/auth/LogoutButton';
import { getChildSession, getDbClientForChildPage } from '@/lib/api/child-auth';

export default async function ChildProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  // Get child session from cookie
  const childSession = await getChildSession();

  if (!childSession) {
    redirect(`/${locale}/child-login`);
  }

  const { childId, familyId } = childSession;

  // Get appropriate DB client (admin for child sessions, regular for parent)
  const dbClient = await getDbClientForChildPage(supabase);

  // Parallelize all queries
  const [childResult, familyResult, completedTasksResult, rewardsClaimedResult] = await Promise.all([
    // Get child data
    dbClient
      .from('children')
      .select('name, points_balance, avatar_url, created_at')
      .eq('id', childId)
      .eq('family_id', familyId)
      .is('deleted_at', null)
      .single(),

    // Get family name
    dbClient
      .from('families')
      .select('name')
      .eq('id', familyId)
      .single(),

    // Get achievements count (completed tasks)
    dbClient
      .from('task_completions')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId)
      .in('status', ['approved', 'auto_approved']),

    // Get claimed rewards count
    dbClient
      .from('reward_purchases')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId),
  ]);

  const childData = childResult.data;
  if (!childData) {
    redirect(`/${locale}/child-login`);
  }

  const family = familyResult.data;
  const completedTasksCount = completedTasksResult.count || 0;
  const rewardsClaimedCount = rewardsClaimedResult.count || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <AvatarDisplay
            avatarUrl={childData.avatar_url || null}
            userName={childData.name}
            size="lg"
            editable={true}
            mode="child"
            childId={childId}
          />
        </div>
        <h1 className="text-3xl font-bold text-text-main dark:text-white mb-2">
          {childData.name}
        </h1>
        <p className="text-text-muted dark:text-text-muted">
          {family?.name || 'Family'}
        </p>
      </div>

      {/* Stats Card */}
      <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-xl font-bold text-text-main dark:text-white mb-4">
          My Stats
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {/* XP Points */}
          <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" aria-hidden="true" />
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {childData.points_balance}
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">XP Points</p>
          </div>

          {/* Completed Quests */}
          <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Trophy className="h-8 w-8 text-blue-500 mx-auto mb-2" aria-hidden="true" />
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {completedTasksCount}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">Quests Done</p>
          </div>

          {/* Rewards Claimed */}
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
            <Gift className="h-8 w-8 text-green-500 mx-auto mb-2" aria-hidden="true" />
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {rewardsClaimedCount}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">Rewards</p>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <LogoutButton
        locale={locale}
        variant="child"
        className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
      />

      {/* Member Since */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-text-muted dark:text-text-muted text-center">
          Quest Hero since <time dateTime={childData.created_at}>{new Date(childData.created_at || '').toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</time>
        </p>
      </div>
    </div>
  );
}
