import { NextResponse } from 'next/server';

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
  handler: (request: Request, context?: any) => Promise<NextResponse<T>>
) {
  return async (request: Request, context?: any): Promise<NextResponse<T | ErrorResponse>> => {
    try {
      return await handler(request, context);
    } catch (err) {
      console.error('API Error:', err);
      const message = err instanceof Error ? err.message : 'Internal server error';
      return errors.internalError(message) as NextResponse<T | ErrorResponse>;
    }
  };
}
