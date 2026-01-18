/**
 * API utilities for consistent route handling.
 *
 * @example
 * import { requireAuth, isAuthError, success, errors, parseBody } from '@/lib/api';
 *
 * export async function POST(request: Request) {
 *   const supabase = await createClient();
 *
 *   // Auth check with family ID
 *   const auth = await requireAuth(supabase);
 *   if (isAuthError(auth)) return auth.response;
 *   const { user, familyId } = auth;
 *
 *   // Parse and validate body
 *   const body = await parseBody(request, MySchema);
 *   if ('response' in body) return body.response;
 *   const { name, points } = body.data;
 *
 *   // Return success
 *   return success({ id: '123' }, 'Created successfully');
 * }
 */

export { requireAuth, isAuthError, verifyFamilyAccess } from './auth';
export type { AuthResult, AuthError } from './auth';

export { success, error, errors, withErrorHandler } from './responses';
export type { SuccessResponse, ErrorResponse } from './responses';

export {
  PIN_REGEX,
  UUID_REGEX,
  isValidPin,
  isValidUuid,
  parseBody,
  formatZodError,
  validateRequired,
  validateIdParam,
} from './validation';
