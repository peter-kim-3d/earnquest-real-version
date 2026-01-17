import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Star, Trophy, Gift, LogOut } from 'lucide-react';
import AvatarDisplay from '@/components/profile/AvatarDisplay';

export default async function ChildProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Check for child session cookie
  const cookieStore = await cookies();
  const childSessionCookie = cookieStore.get('child_session');

  if (!childSessionCookie) {
    redirect(`/${locale}/child-login`);
  }

  // Parse child session
  let childSession: { childId: string; familyId: string };
  try {
    childSession = JSON.parse(childSessionCookie.value);
  } catch (error) {
    redirect(`/${locale}/child-login`);
  }

  const { childId, familyId } = childSession;
  if (!childId || !familyId) {
    redirect(`/${locale}/child-login`);
  }

  // Get child data
  const supabase = await createClient();
  const { data: childData } = await supabase
    .from('children')
    .select('name, points_balance, avatar_url, created_at')
    .eq('id', childId)
    .eq('family_id', familyId)
    .single();

  if (!childData) {
    redirect(`/${locale}/child-login`);
  }

  // Get family name
  const { data: family } = await supabase
    .from('families')
    .select('name')
    .eq('id', familyId)
    .single();

  // Get achievements count (completed tasks)
  const { count: completedTasksCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('family_id', familyId)
    .eq('completed_by_child_id', childId)
    .eq('status', 'completed');

  // Get claimed rewards count
  const { count: rewardsClaimedCount } = await supabase
    .from('reward_claims')
    .select('*', { count: 'exact', head: true })
    .eq('child_id', childId);

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
            <Star className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {childData.points_balance}
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">XP Points</p>
          </div>

          {/* Completed Quests */}
          <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Trophy className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {completedTasksCount || 0}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">Quests Done</p>
          </div>

          {/* Rewards Claimed */}
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
            <Gift className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">
              {rewardsClaimedCount || 0}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">Rewards</p>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <form action="/api/auth/child-logout" method="POST">
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
        >
          <LogOut className="h-5 w-5 text-red-500" />
          <span className="font-semibold text-red-500">Logout</span>
        </button>
      </form>

      {/* Member Since */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-text-muted dark:text-text-muted text-center">
          Quest Hero since {new Date(childData.created_at || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  );
}
