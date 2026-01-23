/**
 * Tests for lib/security/rate-limiter.ts
 *
 * Rate Limiter Utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkRateLimit,
  resetRateLimit,
  getRateLimitStatus,
} from '@/lib/security/rate-limiter';

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Reset rate limits between tests
    resetRateLimit('test-ip');
    resetRateLimit('test-ip-2');
    resetRateLimit('test-ip-3');
  });

  it('should allow first request and initialize record', () => {
    const result = checkRateLimit('test-ip');

    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(4); // default max is 5
    expect(result.resetAt).toBeInstanceOf(Date);
    expect(result.retryAfterSeconds).toBeUndefined();
  });

  it('should decrement remaining attempts with each request', () => {
    const result1 = checkRateLimit('test-ip');
    expect(result1.remainingAttempts).toBe(4);

    const result2 = checkRateLimit('test-ip');
    expect(result2.remainingAttempts).toBe(3);

    const result3 = checkRateLimit('test-ip');
    expect(result3.remainingAttempts).toBe(2);
  });

  it('should block requests after max attempts exceeded', () => {
    // Make 5 requests (default max)
    for (let i = 0; i < 5; i++) {
      checkRateLimit('test-ip');
    }

    // 6th request should be blocked
    const result = checkRateLimit('test-ip');
    expect(result.allowed).toBe(false);
    expect(result.remainingAttempts).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('should use custom max attempts', () => {
    const result1 = checkRateLimit('test-ip', 2);
    expect(result1.remainingAttempts).toBe(1);

    const result2 = checkRateLimit('test-ip', 2);
    expect(result2.remainingAttempts).toBe(0);

    const result3 = checkRateLimit('test-ip', 2);
    expect(result3.allowed).toBe(false);
  });

  it('should use custom window duration', () => {
    // Use a short window of 100ms
    const result1 = checkRateLimit('test-ip', 5, 100);
    const resetTime = result1.resetAt.getTime();

    // Reset time should be about 100ms in the future
    const now = Date.now();
    expect(resetTime - now).toBeGreaterThan(0);
    expect(resetTime - now).toBeLessThanOrEqual(200); // Allow some variance
  });

  it('should reset after window expires', async () => {
    // Use a very short window
    checkRateLimit('test-ip-3', 1, 50);

    // First additional request should be blocked
    const blockedResult = checkRateLimit('test-ip-3', 1, 50);
    expect(blockedResult.allowed).toBe(false);

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should be allowed again
    const result = checkRateLimit('test-ip-3', 1, 50);
    expect(result.allowed).toBe(true);
    expect(result.remainingAttempts).toBe(0); // 1 max - 1 attempt = 0 remaining
  });

  it('should track different IPs separately', () => {
    checkRateLimit('ip-a', 2);
    checkRateLimit('ip-a', 2);
    const blockedA = checkRateLimit('ip-a', 2);

    const allowedB = checkRateLimit('ip-b', 2);

    expect(blockedA.allowed).toBe(false);
    expect(allowedB.allowed).toBe(true);

    // Clean up
    resetRateLimit('ip-a');
    resetRateLimit('ip-b');
  });
});

describe('resetRateLimit', () => {
  it('should clear rate limit for IP', () => {
    // Make some requests
    checkRateLimit('test-ip');
    checkRateLimit('test-ip');
    checkRateLimit('test-ip');

    // Reset
    resetRateLimit('test-ip');

    // Should start fresh
    const result = checkRateLimit('test-ip');
    expect(result.remainingAttempts).toBe(4); // Full remaining
  });

  it('should not affect other IPs', () => {
    checkRateLimit('ip-a');
    checkRateLimit('ip-a');
    checkRateLimit('ip-b');

    resetRateLimit('ip-a');

    // IP A should be reset
    const resultA = checkRateLimit('ip-a');
    expect(resultA.remainingAttempts).toBe(4);

    // IP B should still have its state
    const resultB = checkRateLimit('ip-b');
    expect(resultB.remainingAttempts).toBe(3); // 5 - 2 attempts

    // Clean up
    resetRateLimit('ip-a');
    resetRateLimit('ip-b');
  });

  it('should handle resetting non-existent IP', () => {
    // Should not throw
    expect(() => resetRateLimit('non-existent-ip')).not.toThrow();
  });
});

describe('getRateLimitStatus', () => {
  beforeEach(() => {
    resetRateLimit('test-ip');
  });

  it('should return null for new IP', () => {
    const status = getRateLimitStatus('new-ip');
    expect(status).toBeNull();
  });

  it('should return status without incrementing attempts', () => {
    // Make initial request
    checkRateLimit('test-ip');

    // Get status
    const status1 = getRateLimitStatus('test-ip');
    expect(status1).not.toBeNull();
    expect(status1?.attempts).toBe(1);

    // Get status again - should not increment
    const status2 = getRateLimitStatus('test-ip');
    expect(status2?.attempts).toBe(1);

    // Make another request
    checkRateLimit('test-ip');

    // Status should now show 2 attempts
    const status3 = getRateLimitStatus('test-ip');
    expect(status3?.attempts).toBe(2);
  });

  it('should return reset time', () => {
    checkRateLimit('test-ip');

    const status = getRateLimitStatus('test-ip');
    expect(status?.resetAt).toBeInstanceOf(Date);
    expect(status?.resetAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('should return null after window expires', async () => {
    // Use short window
    checkRateLimit('test-ip-2', 5, 50);

    // Should have status immediately
    const status1 = getRateLimitStatus('test-ip-2');
    expect(status1).not.toBeNull();

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should return null now
    const status2 = getRateLimitStatus('test-ip-2');
    expect(status2).toBeNull();
  });
});

describe('Rate Limiter Integration', () => {
  beforeEach(() => {
    resetRateLimit('integration-test');
  });

  it('should handle typical rate limit flow', () => {
    const ip = 'integration-test';
    const maxAttempts = 3;

    // First attempt
    const r1 = checkRateLimit(ip, maxAttempts);
    expect(r1.allowed).toBe(true);
    expect(r1.remainingAttempts).toBe(2);

    // Check status
    const s1 = getRateLimitStatus(ip);
    expect(s1?.attempts).toBe(1);

    // Second attempt
    const r2 = checkRateLimit(ip, maxAttempts);
    expect(r2.allowed).toBe(true);
    expect(r2.remainingAttempts).toBe(1);

    // Third attempt
    const r3 = checkRateLimit(ip, maxAttempts);
    expect(r3.allowed).toBe(true);
    expect(r3.remainingAttempts).toBe(0);

    // Fourth attempt - should be blocked
    const r4 = checkRateLimit(ip, maxAttempts);
    expect(r4.allowed).toBe(false);
    expect(r4.retryAfterSeconds).toBeGreaterThan(0);

    // Reset and try again
    resetRateLimit(ip);
    const r5 = checkRateLimit(ip, maxAttempts);
    expect(r5.allowed).toBe(true);
    expect(r5.remainingAttempts).toBe(2);
  });
});
