import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import ChildStats from '@/components/parent/ChildStats';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ChildProfileTasks from '@/components/parent/ChildProfileTasks';
import TaskInsights from '@/components/parent/TaskInsights';
import { HISTORY_LOOKBACK_DAYS, TIME_MS } from '@/lib/constants';
import type { PostgrestError } from '@supabase/supabase-js';

export default async function ChildProfilePage({
  params,
}: {
  params: Promise<{ childId: string; locale: string }>;
}) {
  const { childId, locale } = await params;
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Get user's family
  const { data: userProfile } = await supabase
    .from('users')
    .select('family_id')
    .eq('id', user.id)
    .single() as { data: { family_id: string } | null };

  if (!userProfile?.family_id) {
    redirect(`/${locale}/onboarding/add-child`);
  }

  // Get child
  const { data: child, error } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .single() as { data: { id: string; name: string; avatar_url: string | null; points_balance: number; points_lifetime_earned: number; age_group: string; trust_level: number; trust_streak_days: number; settings: { weeklyGoal?: number } } | null; error: PostgrestError | null };

  if (!child) {
    notFound();
  }
  // Get active tasks for this child
  const { data: activeTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('family_id', userProfile.family_id)
    .or(`child_id.eq.${childId},child_id.is.null`)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('category', { ascending: true })
    .order('name', { ascending: true }) as { data: any[] | null };

  // Get task overrides for this child
  const { data: overrides } = await supabase
    .from('child_task_overrides')
    .select('task_id, is_enabled')
    .eq('child_id', childId) as { data: { task_id: string; is_enabled: boolean }[] | null };

  // Map tasks to include disabled status
  const tasksWithStatus = activeTasks
    ?.map(task => {
      const override = overrides?.find(o => o.task_id === task.id);
      // If override exists and is_enabled is false, it's disabled. Default is enabled.
      return {
        ...task,
        isDisabled: override ? !override.is_enabled : false
      };
    })
    .filter(task => {
      // For one-time tasks: remove completely if disabled
      // For recurring tasks: keep but show as disabled
      if (task.frequency === 'one_time' && task.isDisabled) {
        return false; // Remove from list
      }
      return true; // Keep in list
    });

  // Get task completion stats
  const { data: completionStats } = await supabase
    .from('task_completions')
    .select('task_id')
    .eq('child_id', childId)
    .in('status', ['approved', 'auto_approved'])
    .gte('completed_at', new Date(Date.now() - HISTORY_LOOKBACK_DAYS * TIME_MS.DAY).toISOString()) as { data: { task_id: string }[] | null };

  const taskCompletions = new Map<string, number>();
  completionStats?.forEach((c) => {
    const count = taskCompletions.get(c.task_id) || 0;
    taskCompletions.set(c.task_id, count + 1);
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Link
        href={`/${locale}/dashboard`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted dark:text-gray-400 hover:text-text-main dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-green-600 p-1">
            <div className="h-full w-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {child.name?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-text-main dark:text-white">
              {child.name}
            </h1>
            <p className="text-lg text-text-muted dark:text-gray-400 capitalize">
              Age {child.age_group}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Child Stats */}
        <ChildStats child={child} />

        {/* Task Insights */}
        <TaskInsights childId={childId} />

        {/* Assigned Tasks */}
        <ChildProfileTasks
          child={child}
          tasks={tasksWithStatus || []}
          completionCounts={Object.fromEntries(taskCompletions)}
        />
      </div>
    </div>
  );
}
