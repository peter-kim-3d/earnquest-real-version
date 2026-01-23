/**
 * Tests for lib/api/validation.ts
 *
 * Common validation patterns used across API routes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PIN_REGEX,
  UUID_REGEX,
  isValidPin,
  isValidUuid,
  formatZodError,
  validateRequired,
} from '@/lib/api/validation';
import { z, ZodError } from 'zod';

describe('PIN_REGEX', () => {
  it('should match valid 4-digit PINs', () => {
    expect(PIN_REGEX.test('1234')).toBe(true);
    expect(PIN_REGEX.test('0000')).toBe(true);
    expect(PIN_REGEX.test('9999')).toBe(true);
  });

  it('should not match invalid PINs', () => {
    expect(PIN_REGEX.test('123')).toBe(false);
    expect(PIN_REGEX.test('12345')).toBe(false);
    expect(PIN_REGEX.test('abcd')).toBe(false);
    expect(PIN_REGEX.test('12a4')).toBe(false);
    expect(PIN_REGEX.test('')).toBe(false);
    expect(PIN_REGEX.test('1234 ')).toBe(false);
  });
});

describe('UUID_REGEX', () => {
  it('should match valid UUIDs', () => {
    expect(UUID_REGEX.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(UUID_REGEX.test('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
    expect(UUID_REGEX.test('00000000-0000-0000-0000-000000000000')).toBe(true);
    expect(UUID_REGEX.test('ffffffff-ffff-ffff-ffff-ffffffffffff')).toBe(true);
  });

  it('should not match invalid UUIDs', () => {
    expect(UUID_REGEX.test('550e8400-e29b-41d4-a716-44665544000')).toBe(false); // too short
    expect(UUID_REGEX.test('550e8400-e29b-41d4-a716-4466554400000')).toBe(false); // too long
    expect(UUID_REGEX.test('550e8400e29b41d4a716446655440000')).toBe(false); // no dashes
    expect(UUID_REGEX.test('550e8400-e29b-41d4-a716-44665544000g')).toBe(false); // invalid char
    expect(UUID_REGEX.test('')).toBe(false);
    expect(UUID_REGEX.test('not-a-uuid')).toBe(false);
  });
});

describe('isValidPin', () => {
  it('should return true for valid 4-digit PIN', () => {
    expect(isValidPin('1234')).toBe(true);
    expect(isValidPin('0000')).toBe(true);
    expect(isValidPin('9876')).toBe(true);
  });

  it('should return true for null or undefined (PIN is optional)', () => {
    expect(isValidPin(null)).toBe(true);
    expect(isValidPin(undefined)).toBe(true);
  });

  it('should return false for invalid PINs', () => {
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin('12345')).toBe(false);
    expect(isValidPin('abcd')).toBe(false);
    expect(isValidPin('')).toBe(true); // Empty string is falsy, so returns true (optional)
  });
});

describe('isValidUuid', () => {
  it('should return true for valid UUIDs', () => {
    expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('should return false for null or undefined', () => {
    expect(isValidUuid(null)).toBe(false);
    expect(isValidUuid(undefined)).toBe(false);
  });

  it('should return false for invalid UUIDs', () => {
    expect(isValidUuid('')).toBe(false);
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('550e8400-e29b-41d4-a716')).toBe(false);
  });
});

describe('formatZodError', () => {
  it('should format simple field errors', () => {
    const schema = z.object({
      name: z.string().min(1, 'Name is required'),
      age: z.number().positive('Age must be positive'),
    });

    const result = schema.safeParse({ name: '', age: -1 });
    if (!result.success) {
      const formatted = formatZodError(result.error);

      expect(formatted.fields).toBeDefined();
      expect(formatted.fields['name']).toBe('Name is required');
      expect(formatted.fields['age']).toBe('Age must be positive');
      expect(formatted.message).toBeTruthy();
    }
  });

  it('should format nested field errors', () => {
    const schema = z.object({
      user: z.object({
        email: z.string().email('Invalid email'),
      }),
    });

    const result = schema.safeParse({ user: { email: 'invalid' } });
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted.fields['user.email']).toBe('Invalid email');
    }
  });

  it('should handle root level errors', () => {
    const schema = z.object({
      password: z.string(),
      confirmPassword: z.string(),
    }).refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
    });

    const result = schema.safeParse({
      password: 'abc',
      confirmPassword: 'xyz',
    });

    if (!result.success) {
      const formatted = formatZodError(result.error);
      // Root level errors should be captured
      expect(formatted.message).toBeTruthy();
    }
  });

  it('should join multiple errors in message', () => {
    const schema = z.object({
      a: z.string().min(1, 'A required'),
      b: z.string().min(1, 'B required'),
    });

    const result = schema.safeParse({ a: '', b: '' });
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted.message).toContain('A required');
      expect(formatted.message).toContain('B required');
    }
  });
});

describe('validateRequired', () => {
  it('should return empty array when all fields present', () => {
    const obj = { name: 'Test', age: 25, email: 'test@example.com' };
    const missing = validateRequired(obj, ['name', 'age', 'email']);
    expect(missing).toEqual([]);
  });

  it('should return missing fields for undefined values', () => {
    const obj = { name: 'Test', age: undefined };
    const missing = validateRequired(obj, ['name', 'age', 'email'] as (keyof typeof obj)[]);
    expect(missing).toContain('age');
    expect(missing).toContain('email');
  });

  it('should return missing fields for null values', () => {
    const obj = { name: 'Test', age: null };
    const missing = validateRequired(obj, ['name', 'age'] as (keyof typeof obj)[]);
    expect(missing).toContain('age');
    expect(missing).not.toContain('name');
  });

  it('should return missing fields for empty string values', () => {
    const obj = { name: '', email: 'test@example.com' };
    const missing = validateRequired(obj, ['name', 'email']);
    expect(missing).toContain('name');
    expect(missing).not.toContain('email');
  });

  it('should handle zero as valid value', () => {
    const obj = { count: 0, name: 'Test' };
    const missing = validateRequired(obj, ['count', 'name']);
    // Zero is falsy but not undefined/null/empty string
    expect(missing).not.toContain('count');
  });

  it('should handle false as valid value', () => {
    const obj = { active: false, name: 'Test' };
    const missing = validateRequired(obj, ['active', 'name']);
    // false is falsy but not undefined/null/empty string
    expect(missing).not.toContain('active');
  });
});
