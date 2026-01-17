import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ChildrenList } from '@/components/settings/ChildrenList';

export default async function ChildrenSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('settings.children');
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Get user profile
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single() as { data: { family_id: string } | null };

  if (!userProfile?.family_id) {
    redirect(`/${locale}/login`);
  }

  // Get all children
  const { data: children } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', userProfile.family_id)
    .order('created_at', { ascending: true }) as { data: any[] | null };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('subtitle')}
        </p>
      </div>

      {/* Children List */}
      <ChildrenList
        childrenData={children || []}
        familyId={userProfile.family_id}
      />
    </div>
  );
}
