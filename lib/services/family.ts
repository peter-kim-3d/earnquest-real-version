import { createClient } from '@/lib/supabase/server';

export interface CreateFamilyParams {
  name?: string;
  timezone?: string;
  language?: string;
}

/**
 * Generates a unique 6-character join code
 * Uses uppercase alphanumeric excluding confusing characters (I, O, L, 0, 1)
 */
async function generateUniqueJoinCode(supabase: any): Promise<string> {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const maxAttempts = 100;

  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    const code = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');

    // Check if code already exists
    const { data: existing } = await supabase
      .from('families')
      .select('id')
      .eq('join_code', code)
      .single();

    if (!existing) {
      return code;
    }
  }

  throw new Error('Failed to generate unique join code after max attempts');
}

/**
 * Creates a new family with default settings and auto-generated join code
 */
export async function createFamily(params?: CreateFamilyParams) {
  const supabase = await createClient();

  // Generate unique join code
  const joinCode = await generateUniqueJoinCode(supabase);

  const { data: family, error } = await supabase
    .from('families')
    .insert({
      name: params?.name || 'My Family',
      join_code: joinCode,
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
