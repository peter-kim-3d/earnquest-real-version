import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChildStatsCard } from '@/components/dashboard/ChildStatsCard';
import { PendingApprovals } from '@/components/dashboard/PendingApprovals';
import { QuickActions } from '@/components/dashboard/QuickActions';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/en-US/login');
  }

  // Get user's family info
  const { data: userData } = await supabase
    .from('users')
    .select('family_id, name')
    .eq('id', user.id)
    .single();

  if (!userData?.family_id) {
    redirect('/en-US/onboarding');
  }

  // Get family data
  const { data: family } = await supabase
    .from('families')
    .select('*')
    .eq('id', userData.family_id)
    .single();

  // Get children with stats
  const { data: children } = await supabase
    .from('v_child_dashboard')
    .select('*')
    .eq('family_id', userData.family_id)
    .order('name');

  // Get pending approvals count
  const { data: pendingApprovals } = await supabase
    .from('v_pending_approvals')
    .select('*')
    .eq('family_id', userData.family_id)
    .order('requested_at', { ascending: false });

  // Get task count
  const { count: taskCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('family_id', userData.family_id)
    .eq('is_active', true);

  // Get reward count
  const { count: rewardCount } = await supabase
    .from('rewards')
    .select('*', { count: 'exact', head: true })
    .eq('family_id', userData.family_id)
    .eq('is_active', true);

  const totalPoints = children?.reduce((sum, child) => sum + (child.points_balance || 0), 0) || 0;
  const totalTasksToday = children?.reduce((sum, child) => sum + (child.tasks_completed_today || 0), 0) || 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {userData.name || 'Parent'}! 👋
        </h1>
        <p className="text-gray-600">{family?.name || 'Your Family'}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Children</p>
                <p className="text-3xl font-bold text-quest-purple">{children?.length || 0}</p>
              </div>
              <div className="text-4xl">👨‍👩‍👧‍👦</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Points</p>
                <p className="text-3xl font-bold text-star-gold">{totalPoints}</p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approvals</p>
                <p className="text-3xl font-bold text-orange-500">{pendingApprovals?.length || 0}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasks Today</p>
                <p className="text-3xl font-bold text-growth-green">{totalTasksToday}</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-8">
          {/* Children Stats */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Children</h2>
              {children && children.length === 0 && (
                <Badge variant="secondary">No children yet</Badge>
              )}
            </div>

            {children && children.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {children.map((child) => (
                  <ChildStatsCard key={child.child_id} child={child} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-gray-600 mb-4">No children in your family yet</p>
                  <p className="text-sm text-gray-500">
                    Add children in your family settings to get started
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pending Approvals */}
          {pendingApprovals && pendingApprovals.length > 0 && (
            <PendingApprovals approvals={pendingApprovals} />
          )}

          {/* Family Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Family Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl">📋</div>
                  <div>
                    <p className="text-sm text-gray-600">Active Tasks</p>
                    <p className="text-xl font-bold text-blue-600">{taskCount || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl">🎁</div>
                  <div>
                    <p className="text-sm text-gray-600">Active Rewards</p>
                    <p className="text-xl font-bold text-yellow-600">{rewardCount || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl">⏰</div>
                  <div>
                    <p className="text-sm text-gray-600">Auto-Approval</p>
                    <p className="text-xl font-bold text-purple-600">
                      {family?.settings?.autoApprovalHours || 24}h
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl">📱</div>
                  <div>
                    <p className="text-sm text-gray-600">Screen Budget</p>
                    <p className="text-xl font-bold text-green-600">
                      {Math.floor((family?.settings?.screenBudgetWeeklyMinutes || 0) / 60)}h/week
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          <QuickActions />

          {/* Getting Started */}
          {(!children || children.length === 0 || !taskCount) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">🚀 Getting Started</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {(!children || children.length === 0) && (
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-quest-purple text-white flex items-center justify-center text-xs font-bold mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Add children</p>
                        <p className="text-gray-600">Create profiles for your kids</p>
                      </div>
                    </div>
                  )}
                  {!taskCount && (
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-quest-purple text-white flex items-center justify-center text-xs font-bold mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Set up tasks</p>
                        <p className="text-gray-600">Add tasks for your children to complete</p>
                      </div>
                    </div>
                  )}
                  {!rewardCount && (
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-quest-purple text-white flex items-center justify-center text-xs font-bold mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Add rewards</p>
                        <p className="text-gray-600">Create rewards they can redeem</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tips */}
          <Card className="bg-gradient-to-br from-quest-purple/5 to-star-gold/5 border-quest-purple/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                💡 <span>Tip of the Day</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                Set up a consistent routine by scheduling tasks for the same time each day. This helps children build habits!
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
