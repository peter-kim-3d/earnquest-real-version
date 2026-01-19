import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import ActionCenter from '@/components/parent/ActionCenter';
import ChildCard from '@/components/parent/ChildCard';
import ActivityFeed from '@/components/parent/ActivityFeed';
import PendingTicketsSection from '@/components/dashboard/PendingTicketsSection';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import TransactionHistory from '@/components/parent/TransactionHistory';
import { getAuthUserWithProfile } from '@/lib/supabase/cached-queries';

export default async function ParentDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('parent.dashboard');
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
  const [
    childrenResult,
    pendingCompletionsResult,
    recentCompletionsResult,
    activeTasksResult,
    overridesResult,
    pendingTicketsResult,
    allActiveTicketsResult,
  ] = await Promise.all([
    // Get children
    supabase
      .from('children')
      .select('id, name, age_group, points_balance, avatar_url, pin_code, settings')
      .eq('family_id', userProfile.family_id)
      .order('created_at', { ascending: true }),

    // Get pending task completions for approval
    supabase
      .from('task_completions')
      .select(`
        *,
        tasks(*),
        children(*)
      `)
      .eq('family_id', userProfile.family_id)
      .eq('status', 'pending')
      .order('requested_at', { ascending: true }),

    // Get recent activity (fixed duplicate filters)
    supabase
      .from('task_completions')
      .select(`
        *,
        tasks(name),
        children(name)
      `)
      .eq('family_id', userProfile.family_id)
      .in('status', ['approved', 'auto_approved'])
      .order('completed_at', { ascending: false })
      .limit(10),

    // Get active tasks for child cards
    supabase
      .from('tasks')
      .select('*')
      .eq('family_id', userProfile.family_id)
      .eq('is_active', true)
      .is('deleted_at', null),

    // Get task overrides
    supabase
      .from('child_task_overrides')
      .select('task_id, child_id, is_enabled')
      .eq('is_enabled', false),

    // Get pending ticket use requests
    supabase
      .from('reward_purchases')
      .select(`
        *,
        reward:rewards(id, name, description, category, icon, image_url, screen_minutes),
        children(name, avatar_url)
      `)
      .eq('family_id', userProfile.family_id)
      .eq('status', 'use_requested')
      .order('purchased_at', { ascending: true }),

    // Get active non-screen tickets (item/experience) that need fulfillment
    supabase
      .from('reward_purchases')
      .select(`
        *,
        reward:rewards(id, name, description, category, icon, image_url, screen_minutes),
        children(name, avatar_url)
      `)
      .eq('family_id', userProfile.family_id)
      .eq('status', 'active')
      .order('purchased_at', { ascending: true }),
  ]);

  const children = childrenResult.data as any[] | null;
  const pendingCompletions = pendingCompletionsResult.data as any[] | null;
  const recentCompletions = recentCompletionsResult.data as any[] | null;
  const activeTasks = activeTasksResult.data as any[] | null;
  const overrides = overridesResult.data as any[] | null;
  const pendingTickets = pendingTicketsResult.data as any[] | null;
  const allActiveTickets = allActiveTicketsResult.data as any[] | null;

  // Filter for non-screen rewards (item/experience) that need parent fulfillment
  const activeTickets = (allActiveTickets || []).filter((ticket: any) => {
    const category = ticket.reward?.category;
    return category === 'item' || category === 'experience';
  });

  // Calculate Weekly XP (Proxy using points balance for now, ideally sum up weekly logs)
  const totalWeeklyXP = children?.reduce((acc, child) => acc + (child.points_balance || 0), 0) || 0;

  return (
    <DashboardLayout
      header={
        <div>
          <h1 className="text-3xl font-black text-text-main dark:text-white mb-2">
            {userProfile.full_name
              ? t('welcome', { name: userProfile.full_name.split(' ')[0] })
              : t('welcomeNoName')}
          </h1>
          <p className="text-lg text-text-muted dark:text-gray-400">
            {t('familyStatus', { count: children?.length || 0 })}
          </p>
        </div>
      }
      stats={
        <DashboardStats
          activeTasksCount={activeTasks?.length || 0}
          pendingApprovalsCount={pendingCompletions?.length || 0}
          totalWeeklyXP={totalWeeklyXP}
        />
      }
      actionCenter={
        <ActionCenter
          pendingCompletions={pendingCompletions || []}
          familyId={userProfile.family_id}
        />
      }
      pendingTickets={
        <PendingTicketsSection
          pendingTickets={pendingTickets || []}
          activeTickets={activeTickets}
        />
      }
      activityFeed={
        <ActivityFeed completions={recentCompletions || []} />
      }
      transactionHistory={
        <TransactionHistory limit={20} />
      }
      childrenList={
        <div>
          <h2 className="text-xl font-bold text-text-main dark:text-white mb-4">
            {t('yourChildren')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4">
            {children?.map((child) => (
              <ChildCard
                key={child.id}
                child={child}
                tasks={activeTasks
                  ?.filter(t => t.child_id === child.id || t.child_id === null)
                  .map(t => {
                    const isDisabled = overrides?.some(o =>
                      o.task_id === t.id &&
                      o.child_id === child.id &&
                      o.is_enabled === false
                    );
                    return { ...t, isDisabled };
                  })
                  .filter(t => {
                    // For one-time tasks: remove completely if disabled
                    // For recurring tasks: keep but show as disabled
                    if (t.frequency === 'one_time' && t.isDisabled) {
                      return false; // Remove from list
                    }
                    return true; // Keep in list
                  }) || []}
              />
            ))}
          </div>
        </div>
      }
    />
  );
}
