import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/utils/error';

// Re-export getErrorMessage from shared utils for convenience
export { getErrorMessage };

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: string
) {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Handles database errors and returns appropriate response
 */
export function handleDatabaseError(
  error: unknown,
  defaultMessage: string,
  logContext?: string
) {
  const errorMessage = getErrorMessage(error);
  console.error(logContext || defaultMessage, error);
  return createErrorResponse(defaultMessage, 500, errorMessage);
}

/**
 * Handles validation errors
 */
export function handleValidationError(message: string, fields?: Record<string, string>) {
  return NextResponse.json(
    {
      error: 'Validation failed',
      message,
      ...(fields && { fields }),
    },
    { status: 400 }
  );
}

/**
 * Handles unauthorized errors
 */
export function handleUnauthorizedError(message: string = 'Unauthorized') {
  return createErrorResponse(message, 401);
}

/**
 * Handles not found errors
 */
export function handleNotFoundError(message: string = 'Resource not found') {
  return createErrorResponse(message, 404);
}

/**
 * Common API error response types
 */
export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: string;
  fields?: Record<string, string>;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data?: T;
  message?: string;
}
