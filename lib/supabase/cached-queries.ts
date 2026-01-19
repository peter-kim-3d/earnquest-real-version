import { cache } from 'react';
import { createClient } from './server';

/**
 * Cached query functions using React.cache() for per-request deduplication.
 * These functions will only execute once per request, even if called multiple times
 * from different components in the same render tree.
 */

// Cache the authenticated user - prevents duplicate auth checks
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
});

// Cache the user profile with family_id - most commonly needed data
export const getUserProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, family_id, full_name, avatar_url, email')
    .eq('id', userId)
    .single();
  return { data, error };
});

// Cache children list for a family - used across many pages
export const getChildrenByFamily = cache(async (familyId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('children')
    .select('id, name, age_group, points_balance, avatar_url, pin_code, settings')
    .eq('family_id', familyId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  return { data, error };
});

// Cache a specific child by ID
export const getChildById = cache(async (childId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('children')
    .select('*')
    .eq('id', childId)
    .is('deleted_at', null)
    .single();
  return { data, error };
});

// Cache family settings
export const getFamilySettings = cache(async (familyId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('families')
    .select('id, name, join_code, settings')
    .eq('id', familyId)
    .single();
  return { data, error };
});

// Helper to get user with profile in one call (common pattern)
export const getAuthUserWithProfile = cache(async () => {
  const { user, error: authError } = await getAuthUser();
  if (authError || !user) {
    return { user: null, profile: null, error: authError };
  }

  const { data: profile, error: profileError } = await getUserProfile(user.id);
  return { user, profile, error: profileError };
});
