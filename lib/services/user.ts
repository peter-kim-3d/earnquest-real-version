import { createClient } from '@/lib/supabase/server';
import type {
  UserProfile,
  CreateUserParams,
  UpdateUserParams,
  AuthUser,
} from '@/lib/types/user';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/lib/types/user';

// Re-export types for backward compatibility
export type { UserProfile, CreateUserParams, UpdateUserParams } from '@/lib/types/user';

/**
 * Creates a user profile in the users table
 */
export async function createUser(params: CreateUserParams) {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      id: params.id,
      family_id: params.familyId,
      email: params.email,
      full_name: params.fullName || null,
      avatar_url: params.avatarUrl || null,
      role: params.role || 'parent',
      notification_settings: DEFAULT_NOTIFICATION_SETTINGS,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating user:', error);
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return user;
}

/**
 * Gets a user by ID
 */
export async function getUser(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return user as UserProfile;
}

/**
 * Gets or creates a user profile for OAuth users
 */
export async function getOrCreateUserProfile(authUser: AuthUser): Promise<UserProfile | null> {
  // Check if user profile already exists
  const existingUser = await getUser(authUser.id);
  if (existingUser) {
    return existingUser;
  }

  // Create new family and user profile
  const { createFamily } = await import('./family');
  const family = await createFamily({
    name: 'My Family',
    language: 'en-US',
  });

  const user = await createUser({
    id: authUser.id,
    familyId: family.id,
    email: authUser.email!,
    fullName: authUser.user_metadata?.full_name || authUser.user_metadata?.name,
    avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
    role: 'parent',
  });

  return user;
}

/**
 * Updates user profile
 */
export async function updateUser(
  userId: string,
  updates: UpdateUserParams
) {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('users')
    .update({
      full_name: updates.fullName,
      avatar_url: updates.avatarUrl,
    })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating user:', error);
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return user;
}
