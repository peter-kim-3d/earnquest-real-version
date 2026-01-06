'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

type RewardPurchase = {
  id: string;
  points_spent: number;
  purchased_at: string;
  status: string;
  fulfilled_at: string | null;
  child: {
    name: string;
    avatar_url: string | null;
  } | null;
  reward: {
    name: string;
    points_cost: number;
    category: string;
  } | null;
};

type Props = {
  purchases: RewardPurchase[];
};

const statusConfig: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  purchased: {
    label: 'Pending',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: '⏳',
  },
  fulfilled: {
    label: 'Fulfilled',
    color: 'bg-growth-green/20 text-growth-green border-growth-green/30',
    icon: '✅',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: '❌',
  },
};

const categoryIcons: Record<string, string> = {
  experience: '🎉',
  privilege: '👑',
  toy: '🎁',
  outing: '🚗',
  digital: '📱',
  food: '🍕',
};

export function MyPurchases({ purchases }: Props) {
  if (purchases.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <p className="text-lg text-gray-600 mb-2">No purchases yet!</p>
        <p className="text-sm text-gray-500">
          Browse rewards and buy something awesome with your points.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {purchases.map((purchase) => {
        const config = statusConfig[purchase.status] || statusConfig.purchased;
        const reward = purchase.reward;
        const child = purchase.child;

        return (
          <Card
            key={purchase.id}
            className={`p-4 border-2 ${config.color}`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Purchase Info */}
              <div className="flex items-start gap-3 flex-1">
                <span className="text-3xl">
                  {reward ? categoryIcons[reward.category] : '🎁'}
                </span>
                <div className="flex-1">
                  {/* Reward and Child Info */}
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">
                      {reward?.name || 'Unknown Reward'}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      ⭐ {purchase.points_spent} pts
                    </Badge>
                  </div>

                  {/* Child Info */}
                  {child && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-sm">{child.avatar_url || '👤'}</span>
                      <span className="text-sm text-gray-600">{child.name}</span>
                    </div>
                  )}

                  {/* Purchase Time */}
                  <p className="text-xs text-gray-600 mb-2">
                    Purchased {formatDistanceToNow(new Date(purchase.purchased_at), { addSuffix: true })}
                  </p>

                  {/* Status Message */}
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <p className="text-sm font-medium text-gray-700">
                      {purchase.status === 'purchased' && 'Waiting for parent to fulfill'}
                      {purchase.status === 'fulfilled' && 'Reward has been given!'}
                      {purchase.status === 'cancelled' && 'Purchase was cancelled'}
                    </p>
                  </div>

                  {/* Fulfilled Time */}
                  {purchase.fulfilled_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Fulfilled {formatDistanceToNow(new Date(purchase.fulfilled_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <Badge className={`${config.color} font-semibold whitespace-nowrap`}>
                {config.label}
              </Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
