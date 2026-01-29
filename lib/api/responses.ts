import { NextResponse } from 'next/server';
import { SupabaseClient, User } from '@supabase/supabase-js';

/**
 * Standardized API response helpers.
 * Ensures consistent response format across all API routes.
 */

export interface SuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  fields?: Record<string, string>;
}

/**
 * Create a success response with optional data and message.
 */
export function success<T>(data?: T, message?: string): NextResponse<SuccessResponse<T>> {
  return NextResponse.json({
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
  });
}

/**
 * Create an error response with consistent format.
 */
export function error(
  message: string,
  status: number = 400,
  fields?: Record<string, string>
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      error: message,
      ...(fields && { fields }),
    },
    { status }
  );
}

/**
 * Common error responses for reuse.
 */
export const errors = {
  unauthorized: () => error('Unauthorized', 401),
  forbidden: () => error('Forbidden', 403),
  notFound: (resource: string = 'Resource') => error(`${resource} not found`, 404),
  badRequest: (message: string = 'Bad request') => error(message, 400),
  validationFailed: (fields?: Record<string, string>) =>
    error('Validation failed', 400, fields),
  internalError: (message: string = 'Internal server error') => error(message, 500),
  missingFields: (fields: string[]) =>
    error(`Missing required fields: ${fields.join(', ')}`, 400),
};

/**
 * Wrap an async handler with standardized error handling.
 *
 * @example
 * export const POST = withErrorHandler(async (request) => {
 *   // Your route logic
 *   return success({ data: result });
 * });
 */
export function withErrorHandler<T>(
  handler: (request: Request, context?: unknown) => Promise<NextResponse<T>>
) {
  return async (request: Request, context?: unknown): Promise<NextResponse<T | ErrorResponse>> => {
    try {
      return await handler(request, context);
    } catch (err) {
      console.error('API Error:', err);
      const message = err instanceof Error ? err.message : 'Internal server error';
      return errors.internalError(message) as NextResponse<T | ErrorResponse>;
    }
  };
}

/**
 * Get user's family_id from the users table.
 * This is a common operation used in many API routes.
 *
 * @param supabase - Supabase client
 * @param userId - User ID to look up
 * @returns Object with familyId or error response
 */
export async function getUserFamilyId(
  supabase: SupabaseClient,
  userId: string
): Promise<{ familyId: string } | { error: NextResponse<ErrorResponse> }> {
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('family_id')
    .eq('id', userId)
    .single();

  if (profileError || !userProfile) {
    return { error: errors.notFound('User profile') };
  }

  if (!userProfile.family_id) {
    return { error: errors.badRequest('User is not associated with a family') };
  }

  return { familyId: userProfile.family_id };
}

/**
 * Authenticate user and get their family_id in one call.
 * Combines auth check and family_id lookup for common API route pattern.
 *
 * @param supabase - Supabase client
 * @returns Object with user and familyId, or error response
 */
export async function authenticateAndGetFamily(
  supabase: SupabaseClient
): Promise<{ user: User; familyId: string } | { error: NextResponse<ErrorResponse> }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: errors.unauthorized() };
  }

  const result = await getUserFamilyId(supabase, user.id);

  if ('error' in result) {
    return result;
  }

  return { user, familyId: result.familyId };
}
