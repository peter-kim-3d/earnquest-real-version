import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SendGratitudeForm } from '@/components/kindness/SendGratitudeForm';

export default async function SendGratitudePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
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

  if (!userProfile) {
    redirect(`/${locale}/login`);
  }

  // Get all children in the family
  const { data: children } = await supabase
    .from('children')
    .select('id, name, avatar_url')
    .eq('family_id', userProfile.family_id)
    .order('name', { ascending: true });

  if (!children || children.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-4">No children found</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Add children to your family to send gratitude cards.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Send Gratitude ❤️
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Celebrate kindness and make someone&apos;s day brighter
          </p>
        </div>

        {/* Form */}
        <SendGratitudeForm
          recipients={children}
          userId={user.id}
          familyId={userProfile.family_id}
        />
      </div>
    </div>
  );
}
