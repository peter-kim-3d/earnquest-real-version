import { createClient as createAdminClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase admin client that bypasses RLS
 * Use this for operations that need elevated privileges (e.g., child session operations)
 *
 * @returns Supabase admin client or null if environment variables are missing
 */
export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing Supabase environment variables for admin client');
    return null;
  }

  return createAdminClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Gets admin client or throws an error if not available
 * Use when admin client is required (not optional)
 */
export function getRequiredAdminClient() {
  const client = getAdminClient();
  if (!client) {
    throw new Error('Admin client is not available - check environment variables');
  }
  return client;
}
