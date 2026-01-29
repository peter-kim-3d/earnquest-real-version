import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CreateFamilyParams, FamilySettings } from '@/lib/types/family';
import {
  JOIN_CODE_CHARS,
  JOIN_CODE_LENGTH,
  JOIN_CODE_MAX_ATTEMPTS,
  DEFAULT_AUTO_APPROVAL_HOURS,
  DEFAULT_SCREEN_BUDGET_WEEKLY_MINUTES,
} from '@/lib/constants';

// Re-export for backward compatibility
export type { CreateFamilyParams } from '@/lib/types/family';

/**
 * Generates a unique join code
 * Uses uppercase alphanumeric excluding confusing characters (I, O, L, 0, 1)
 */
async function generateUniqueJoinCode(supabase: SupabaseClient): Promise<string> {
  for (let attempts = 0; attempts < JOIN_CODE_MAX_ATTEMPTS; attempts++) {
    const code = Array.from({ length: JOIN_CODE_LENGTH }, () =>
      JOIN_CODE_CHARS[Math.floor(Math.random() * JOIN_CODE_CHARS.length)]
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

  const defaultSettings: FamilySettings = {
    timezone: params?.timezone || 'America/New_York',
    language: params?.language || 'en-US',
    autoApprovalHours: DEFAULT_AUTO_APPROVAL_HOURS,
    screenBudgetWeeklyMinutes: DEFAULT_SCREEN_BUDGET_WEEKLY_MINUTES,
    requireChildPin: false,
  };

  const { data: family, error } = await supabase
    .from('families')
    .insert({
      name: params?.name || 'My Family',
      join_code: joinCode,
      settings: defaultSettings,
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
  settings: FamilySettings
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
