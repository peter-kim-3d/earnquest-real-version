import { NextResponse } from 'next/server';
import { ZodError, ZodSchema } from 'zod';
import { errors } from './responses';

/**
 * Common validation patterns used across API routes.
 */

/** PIN code validation: exactly 4 digits */
export const PIN_REGEX = /^\d{4}$/;

/** UUID validation pattern */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate a PIN code.
 */
export function isValidPin(pin: string | undefined | null): boolean {
  if (!pin) return true; // PIN is optional
  return PIN_REGEX.test(pin);
}

/**
 * Validate a UUID.
 */
export function isValidUuid(id: string | undefined | null): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id);
}

/**
 * Parse and validate request body with a Zod schema.
 *
 * @example
 * const result = await parseBody(request, CreateTaskSchema);
 * if ('response' in result) return result.response;
 * const { name, points } = result.data;
 */
export async function parseBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { response: NextResponse }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const formatted = formatZodError(result.error);
      return {
        response: errors.validationFailed(formatted.fields),
      };
    }

    return { data: result.data };
  } catch {
    return {
      response: errors.badRequest('Invalid JSON body'),
    };
  }
}

/**
 * Format Zod errors into a user-friendly structure.
 */
export function formatZodError(error: ZodError): {
  message: string;
  fields: Record<string, string>;
} {
  const fields: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.');
    fields[path || 'root'] = issue.message;
  }

  return {
    message: Object.values(fields).join(', '),
    fields,
  };
}

/**
 * Validate that required fields exist in an object.
 *
 * @example
 * const missing = validateRequired(body, ['name', 'points', 'familyId']);
 * if (missing.length > 0) return errors.missingFields(missing);
 */
export function validateRequired<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): string[] {
  return fields.filter(
    (field) => obj[field] === undefined || obj[field] === null || obj[field] === ''
  ) as string[];
}

/**
 * Validate dynamic route parameter is a valid UUID.
 */
export function validateIdParam(
  id: string | undefined,
  resourceName: string = 'Resource'
): NextResponse | null {
  if (!id || !isValidUuid(id)) {
    return errors.badRequest(`Invalid ${resourceName} ID`);
  }
  return null;
}
