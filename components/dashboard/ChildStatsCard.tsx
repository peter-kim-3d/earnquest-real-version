import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type ChildStats = {
  child_id: string;
  name: string;
  avatar_url: string | null;
  points_balance: number;
  points_lifetime_earned: number;
  trust_level: number;
  trust_streak_days: number;
  tasks_completed_today: number;
  tasks_pending_approval: number;
  points_earned_this_week: number;
  screen_minutes_this_week: number;
  kindness_cards_this_week: number;
};

export function ChildStatsCard({ child }: { child: ChildStats }) {
  const getTrustLevelLabel = (level: number) => {
    switch (level) {
      case 1:
        return 'Building';
      case 2:
        return 'Growing';
      case 3:
        return 'Master';
      default:
        return 'Building';
    }
  };

  const getTrustLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-blue-100 text-blue-700';
      case 2:
        return 'bg-green-100 text-green-700';
      case 3:
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl">{child.avatar_url || '👤'}</div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900">{child.name}</h3>
            <div className="flex items-center gap-2">
              <Badge className={getTrustLevelColor(child.trust_level)} variant="secondary">
                Trust: {getTrustLevelLabel(child.trust_level)}
              </Badge>
              {child.trust_streak_days > 0 && (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  🔥 {child.trust_streak_days}d
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Points Balance */}
        <div className="mb-4 p-3 bg-gradient-to-r from-star-gold/10 to-star-gold/5 rounded-lg border border-star-gold/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Points Balance</span>
            <span className="text-2xl font-bold text-star-gold">{child.points_balance}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">✅</span>
            <div>
              <p className="text-gray-600 text-xs">Today</p>
              <p className="font-semibold text-gray-900">{child.tasks_completed_today}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-lg">⏳</span>
            <div>
              <p className="text-gray-600 text-xs">Pending</p>
              <p className="font-semibold text-gray-900">{child.tasks_pending_approval}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <div>
              <p className="text-gray-600 text-xs">This Week</p>
              <p className="font-semibold text-gray-900">{child.points_earned_this_week}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-lg">📱</span>
            <div>
              <p className="text-gray-600 text-xs">Screen Time</p>
              <p className="font-semibold text-gray-900">{child.screen_minutes_this_week}m</p>
            </div>
          </div>
        </div>

        {/* Kindness Cards */}
        {child.kindness_cards_this_week > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm">
              <span>💝</span>
              <span className="text-gray-600">
                Received <strong>{child.kindness_cards_this_week}</strong> kindness card
                {child.kindness_cards_this_week !== 1 ? 's' : ''} this week
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
