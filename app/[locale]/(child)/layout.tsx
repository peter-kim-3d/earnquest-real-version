import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import ChildNav from '@/components/child/ChildNav';
import SkipToContent from '@/components/SkipToContent';

export default async function ChildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Check for child session cookie
  const cookieStore = await cookies();
  const childSessionCookie = cookieStore.get('child_session');

  if (!childSessionCookie) {
    redirect(`/${locale}/child-login`);
  }

  // Parse child session
  let childSession: { childId: string; familyId: string };
  try {
    childSession = JSON.parse(childSessionCookie.value);
  } catch (error) {
    // Invalid JSON in cookie, redirect to login
    redirect(`/${locale}/child-login`);
  }

  const { childId, familyId } = childSession;
  if (!childId || !familyId) {
    // Missing required fields, redirect to login
    redirect(`/${locale}/child-login`);
  }

  // Verify child exists and get data for navigation
  const supabase = await createClient();
  const { data: childData, error } = await supabase
    .from('children')
    .select('name, points_balance, avatar_url')
    .eq('id', childId)
    .eq('family_id', familyId)
    .single() as { data: { name: string; points_balance: number; avatar_url: string | null } | null; error: any };

  if (error || !childData) {
    // Child not found or deleted, redirect to login
    redirect(`/${locale}/child-login`);
  }

  // Check for parent view mode
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
