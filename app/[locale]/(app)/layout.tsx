import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ParentNav from '@/components/parent/ParentNav';
import SkipToContent from '@/components/SkipToContent';
import Breadcrumbs from '@/components/ui/Breadcrumbs';

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Get user's profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single() as { data: { full_name: string | null; avatar_url: string | null } | null };

  return (
    <>
      <SkipToContent />
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <ParentNav
          parentName={userProfile?.full_name || 'Parent'}
          avatarUrl={userProfile?.avatar_url || null}
        />
        <main id="main-content" className="p-4 md:p-6 lg:p-8">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </>
  );
}
