import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import GoalsClient from './GoalsClient';
import { getChildSession, getDbClientForChildPage } from '@/lib/api/child-auth';

export default async function ChildGoalsPage({
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

  // Calculate date for weekly earnings query
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Parallelize all queries that depend on childId
  const [
    childResult,
    goalsResult,
    weeklyTransactionsResult,
  ] = await Promise.all([
    // Get the specific child from session
    dbClient
      .from('children')
      .select('*')
      .eq('id', childId)
      .eq('family_id', familyId)
      .is('deleted_at', null)
      .single(),

    // Get goals for this child
    dbClient
      .from('goals')
      .select('*')
      .eq('child_id', childId)
      .is('deleted_at', null)
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: false }),

    // Calculate weekly earnings (last 7 days)
    dbClient
      .from('point_transactions')
      .select('amount')
      .eq('child_id', childId)
      .eq('type', 'earn')
      .gte('created_at', weekAgo.toISOString()),
  ]);

  const child = childResult.data;
  if (!child) {
    redirect(`/${locale}/child-login`);
  }

  const goals = goalsResult.data;
  const weeklyEarnings = weeklyTransactionsResult.data?.reduce((sum, tx) => sum + tx.amount, 0) || 350;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-black text-text-main dark:text-white mb-2">
          My Goals
        </h1>
        <p className="text-lg text-text-muted dark:text-gray-400">
          Save up for something special!
        </p>
      </div>

      {/* Goals Content */}
      <GoalsClient
        goals={goals || []}
        childId={child.id}
        childName={child.name}
        availableBalance={child.points_balance}
        weeklyEarnings={weeklyEarnings}
      />
    </div>
  );
}
