'use client';

import { Trophy, Medal, Crown, Star, Sparkle, Lock } from '@/components/ui/ClientIcons';
import { themes } from './ThemePicker';

interface Badge {
  id: string;
  badge_type: string;
  level: number;
  cards_required: number;
  earned_at: string;
}

interface Card {
  id: string;
  message: string;
  theme: string;
  created_at: string;
  from_user_id: string | null;
  from_child_id: string | null;
}

interface BadgeCollectionProps {
  badges: Badge[];
  totalCards: number;
  cardsToNextBadge: number;
  nextBadgeLevel: number;
  recentCards: Card[];
}

const badgeLevels = [
  {
    level: 1,
    name: 'Bronze Kindness',
    icon: '🥉',
    color: 'from-amber-600 to-orange-700',
    required: 5,
  },
  {
    level: 2,
    name: 'Silver Kindness',
    icon: '🥈',
    color: 'from-gray-400 to-gray-600',
    required: 10,
  },
  {
    level: 3,
    name: 'Gold Kindness',
    icon: '🥇',
    color: 'from-yellow-400 to-yellow-600',
    required: 20,
  },
];

export function BadgeCollection({
  badges,
  totalCards,
  cardsToNextBadge,
  nextBadgeLevel,
  recentCards,
}: BadgeCollectionProps) {
  const earnedBadgeLevels = badges.map((b) => b.level);

  return (
    <div className="space-y-8">
      {/* Progress Section */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <Sparkle className="path-primary-kindness w-8 h-8 text-primary-kindness" />
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Your Progress
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {totalCards} gratitude card{totalCards !== 1 ? 's' : ''} received
            </p>
          </div>
        </div>

        {cardsToNextBadge > 0 ? (
          <div className="bg-gradient-to-r from-primary-kindness/10 to-orange-600/10 rounded-2xl p-4 border border-primary-kindness/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Next badge: {badgeLevels[nextBadgeLevel - 1].name}
              </span>
              <span className="text-sm font-bold text-primary-kindness">
                {totalCards}/{badgeLevels[nextBadgeLevel - 1].required}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-kindness to-orange-600 rounded-full transition-all duration-500"
                style={{
                  width: `${(totalCards / badgeLevels[nextBadgeLevel - 1].required) *
                    100
                    }%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {cardsToNextBadge} more card{cardsToNextBadge !== 1 ? 's' : ''} to
              unlock!
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 rounded-2xl p-4 border border-yellow-500/30">
            <p className="text-center font-semibold text-gray-900 dark:text-white">
              🎉 Maximum level achieved! You&apos;re a kindness champion!
            </p>
          </div>
        )}
      </div>

      {/* Badges Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Badge Collection
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {badgeLevels.map((badgeLevel) => {
            const isEarned = earnedBadgeLevels.includes(badgeLevel.level);
            const earnedBadge = badges.find((b) => b.level === badgeLevel.level);

            return (
              <div
                key={badgeLevel.level}
                className={`
                  relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl
                  border-2 transition-all
                  ${isEarned
                    ? 'border-primary-kindness'
                    : 'border-gray-200 dark:border-gray-700 opacity-60'
                  }
                `}
              >
                {/* Lock overlay for unearned */}
                {!isEarned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm rounded-3xl">
                    <Lock className="w-12 h-12 text-white" />
                  </div>
                )}

                {/* Badge Content */}
                <div className="text-center">
                  <div
                    className={`
                      w-24 h-24 mx-auto mb-4 rounded-full
                      bg-gradient-to-br ${badgeLevel.color}
                      flex items-center justify-center text-5xl
                      ${isEarned ? 'shadow-2xl' : 'grayscale'}
                    `}
                  >
                    {badgeLevel.icon}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    {badgeLevel.name}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {badgeLevel.required} gratitude cards
                  </p>

                  {isEarned && earnedBadge && (
                    <div className="bg-primary-kindness/10 rounded-lg px-3 py-2 text-xs text-primary-kindness font-medium">
                      Earned{' '}
                      {new Date(earnedBadge.earned_at).toLocaleDateString()}
                    </div>
                  )}

                  {!isEarned && (
                    <div className="text-xs text-gray-500">
                      {totalCards}/{badgeLevel.required} cards
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Cards */}
      {recentCards.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Gratitude Cards
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentCards.slice(0, 6).map((card) => {
              const theme = themes.find((t) => t.id === card.theme) || themes[0];

              return (
                <div
                  key={card.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg"
                >
                  <div className={`${theme.gradient} p-4 h-24 flex items-center justify-center`}>
                    <span className="text-4xl">{theme.icon}</span>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic mb-2">
                      &quot;{card.message}&quot;
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(card.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentCards.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center shadow-xl">
          <div className="text-6xl mb-4">💌</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No gratitude cards yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You haven&apos;t earned any badges yet.
          </p>
        </div>
      )}
    </div>
  );
}
