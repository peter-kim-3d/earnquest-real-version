import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TicketsClientPage from '@/components/child/TicketsClientPage';
import { getChildSession, getDbClientForChildPage } from '@/lib/api/child-auth';

export default async function ChildTicketsPage({
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

  // Verify child belongs to family
  const { data: child } = await dbClient
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('family_id', familyId)
    .is('deleted_at', null)
    .single();

  if (!child) {
    redirect(`/${locale}/child-login`);
  }

  // Get tickets for this child
  const { data: tickets } = await dbClient
    .from('reward_purchases')
    .select(`
      *,
      reward:rewards (
        id, name, description, category, icon, image_url, screen_minutes
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
