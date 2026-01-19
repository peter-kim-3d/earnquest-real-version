import { redirect } from 'next/navigation';
import ParentNav from '@/components/parent/ParentNav';
import SkipToContent from '@/components/SkipToContent';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { getAuthUserWithProfile } from '@/lib/supabase/cached-queries';

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Use cached query - will be deduplicated with child pages
  const { user, profile: userProfile } = await getAuthUserWithProfile();

  if (!user) {
    redirect(`/${locale}/login`);
  }

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
