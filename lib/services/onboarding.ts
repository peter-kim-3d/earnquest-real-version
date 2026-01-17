import { createClient } from '@/lib/supabase/server';
import { PresetKey, ModuleKey, AgeGroup } from '@/lib/types/task';
import { getTaskKeysForSelection } from '@/lib/utils/onboarding';

// Re-export types for backward compatibility
export type { PresetKey, ModuleKey, AgeGroup };

/**
 * @deprecated Use PresetKey instead
 */
export type FamilyStyle = 'busy' | 'balanced' | 'academic' | 'screen';

/**
 * @deprecated Use enabledModules: ModuleKey[] instead
 */
export interface ConditionalAnswers {
  hasPet?: boolean;
  hasInstrument?: boolean;
}

/**
 * Populates initial tasks and rewards based on preset and enabled modules (v2.1)
 *
 * @param familyId - The family to populate tasks/rewards for
 * @param childId - The initial child (currently unused, tasks are family-wide)
 * @param presetKey - The selected preset (starter, balanced, learning_focus)
 * @param ageGroup - The child's age group
 * @param enabledModules - Optional array of enabled add-on modules
 */
export async function populateTasksAndRewards(
  familyId: string,
  childId: string,
  presetKey: PresetKey,
  ageGroup: AgeGroup,
  enabledModules: ModuleKey[] = []
) {
  const supabase = await createClient();

  // v2.1: Get task keys from preset + modules (no duplicates)
  const taskKeys = getTaskKeysForSelection(presetKey, enabledModules);

  // Fetch task templates by template_key
  const { data: taskTemplates, error: taskError } = await supabase
    .from('task_templates')
    .select('*')
    .in('template_key', taskKeys);

  if (taskError) {
    console.error('Error fetching task templates:', taskError);
    throw new Error(`Failed to fetch task templates: ${taskError.message}`);
  }

  // Fetch reward templates (use 'all' style for now, as we removed style-specific logic)
  const { data: rewardTemplates, error: rewardError } = await supabase
    .from('reward_templates')
    .select('*')
    .or(`style.eq.all,age_group.eq.all,age_group.eq.${ageGroup}`);

  if (rewardError) {
    console.error('Error fetching reward templates:', rewardError);
    throw new Error(`Failed to fetch reward templates: ${rewardError.message}`);
  }

  // v2.1: Create tasks from templates
  const tasksToCreate = (taskTemplates || []).map((template) => {
    const templateKey = template.template_key;

    return {
      family_id: familyId,
      child_id: null, // Global task - available to all children in the family
      name: template.name,
      description: template.description,
      category: template.category,
      time_context: template.time_context || null, // v2.1: Copy time_context from template
      points: template.points,
      icon: template.icon,
      image_url: template.image_url || null,
      frequency: template.frequency,
      approval_type: template.approval_type,

      // v2 fields
      timer_minutes: template.timer_minutes || null,
      checklist: template.checklist || template.metadata?.checklist || null,
      photo_required: template.photo_required || false,
      metadata: {
        ...template.metadata,
        source: {
          type: 'template',
          templateKey: templateKey,
        },
      },

      // Scheduling
      auto_assign: true,
      days_of_week: template.settings?.days_of_week || null,
      monthly_mode: template.settings?.monthly_mode || null,
      monthly_day: template.settings?.monthly_day || null,

      // Legacy fields (deprecated in v2 but kept for compatibility)
      requires_photo: false,
      auto_approve_hours: 24,

      is_active: true,
    };
  });

  const { data: createdTasks, error: createTasksError } = await supabase
    .from('tasks')
    .insert(tasksToCreate)
    .select();

  if (createTasksError) {
    console.error('Error creating tasks:', createTasksError);
    throw new Error(`Failed to create tasks: ${createTasksError.message}`);
  }

  // Create rewards from templates
  const rewardsToCreate = (rewardTemplates || []).map((template) => ({
    family_id: familyId,
    child_id: null, // Rewards available to all children
    name: template.name,
    description: template.description,
    category: template.category,
    points_cost: template.points_cost,
    icon: template.icon,
    image_url: template.image_url || null,
    screen_minutes: template.screen_minutes || null,
    weekly_limit: template.weekly_limit || null,
    is_active: true,
  }));

  const { data: createdRewards, error: createRewardsError } = await supabase
    .from('rewards')
    .insert(rewardsToCreate)
    .select();

  if (createRewardsError) {
    console.error('Error creating rewards:', createRewardsError);
    throw new Error(`Failed to create rewards: ${createRewardsError.message}`);
  }

  return {
    tasks: createdTasks || [],
    rewards: createdRewards || [],
  };
}

/**
 * Saves family values (no-point zone behaviors)
 * Deletes existing values for the family first to allow updates
 */
export async function saveFamilyValues(
  familyId: string,
  values: Array<{ value_id: string; title: string; description?: string; icon?: string }>
) {
  const supabase = await createClient();

  // Delete existing values for this family (allows re-onboarding)
  const { error: deleteError } = await supabase
    .from('family_values')
    .delete()
    .eq('family_id', familyId);

  if (deleteError) {
    console.error('Error deleting existing family values:', deleteError);
    // Continue anyway - might be first time
  }

  // Insert new values
  const valuesToCreate = values.map((value) => ({
    family_id: familyId,
    value_id: value.value_id,
    title: value.title,
    description: value.description || null,
    icon: value.icon || null,
    is_active: true,
  }));

  const { data: createdValues, error } = await supabase
    .from('family_values')
    .insert(valuesToCreate)
    .select();

  if (error) {
    console.error('Error saving family values:', error);
    throw new Error(`Failed to save family values: ${error.message}`);
  }

  return createdValues || [];
}

/**
 * Gets onboarding status for a family
 */
export async function getOnboardingStatus(familyId: string) {
  const supabase = await createClient();

  // Check if family has children
  const { data: children } = await supabase.from('children').select('id').eq('family_id', familyId);

  // Check if family has tasks
  const { data: tasks } = await supabase.from('tasks').select('id').eq('family_id', familyId);

  // Check if family has rewards
  const { data: rewards } = await supabase.from('rewards').select('id').eq('family_id', familyId);

  return {
    hasChildren: (children?.length || 0) > 0,
    hasTasks: (tasks?.length || 0) > 0,
    hasRewards: (rewards?.length || 0) > 0,
    isComplete: (children?.length || 0) > 0 && (tasks?.length || 0) > 0 && (rewards?.length || 0) > 0,
  };
}
