import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getAdminClient } from '@/lib/supabase/admin-client';

/**
 * Child session data stored in the cookie
 */
export interface ChildSessionData {
  childId: string;
  familyId: string;
}

/**
 * Result of checking child session
 */
export interface ChildAuthResult {
  isChildSession: boolean;
  childSessionData: ChildSessionData | null;
  dbClient: SupabaseClient;
}

/**
 * Checks for child session cookie and returns session data if valid
 * Use this in API routes that can be accessed by both parents and children
 *
 * @param supabase - The regular Supabase client (for parent auth)
 * @param user - The authenticated user (null if not authenticated as parent)
 * @returns Child session data or null
 */
export async function getChildSession(): Promise<ChildSessionData | null> {
  const cookieStore = await cookies();
  const childSessionCookie = cookieStore.get('child_session');

  if (!childSessionCookie) {
    return null;
  }

  try {
    const data = JSON.parse(childSessionCookie.value) as ChildSessionData;
    if (data?.childId && data?.familyId) {
      return data;
    }
    return null;
  } catch {
    // Invalid cookie format
    return null;
  }
}

/**
 * Checks for parent or child authentication
 * Returns the appropriate database client (admin for child, regular for parent)
 *
 * @param supabase - The regular Supabase client
 * @returns Authentication result with db client
 */
export async function checkParentOrChildAuth(
  supabase: SupabaseClient
): Promise<{ success: true; result: ChildAuthResult } | { success: false; error: NextResponse }> {
  // Check for parent auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If parent is authenticated
  if (user) {
    return {
      success: true,
      result: {
        isChildSession: false,
        childSessionData: null,
        dbClient: supabase,
      },
    };
  }

  // Check for child session
  const childSessionData = await getChildSession();

  if (!childSessionData) {
    return {
      success: false,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  // Get admin client for child session (bypasses RLS)
  const adminClient = getAdminClient();
  if (!adminClient) {
    console.error('Admin client not available for child session');
    return {
      success: false,
      error: NextResponse.json({ error: 'Server configuration error' }, { status: 500 }),
    };
  }

  return {
    success: true,
    result: {
      isChildSession: true,
      childSessionData,
      dbClient: adminClient,
    },
  };
}

/**
 * Verifies that the requested childId matches the session childId
 * Use this after checkParentOrChildAuth for operations targeting a specific child
 */
export function verifyChildIdMatch(
  requestedChildId: string,
  sessionData: ChildSessionData | null,
  isChildSession: boolean
): NextResponse | null {
  if (isChildSession && sessionData && requestedChildId !== sessionData.childId) {
    return NextResponse.json(
      { error: 'Unauthorized: childId mismatch' },
      { status: 403 }
    );
  }
  return null;
}

/**
 * Gets the appropriate database client for server components.
 * Uses admin client for child sessions (bypasses RLS),
 * regular client for parent sessions.
 *
 * @param supabase - The regular Supabase client
 * @returns The appropriate database client
 */
export async function getDbClientForChildPage(
  supabase: SupabaseClient
): Promise<SupabaseClient> {
  const { data: { user } } = await supabase.auth.getUser();

  // If parent is authenticated, use regular client (RLS applies)
  if (user) {
    return supabase;
  }

  // For child sessions, use admin client (bypasses RLS)
  const adminClient = getAdminClient();
  return adminClient || supabase;
}
