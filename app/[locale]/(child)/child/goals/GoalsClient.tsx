'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Trophy, Sparkle } from '@phosphor-icons/react';
import { toast } from 'sonner';
import GoalCard from '@/components/goals/GoalCard';
import { Tier } from '@/lib/utils/tiers';

interface Goal {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  target_points: number;
  current_points: number;
  tier: Tier;
  is_completed: boolean;
  completed_at?: string;
  change_log?: Array<{
    action: string;
    reason: string;
    timestamp: string;
  }>;
  created_at: string;
}

interface GoalsClientProps {
  goals: Goal[];
  childId: string;
  childName: string;
  availableBalance: number;
  weeklyEarnings: number;
}

export default function GoalsClient({
  goals,
  childId,
  childName,
  availableBalance,
  weeklyEarnings,
}: GoalsClientProps) {
  const router = useRouter();
  const [balance, setBalance] = useState(availableBalance);

  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);

  const handleDeposit = async (goalId: string, amount: number) => {
    try {
      const response = await fetch('/api/goals/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          childId,
          amount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deposit');
      }

      const result = await response.json();

      // Update local balance
      setBalance(result.newBalance);

      if (result.isCompleted) {
        toast.success('Goal Achieved!', {
          description: 'Congratulations! You reached your goal!',
          icon: '🎉',
        });
      } else {
        toast.success('Points Deposited!', {
          description: `${amount} XP added to your goal.`,
        });
      }

      router.refresh();
    } catch (error: any) {
      console.error('Deposit failed:', error);
      toast.error('Deposit Failed', {
        description: error.message || 'Please try again.',
      });
      throw error;
    }
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Balance Card */}
      <div className="bg-gradient-to-br from-primary to-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">Available to Deposit</p>
            <p className="text-4xl font-black">{balance.toLocaleString()} XP</p>
          </div>
          <Sparkle size={48} weight="duotone" className="opacity-50" />
        </div>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Target size={24} className="text-primary" />
            <h2 className="text-xl font-bold text-text-main dark:text-white">
              Active Goals
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                childId={childId}
                availableBalance={balance}
                weeklyEarnings={weeklyEarnings}
                onDeposit={handleDeposit}
                onRefresh={handleRefresh}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={24} className="text-yellow-500" />
            <h2 className="text-xl font-bold text-text-main dark:text-white">
              Achieved Goals
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                childId={childId}
                availableBalance={balance}
                weeklyEarnings={weeklyEarnings}
                onDeposit={handleDeposit}
                onRefresh={handleRefresh}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <Target size={64} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">
            No Goals Yet
          </h3>
          <p className="text-text-muted dark:text-gray-400 mb-4">
            Ask your parents to create a savings goal for you!
          </p>
        </div>
      )}
    </div>
  );
}
