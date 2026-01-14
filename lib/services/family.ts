import { createClient } from '@/lib/supabase/server';

export interface CreateFamilyParams {
  name?: string;
  timezone?: string;
  language?: string;
}

/**
 * Creates a new family with default settings
 */
export async function createFamily(params?: CreateFamilyParams) {
  const supabase = await createClient();

  const { data: family, error } = await supabase
    .from('families')
    .insert({
      name: params?.name || 'My Family',
      settings: {
        timezone: params?.timezone || 'America/New_York',
        language: params?.language || 'en-US',
        autoApprovalHours: 24,
        screenBudgetWeeklyMinutes: 300,
      },
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating family:', error);
    throw new Error(`Failed to create family: ${error.message}`);
  }

  return family;
}

/**
 * Gets a family by ID
 */
export async function getFamily(familyId: string) {
  const supabase = await createClient();

  const { data: family, error } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyId)
    .single();

  if (error) {
    console.error('Error fetching family:', error);
    throw new Error(`Failed to fetch family: ${error.message}`);
  }

  return family;
}

/**
 * Updates family settings
 */
export async function updateFamilySettings(
  familyId: string,
  settings: Record<string, any>
) {
  const supabase = await createClient();

  const { data: family, error } = await supabase
    .from('families')
    .update({ settings })
    .eq('id', familyId)
    .select()
    .single();

  if (error) {
    console.error('Error updating family settings:', error);
    throw new Error(`Failed to update family settings: ${error.message}`);
  }

  return family;
}
