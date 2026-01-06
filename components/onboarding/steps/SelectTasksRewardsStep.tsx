'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@/lib/supabase/client';
import { createFamily } from '@/lib/actions/family';
import { useRouter } from 'next/navigation';
import type { WizardData } from '../FamilyCreationWizard';

type Props = {
  selectedTasks: string[];
  selectedRewards: string[];
  onUpdate: (tasks: string[], rewards: string[]) => void;
  onBack: () => void;
  wizardData: WizardData;
};

type TaskTemplate = {
  id: string;
  category: string;
  name_default: string;
  default_points: number;
  default_approval_type: string;
  icon: string;
};

type RewardTemplate = {
  id: string;
  category: string;
  name_default: string;
  description_default: string;
  default_points: number;
  is_screen_reward: boolean;
  screen_minutes: number | null;
  icon: string;
};

export function SelectTasksRewardsStep({ selectedTasks, selectedRewards, onUpdate, onBack, wizardData }: Props) {
  const router = useRouter();
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [rewardTemplates, setRewardTemplates] = useState<RewardTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadTemplates = async () => {
    try {
      const supabase = createClient();

      // Load task templates
      const { data: tasks } = await supabase
        .from('task_templates')
        .select('*')
        .eq('age_group', '8-11')
        .eq('is_active', true)
        .order('sort_order');

      // Load reward templates
      const { data: rewards } = await supabase
        .from('reward_templates')
        .select('*')
        .eq('age_group', '8-11')
        .eq('is_active', true)
        .order('sort_order');

      if (tasks) setTaskTemplates(tasks);
      if (rewards) setRewardTemplates(rewards);

      // Pre-select some popular ones
      if (tasks && selectedTasks.length === 0) {
        const defaultTasks = tasks.slice(0, 5).map((t) => t.id);
        onUpdate(defaultTasks, selectedRewards);
      }
      if (rewards && selectedRewards.length === 0) {
        const defaultRewards = rewards.slice(0, 4).map((r) => r.id);
        onUpdate(selectedTasks, defaultRewards);
      }
    } catch (err) {
      console.error('Error loading templates:', err);
      setError('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (taskId: string) => {
    const newTasks = selectedTasks.includes(taskId)
      ? selectedTasks.filter((id) => id !== taskId)
      : [...selectedTasks, taskId];
    onUpdate(newTasks, selectedRewards);
  };

  const toggleReward = (rewardId: string) => {
    const newRewards = selectedRewards.includes(rewardId)
      ? selectedRewards.filter((id) => id !== rewardId)
      : [...selectedRewards, rewardId];
    onUpdate(selectedTasks, newRewards);
  };

  const handleComplete = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const result = await createFamily(wizardData);

      if (result.success) {
        router.push('/en-US/dashboard');
      } else {
        setError(result.error || 'Failed to create family');
      }
    } catch (err) {
      console.error('Error creating family:', err);
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryLabels: Record<string, string> = {
    learning: '📚 Learning',
    life: '🏠 Life Skills',
    health: '💪 Health',
    creativity: '🎨 Creativity',
    screen: '📱 Screen Time',
    experience: '🎉 Experiences',
    autonomy: '🌟 Autonomy',
    item: '🎁 Items',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-quest-purple"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Tasks & Rewards</h2>
        <p className="text-gray-600">Select the tasks and rewards you want to start with</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      <Tabs defaultValue="tasks" className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">
            Tasks ({selectedTasks.length}/{taskTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="rewards">
            Rewards ({selectedRewards.length}/{rewardTemplates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4 mt-4">
          <p className="text-sm text-gray-600 mb-4">
            Select tasks your children can complete to earn points
          </p>

          {Object.entries(
            taskTemplates.reduce((acc, task) => {
              if (!acc[task.category]) acc[task.category] = [];
              acc[task.category].push(task);
              return acc;
            }, {} as Record<string, TaskTemplate[]>)
          ).map(([category, tasks]) => (
            <div key={category}>
              <h3 className="font-semibold text-gray-900 mb-2">{categoryLabels[category] || category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {tasks.map((task) => (
                  <Card
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`p-3 cursor-pointer transition ${
                      selectedTasks.includes(task.id)
                        ? 'border-quest-purple bg-quest-purple/5 ring-2 ring-quest-purple/20'
                        : 'hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{task.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{task.name_default}</p>
                          <p className="text-xs text-gray-600">
                            {task.default_points} points • {task.default_approval_type}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedTasks.includes(task.id)
                            ? 'bg-quest-purple border-quest-purple'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedTasks.includes(task.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4 mt-4">
          <p className="text-sm text-gray-600 mb-4">
            Select rewards your children can redeem with their points
          </p>

          {Object.entries(
            rewardTemplates.reduce((acc, reward) => {
              if (!acc[reward.category]) acc[reward.category] = [];
              acc[reward.category].push(reward);
              return acc;
            }, {} as Record<string, RewardTemplate[]>)
          ).map(([category, rewards]) => (
            <div key={category}>
              <h3 className="font-semibold text-gray-900 mb-2">{categoryLabels[category] || category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {rewards.map((reward) => (
                  <Card
                    key={reward.id}
                    onClick={() => toggleReward(reward.id)}
                    className={`p-3 cursor-pointer transition ${
                      selectedRewards.includes(reward.id)
                        ? 'border-star-gold bg-star-gold/5 ring-2 ring-star-gold/20'
                        : 'hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{reward.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{reward.name_default}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-600">{reward.default_points} points</p>
                            {reward.is_screen_reward && (
                              <Badge variant="secondary" className="text-xs">
                                {reward.screen_minutes} min
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedRewards.includes(reward.id)
                            ? 'bg-star-gold border-star-gold'
                            : 'border-gray-300'
                        }`}
                      >
                        {selectedRewards.includes(reward.id) && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Start with a few tasks and rewards, add more later</li>
          <li>• You can customize points and details after setup</li>
          <li>• All tasks and rewards can be edited or removed anytime</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg" disabled={submitting}>
          Back
        </Button>
        <Button onClick={handleComplete} size="lg" className="min-w-[160px]" disabled={submitting}>
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Family...
            </>
          ) : (
            'Complete Setup'
          )}
        </Button>
      </div>
    </div>
  );
}
