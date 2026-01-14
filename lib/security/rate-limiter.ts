/**
 * Rate Limiter Utility
 *
 * Simple in-memory rate limiter for MVP
 * Prevents brute force attacks on family code validation
 *
 * For production scale, consider using:
 * - Redis with Upstash for distributed rate limiting
 * - Edge functions with KV stores
 */

interface RateLimitRecord {
  attempts: number;
  resetAt: Date;
}

// In-memory store for rate limit records
const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Check if a request from a given IP should be rate limited
 *
 * @param ip - Client IP address
 * @param maxAttempts - Maximum allowed attempts within the window (default: 5)
 * @param windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns Rate limit status and metadata
 */
export function checkRateLimit(
  ip: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): {
  allowed: boolean;
  remainingAttempts: number;
  resetAt: Date;
  retryAfterSeconds?: number;
} {
  const now = new Date();
  const record = rateLimitStore.get(ip);

  // No record or window expired - create new record
  if (!record || now > record.resetAt) {
    const resetAt = new Date(now.getTime() + windowMs);
    rateLimitStore.set(ip, { attempts: 1, resetAt });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetAt,
    };
  }

  // Rate limit exceeded
  if (record.attempts >= maxAttempts) {
    const retryAfterSeconds = Math.ceil(
      (record.resetAt.getTime() - now.getTime()) / 1000
    );
    return {
      allowed: false,
      remainingAttempts: 0,
      resetAt: record.resetAt,
      retryAfterSeconds,
    };
  }

  // Increment attempts and allow
  record.attempts += 1;
  return {
    allowed: true,
    remainingAttempts: maxAttempts - record.attempts,
    resetAt: record.resetAt,
  };
}

/**
 * Reset rate limit for a specific IP
 * Useful for testing or manual overrides
 *
 * @param ip - Client IP address to reset
 */
export function resetRateLimit(ip: string): void {
  rateLimitStore.delete(ip);
}

/**
 * Get current rate limit status without incrementing
 *
 * @param ip - Client IP address
 * @returns Current rate limit status or null if no record exists
 */
export function getRateLimitStatus(ip: string): {
  attempts: number;
  resetAt: Date;
} | null {
  const record = rateLimitStore.get(ip);
  if (!record) {
    return null;
  }

  const now = new Date();
  if (now > record.resetAt) {
    rateLimitStore.delete(ip);
    return null;
  }

  return {
    attempts: record.attempts,
    resetAt: record.resetAt,
  };
}

/**
 * Cleanup expired rate limit records
 * Runs automatically every minute to prevent memory leaks
 */
function cleanupExpiredRecords(): void {
  const now = new Date();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(ip);
    }
  }
}

// Start cleanup interval (runs every minute)
if (typeof window === 'undefined') {
  // Only run in Node.js environment (server-side)
  setInterval(cleanupExpiredRecords, 60 * 1000);
}
