'use server';

import { createClient } from '@/lib/supabase/server';
import type { WizardData } from '@/components/onboarding/FamilyCreationWizard';

export async function createFamily(wizardData: WizardData) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'User not authenticated' };
    }

    // 1. Create family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({
        name: wizardData.family.name,
        settings: {
          timezone: wizardData.family.timezone,
          language: wizardData.family.language,
          weekStartsOn: 'sunday',
          autoApprovalHours: wizardData.family.autoApprovalHours,
          screenBudgetWeeklyMinutes: wizardData.family.screenBudgetWeeklyMinutes,
        },
        subscription_tier: 'free',
      })
      .select()
      .single();

    if (familyError || !family) {
      console.error('Family creation error:', familyError);
      return { success: false, error: 'Failed to create family' };
    }

    // 2. Create/update user record
    const { error: userRecordError } = await supabase.from('users').upsert({
      id: user.id,
      family_id: family.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Parent',
      role: 'parent',
      avatar_url: user.user_metadata?.avatar_url || null,
    });

    if (userRecordError) {
      console.error('User record error:', userRecordError);
      return { success: false, error: 'Failed to create user record' };
    }

    // 3. Create children
    const childrenToCreate = wizardData.children.map((child) => ({
      family_id: family.id,
      name: child.name,
      age_group: child.ageGroup,
      avatar_url: child.avatar,
      points_balance: child.pointsBalance,
      points_lifetime_earned: child.pointsBalance,
      trust_level: 1,
      trust_streak_days: 0,
      settings: {
        screenBudgetWeeklyMinutes: wizardData.family.screenBudgetWeeklyMinutes,
        allowSelfTaskCompletion: false,
      },
    }));

    const { data: children, error: childrenError } = await supabase
      .from('children')
      .insert(childrenToCreate)
      .select();

    if (childrenError || !children) {
      console.error('Children creation error:', childrenError);
      return { success: false, error: 'Failed to create children' };
    }

    // 4. Create tasks from selected templates
    if (wizardData.selectedTasks.length > 0) {
      const { data: taskTemplates } = await supabase
        .from('task_templates')
        .select('*')
        .in('id', wizardData.selectedTasks);

      if (taskTemplates) {
        const tasksToCreate = taskTemplates.map((template) => ({
          family_id: family.id,
          template_id: template.id,
          category: template.category,
          name: template.name_default,
          description: template.description_default,
          points: template.default_points,
          approval_type: template.default_approval_type,
          is_trust_task: false,
          recurrence: { type: 'daily' },
          is_active: true,
        }));

        const { error: tasksError } = await supabase.from('tasks').insert(tasksToCreate);

        if (tasksError) {
          console.error('Tasks creation error:', tasksError);
          // Don't fail - tasks can be added later
        }
      }
    }

    // 5. Create rewards from selected templates
    if (wizardData.selectedRewards.length > 0) {
      const { data: rewardTemplates } = await supabase
        .from('reward_templates')
        .select('*')
        .in('id', wizardData.selectedRewards);

      if (rewardTemplates) {
        const rewardsToCreate = rewardTemplates.map((template) => ({
          family_id: family.id,
          template_id: template.id,
          category: template.category,
          name: template.name_default,
          description: template.description_default,
          points: template.default_points,
          is_screen_reward: template.is_screen_reward,
          screen_minutes: template.screen_minutes,
          weekly_limit: null,
          is_active: true,
        }));

        const { error: rewardsError } = await supabase.from('rewards').insert(rewardsToCreate);

        if (rewardsError) {
          console.error('Rewards creation error:', rewardsError);
          // Don't fail - rewards can be added later
        }
      }
    }

    // 6. Create point transactions for starting balances
    const transactionsToCreate = children
      .filter((child, index) => wizardData.children[index].pointsBalance > 0)
      .map((child, index) => ({
        child_id: child.id,
        family_id: family.id,
        type: 'manual_adjustment',
        amount: wizardData.children[index].pointsBalance,
        balance_after: wizardData.children[index].pointsBalance,
        description: 'Starting balance',
      }));

    if (transactionsToCreate.length > 0) {
      const { error: transactionsError } = await supabase
        .from('point_transactions')
        .insert(transactionsToCreate);

      if (transactionsError) {
        console.error('Transactions creation error:', transactionsError);
        // Don't fail - just log
      }
    }

    return { success: true, familyId: family.id };
  } catch (error) {
    console.error('Unexpected error creating family:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
