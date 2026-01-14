import { createClient } from '@/lib/supabase/server';

// v2 types
export type FamilyStyle = 'busy' | 'balanced' | 'academic' | 'screen';
export type AgeGroup = '5-7' | '8-11' | '12-14';

export interface ConditionalAnswers {
  hasPet?: boolean;
  hasInstrument?: boolean;
}

/**
 * Populates initial tasks and rewards based on family style and age group (v2)
 */
export async function populateTasksAndRewards(
  familyId: string,
  childId: string,
  style: FamilyStyle,
  ageGroup: AgeGroup,
  conditionalAnswers?: ConditionalAnswers
) {
  const supabase = await createClient();

  // v2: Define preset task keys mapping
  const PRESET_TASK_KEYS: Record<FamilyStyle, string[]> = {
    busy: ['homework', 'brush_teeth', 'backpack'],
    balanced: ['homework', 'reading', 'make_bed', 'clear_dishes', 'backpack', 'brush_teeth', 'exercise'],
    academic: ['homework', 'reading', 'practice_instrument', 'brush_teeth', 'exercise'],
    screen: ['homework', 'clear_dishes', 'brush_teeth', 'exercise'],
  };

  // Start with base task keys for the selected preset
  let taskKeys = [...PRESET_TASK_KEYS[style]];

  // v2: Add conditional tasks based on answers
  if (conditionalAnswers?.hasPet) {
    taskKeys.push('feed_pet');
  }

  if (conditionalAnswers?.hasInstrument && (style === 'academic' || style === 'balanced')) {
    // Only add practice_instrument if not already included
    if (!taskKeys.includes('practice_instrument')) {
      taskKeys.push('practice_instrument');
    }
  }

  // v2: Add age-specific tasks
  if (ageGroup === '5-7') {
    taskKeys.push('pick_up_toys', 'get_dressed');
  } else if (ageGroup === '8-11') {
    // Middle age group might get specific tasks
  } else if (ageGroup === '12-14') {
    taskKeys.push('laundry', 'study_session');
  }

  // Fetch task templates by template_key
  const { data: taskTemplates, error: taskError } = await supabase
    .from('task_templates')
    .select('*')
    .in('template_key', taskKeys);

  if (taskError) {
    console.error('Error fetching task templates:', taskError);
    throw new Error(`Failed to fetch task templates: ${taskError.message}`);
  }

  // v2: Define point overrides per preset
  const POINT_OVERRIDES: Record<FamilyStyle, Record<string, number>> = {
    busy: {},
    balanced: {},
    academic: {
      homework: 60,
      reading: 40,
      practice_instrument: 50,
    },
    screen: {
      homework: 70,
    },
  };

  // v2: Define timer overrides per preset
  const TIMER_OVERRIDES: Record<FamilyStyle, Record<string, number>> = {
    busy: {},
    balanced: {},
    academic: {
      reading: 30, // Longer reading time for academic families
    },
    screen: {},
  };

  // Fetch reward templates matching style and age group
  const { data: rewardTemplates, error: rewardError } = await supabase
    .from('reward_templates')
    .select('*')
    .or(`style.eq.${style},style.eq.all`)
    .or(`age_group.eq.${ageGroup},age_group.eq.all`);

  if (rewardError) {
    console.error('Error fetching reward templates:', rewardError);
    throw new Error(`Failed to fetch reward templates: ${rewardError.message}`);
  }

  // v2: Create tasks from templates with overrides
  const tasksToCreate = (taskTemplates || []).map((template) => {
    const templateKey = template.template_key;

    // Apply point override if exists
    const points = POINT_OVERRIDES[style]?.[templateKey] || template.points;

    // Apply timer override if exists
    const timerMinutes = TIMER_OVERRIDES[style]?.[templateKey] || template.timer_minutes;

    return {
      family_id: familyId,
      child_id: childId, // Always assign to the specific child during onboarding, unless we implement a specific 'shared' logic later
      name: template.name,
      description: template.description,
      category: template.category,
      points,
      icon: template.icon,
      frequency: template.frequency,
      approval_type: template.approval_type,

      // v2 fields
      timer_minutes: timerMinutes || null,
      checklist: template.checklist || null,
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
  const { data: children } = await supabase
    .from('children')
    .select('id')
    .eq('family_id', familyId);

  // Check if family has tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('family_id', familyId);

  // Check if family has rewards
  const { data: rewards } = await supabase
    .from('rewards')
    .select('id')
    .eq('family_id', familyId);

  return {
    hasChildren: (children?.length || 0) > 0,
    hasTasks: (tasks?.length || 0) > 0,
    hasRewards: (rewards?.length || 0) > 0,
    isComplete: (children?.length || 0) > 0 && (tasks?.length || 0) > 0 && (rewards?.length || 0) > 0,
  };
}
