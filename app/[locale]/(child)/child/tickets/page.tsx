import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import TicketsClientPage from '@/components/child/TicketsClientPage';

export default async function ChildTicketsPage() {
  const supabase = await createClient();

  // Get child session from cookie
  const cookieStore = await cookies();
  const childSessionCookie = cookieStore.get('child_session');

  if (!childSessionCookie) {
    redirect('/en-US/child-login');
  }

  let childSession;
  try {
    childSession = JSON.parse(childSessionCookie.value);
  } catch (error) {
    console.error('Invalid child session cookie:', error);
    redirect('/en-US/child-login');
  }

  const { childId } = childSession;

  if (!childId) {
    redirect('/en-US/child-login');
  }

  // Get tickets for this child
  const { data: tickets } = await supabase
    .from('reward_purchases')
    .select(`
      *,
      reward:rewards (
        id, name, description, category, icon, screen_minutes
      )
    `)
    .eq('child_id', childId)
    .in('status', ['active', 'use_requested', 'in_use', 'used'])
    .order('purchased_at', { ascending: false });

  // Group tickets by status
  const groupedTickets = {
    active: tickets?.filter(t => t.status === 'active') || [],
    use_requested: tickets?.filter(t => t.status === 'use_requested') || [],
    in_use: tickets?.filter(t => t.status === 'in_use') || [],
    used: tickets?.filter(t => t.status === 'used') || [],
  };

  return <TicketsClientPage childId={childId} initialTickets={groupedTickets} />;
}
