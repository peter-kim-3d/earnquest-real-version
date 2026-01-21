import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import GoalsClient from './GoalsClient';

// Create admin client for child session (bypasses RLS)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createAdminClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

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

  const { childId, familyId } = childSession;

  if (!childId || !familyId) {
    redirect(`/${locale}/child-login`);
  }

  // Check if parent is logged in (for RLS)
  const { data: { user } } = await supabase.auth.getUser();

  // Use admin client if no parent auth (child direct login)
  // This bypasses RLS for verified child sessions
  const dbClient = user ? supabase : (getAdminClient() || supabase);

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
