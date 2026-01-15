import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ActionCenter from '@/components/parent/ActionCenter';
import ChildCard from '@/components/parent/ChildCard';
import ActivityFeed from '@/components/parent/ActivityFeed';
import PendingTicketsSection from '@/components/dashboard/PendingTicketsSection';
import DashboardStats from '@/components/dashboard/DashboardStats';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import TransactionHistory from '@/components/parent/TransactionHistory';

export default async function ParentDashboardPage() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/en-US/login');
  }

  // Get user's family
  const { data: userProfile } = await supabase
    .from('users')
    .select('family_id, full_name')
    .eq('id', user.id)
    .single() as { data: { family_id: string; full_name: string } | null };

  if (!userProfile?.family_id) {
    redirect('/en-US/onboarding/add-child');
  }

  // Get children
  const { data: children } = await supabase
    .from('children')
    .select('id, name, age_group, points_balance, avatar_url, pin_code, settings')
    .eq('family_id', userProfile.family_id)
    .order('created_at', { ascending: true }) as { data: any[] | null };

  // Get pending task completions for approval
  const { data: pendingCompletions } = await supabase
    .from('task_completions')
    .select(`
      *,
      tasks(*),
      children(*)
    `)
    .eq('family_id', userProfile.family_id)
    .eq('status', 'pending')
    .order('requested_at', { ascending: true }) as { data: any[] | null };

  // Get recent activity
  const { data: recentCompletions } = await supabase
    .from('task_completions')
    .select(`
      *,
      tasks(name),
      children(name)
    `)
    .eq('family_id', userProfile.family_id)
    .in('status', ['approved', 'auto_approved'])
    .order('completed_at', { ascending: false })
    .eq('family_id', userProfile.family_id)
    .in('status', ['approved', 'auto_approved'])
    .order('completed_at', { ascending: false })
    .limit(10) as { data: any[] | null };

  // Get active tasks for child cards
  const { data: activeTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('family_id', userProfile.family_id)
    .eq('is_active', true)
    .is('deleted_at', null) as { data: any[] | null };

  // Get task overrides
  const { data: overrides } = await supabase
    .from('child_task_overrides')
    .select('task_id, child_id, is_enabled')
    .eq('is_enabled', false) as { data: any[] | null };

  // Get pending ticket use requests
  const { data: pendingTickets } = await supabase
    .from('reward_purchases')
    .select(`
      *,
      reward:rewards(id, name, description, category, icon, image_url, screen_minutes),
      children(name, avatar_url)
    `)
    .eq('family_id', userProfile.family_id)
    .eq('status', 'use_requested')
    .order('purchased_at', { ascending: true }) as { data: any[] | null };

  // Get active non-screen tickets (item/experience) that need fulfillment
  // We'll get all active tickets and filter them
  const { data: allActiveTickets } = await supabase
    .from('reward_purchases')
    .select(`
      *,
      reward:rewards(id, name, description, category, icon, image_url, screen_minutes),
      children(name, avatar_url)
    `)
    .eq('family_id', userProfile.family_id)
    .eq('status', 'active')
    .order('purchased_at', { ascending: true }) as { data: any[] | null };

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
            Welcome back{userProfile.full_name ? `, ${userProfile.full_name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-lg text-text-muted dark:text-gray-400">
            The family has {children?.length || 0} {children?.length === 1 ? 'child' : 'children'} on their quest journey
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
            Your Children
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
