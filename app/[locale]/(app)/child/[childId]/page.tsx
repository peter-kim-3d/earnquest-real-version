import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MyTasks } from '@/components/child/MyTasks';
import { MyCompletions } from '@/components/child/MyCompletions';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Props = {
  params: Promise<{
    locale: string;
    childId: string;
  }>;
};

export default async function ChildDashboardPage({ params }: Props) {
  const { childId } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/en-US/login');
  }

  // Get user's family
  const { data: userData } = await supabase
    .from('users')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (!userData?.family_id) {
    redirect('/en-US/onboarding');
  }

  // Get child data and verify belongs to family
  const { data: child } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .eq('family_id', userData.family_id)
    .is('deleted_at', null)
    .single();

  if (!child) {
    redirect('/en-US/dashboard');
  }

  // Get available tasks for this child (assigned to them or unassigned)
  const { data: availableTasks } = await supabase
    .from('tasks')
    .select(`
      *,
      template:task_templates(name_default, icon)
    `)
    .eq('family_id', userData.family_id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .or(`child_id.eq.${child.id},child_id.is.null`)
    .order('category')
    .order('points', { ascending: false });

  // Get child's task completions (pending, approved, fix_requested)
  const { data: completions } = await supabase
    .from('task_completions')
    .select(`
      *,
      task:tasks(name, points, category)
    `)
    .eq('child_id', child.id)
    .in('status', ['pending', 'approved', 'fix_requested'])
    .order('requested_at', { ascending: false })
    .limit(20);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Child Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{child.avatar_url || '👤'}</div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{child.name}&apos;s Quest Board</h1>
            <p className="text-gray-600">Complete tasks and earn rewards!</p>
          </div>
        </div>

        {/* Points Display */}
        <Card className="p-4 bg-gradient-to-br from-star-gold/20 to-star-gold/5 border-star-gold/30">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-3xl">⭐</span>
              <span className="text-4xl font-bold text-star-gold">{child.points_balance}</span>
            </div>
            <p className="text-sm text-gray-600 font-medium">Points</p>
          </div>
        </Card>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-growth-green">{child.tasks_completed_count || 0}</p>
          <p className="text-sm text-gray-600">Tasks Completed</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-quest-purple">
            {completions?.filter((c) => c.status === 'pending').length || 0}
          </p>
          <p className="text-sm text-gray-600">Pending Approval</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-star-gold">{child.points_lifetime_earned || 0}</p>
          <p className="text-sm text-gray-600">Total Earned</p>
        </Card>
      </div>

      {/* Available Tasks */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Available Quests</h2>
          <Badge variant="secondary" className="bg-quest-purple/10 text-quest-purple">
            {availableTasks?.length || 0} available
          </Badge>
        </div>
        <MyTasks tasks={availableTasks || []} childId={child.id} />
      </div>

      {/* My Submissions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Submissions</h2>
        <MyCompletions completions={completions || []} />
      </div>
    </div>
  );
}
