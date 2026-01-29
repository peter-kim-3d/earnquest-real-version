import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BadgeCollection } from '@/components/kindness/BadgeCollection';
import { getChildSession, getDbClientForChildPage } from '@/lib/api/child-auth';

export default async function BadgesPage({
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
    .select('id, name')
    .eq('id', childId)
    .eq('family_id', familyId)
    .is('deleted_at', null)
    .single();

  if (!child) {
    redirect(`/${locale}/child-login`);
  }

  // Parallelize badge and card queries
  const [badgesResult, cardsResult] = await Promise.all([
    // Get child's badges
    dbClient
      .from('kindness_badges')
      .select('*')
      .eq('child_id', child.id)
      .order('earned_at', { ascending: false }),

    // Get total kindness cards received
    dbClient
      .from('kindness_cards')
      .select('id, message, theme, created_at, from_user_id, from_child_id')
      .eq('to_child_id', child.id)
      .order('created_at', { ascending: false }),
  ]);

  const badges = badgesResult.data;
  const cards = cardsResult.data;
  const totalCards = cards?.length || 0;

  // Calculate progress to next badge
  let cardsToNextBadge = 5;
  let nextBadgeLevel = 1;

  if (totalCards >= 20) {
    cardsToNextBadge = 0; // Max level reached
    nextBadgeLevel = 3;
  } else if (totalCards >= 10) {
    cardsToNextBadge = 20 - totalCards;
    nextBadgeLevel = 3;
  } else if (totalCards >= 5) {
    cardsToNextBadge = 10 - totalCards;
    nextBadgeLevel = 2;
  } else {
    cardsToNextBadge = 5 - totalCards;
    nextBadgeLevel = 1;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Kindness Badges
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Earn badges by receiving gratitude cards from your family
          </p>
        </div>

        {/* Badge Collection */}
        <BadgeCollection
          badges={badges || []}
          totalCards={totalCards}
          cardsToNextBadge={cardsToNextBadge}
          nextBadgeLevel={nextBadgeLevel}
          recentCards={cards || []}
        />
      </div>
    </div>
  );
}
