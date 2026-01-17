import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import GoalsClient from './GoalsClient';

export default async function ChildGoalsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  // Get child session from cookie
  const cookieStore = await cookies();
  const childSessionCookie = cookieStore.get('child_session');

  if (!childSessionCookie) {
    redirect(`/${locale}/child-login`);
  }

  let childSession;
  try {
    childSession = JSON.parse(childSessionCookie.value);
  } catch (error) {
    console.error('Invalid child session cookie:', error);
    redirect(`/${locale}/child-login`);
  }

  const { childId } = childSession;

  if (!childId) {
    redirect(`/${locale}/child-login`);
  }

  // Get the specific child from session
  const { data: child } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .is('deleted_at', null)
    .single();

  if (!child) {
    redirect(`/${locale}/child-login`);
  }

  // Get goals for this child
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('child_id', child.id)
    .is('deleted_at', null)
    .order('is_completed', { ascending: true })
    .order('created_at', { ascending: false });

  // Calculate weekly earnings (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: weeklyTransactions } = await supabase
    .from('point_transactions')
    .select('amount')
    .eq('child_id', child.id)
    .eq('type', 'earn')
    .gte('created_at', weekAgo.toISOString());

  const weeklyEarnings = weeklyTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 350;

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
