import { createClient } from '@/lib/supabase/server';

export interface CreateChildParams {
  familyId: string;
  name: string;
  ageGroup: '5-7' | '8-11' | '12-14';
  birthdate?: string;  // YYYY-MM-DD format
  birthYear?: number;  // Deprecated, use birthdate instead
  avatarUrl?: string;
  weeklyGoal?: number;
  pinCode?: string;    // 4-digit PIN for child login
}

/**
 * Creates a new child profile
 */
export async function createChild(params: CreateChildParams) {
  const supabase = await createClient();

  const { data: child, error } = await supabase
    .from('children')
    .insert({
      family_id: params.familyId,
      name: params.name,
      age_group: params.ageGroup,
      birthdate: params.birthdate || null,
      birth_year: params.birthYear || null,
      avatar_url: params.avatarUrl || null,
      pin_code: params.pinCode || null,
      points_balance: 0,
      trust_level: 1,
      settings: {
        weeklyGoal: params.weeklyGoal || 500,
        screenBudgetWeeklyMinutes: 300,
        notificationsEnabled: true,
      },
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating child:', error);
    throw new Error(`Failed to create child: ${error.message}`);
  }

  return child;
}

/**
 * Gets all children for a family
 */
export async function getChildren(familyId: string) {
  const supabase = await createClient();

  const { data: children, error } = await supabase
    .from('children')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching children:', error);
    throw new Error(`Failed to fetch children: ${error.message}`);
  }

  return children || [];
}

/**
 * Gets a child by ID
 */
export async function getChild(childId: string) {
  const supabase = await createClient();

  const { data: child, error } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .single();

  if (error) {
    console.error('Error fetching child:', error);
    return null;
  }

  return child;
}

/**
 * Updates child profile
 */
export async function updateChild(
  childId: string,
  updates: Partial<CreateChildParams>
) {
  const supabase = await createClient();

  const { data: child, error } = await supabase
    .from('children')
    .update({
      name: updates.name,
      age_group: updates.ageGroup,
      birthdate: updates.birthdate,
      birth_year: updates.birthYear,
      avatar_url: updates.avatarUrl,
    })
    .eq('id', childId)
    .select()
    .single();

  if (error) {
    console.error('Error updating child:', error);
    throw new Error(`Failed to update child: ${error.message}`);
  }

  return child;
}
