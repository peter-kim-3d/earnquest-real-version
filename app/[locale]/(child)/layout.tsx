import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import ChildNav from '@/components/child/ChildNav';
import SkipToContent from '@/components/SkipToContent';
import type { PostgrestError } from '@supabase/supabase-js';
import { getChildSession } from '@/lib/api/child-auth';

export default async function ChildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Get child session from cookie
  const childSession = await getChildSession();

  if (!childSession) {
    redirect(`/${locale}/child-login`);
  }

  const { childId, familyId } = childSession;

  // Verify child exists and get data for navigation
  const supabase = await createClient();
  const { data: childData, error } = await supabase
    .from('children')
    .select('name, points_balance, avatar_url')
    .eq('id', childId)
    .eq('family_id', familyId)
    .single() as { data: { name: string; points_balance: number; avatar_url: string | null } | null; error: PostgrestError | null };

  if (error || !childData) {
    // Child not found or deleted, redirect to login
    redirect(`/${locale}/child-login`);
  }

  // Check for parent view mode
  const cookieStore = await cookies();
  const isParentView = cookieStore.get('parent_view')?.value === 'true';

  return (
    <>
      <SkipToContent />
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <ChildNav
          childName={childData.name}
          childId={childId}
          avatarUrl={childData.avatar_url || null}
          points={childData.points_balance}
          isParentView={isParentView}
        />
        <main id="main-content" className="container mx-auto px-4 py-6 max-w-7xl">
          {children}
        </main>
      </div>
    </>
  );
}
