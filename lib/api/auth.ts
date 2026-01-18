import { SupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export interface AuthResult {
  user: { id: string; email?: string };
  familyId: string;
}

export interface AuthError {
  response: NextResponse;
}

/**
 * Authenticates request and retrieves user's family ID.
 * Combines the common auth check + family lookup pattern used across 40+ API routes.
 *
 * @example
 * const auth = await requireAuth(supabase);
 * if ('response' in auth) return auth.response;
 * const { user, familyId } = auth;
 */
export async function requireAuth(
  supabase: SupabaseClient
): Promise<AuthResult | AuthError> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (profileError || !userProfile?.family_id) {
    return {
      response: NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      ),
    };
  }

  return {
    user: { id: user.id, email: user.email },
    familyId: userProfile.family_id,
  };
}

/**
 * Type guard to check if auth result is an error.
 */
export function isAuthError(result: AuthResult | AuthError): result is AuthError {
  return 'response' in result;
}

/**
 * Verifies a resource belongs to the user's family.
 *
 * @example
 * const access = await verifyFamilyAccess(supabase, 'tasks', taskId, familyId);
 * if (!access.authorized) return access.response;
 */
export async function verifyFamilyAccess(
  supabase: SupabaseClient,
  table: string,
  resourceId: string,
  familyId: string,
  idColumn: string = 'id'
): Promise<{ authorized: true; data: any } | { authorized: false; response: NextResponse }> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq(idColumn, resourceId)
    .eq('family_id', familyId)
    .single();

  if (error || !data) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: `${table.slice(0, -1)} not found or access denied` },
        { status: 404 }
      ),
    };
  }

  return { authorized: true, data };
}
