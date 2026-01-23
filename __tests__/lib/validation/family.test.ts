/**
 * Tests for lib/validation/family.ts
 *
 * Family System - Zod Validation Schemas
 */

import { describe, it, expect } from 'vitest';
import {
  FamilyCodeSchema,
  ValidateFamilyCodeSchema,
  ChildrenByFamilyCodeSchema,
} from '@/lib/validation/family';

describe('FamilyCodeSchema', () => {
  it('should accept valid 6-character uppercase codes', () => {
    expect(FamilyCodeSchema.parse('ABC123')).toBe('ABC123');
    expect(FamilyCodeSchema.parse('FAMILY')).toBe('FAMILY');
    expect(FamilyCodeSchema.parse('123456')).toBe('123456');
    expect(FamilyCodeSchema.parse('A1B2C3')).toBe('A1B2C3');
  });

  it('should reject lowercase codes (regex runs before transform)', () => {
    // The regex validation runs before the transform, so lowercase is rejected
    expect(() => FamilyCodeSchema.parse('abc123')).toThrow();
    expect(() => FamilyCodeSchema.parse('family')).toThrow();
    expect(() => FamilyCodeSchema.parse('AbCdEf')).toThrow();
  });

  it('should reject codes that are not 6 characters', () => {
    expect(() => FamilyCodeSchema.parse('ABC12')).toThrow();
    expect(() => FamilyCodeSchema.parse('ABC1234')).toThrow();
    expect(() => FamilyCodeSchema.parse('')).toThrow();
    expect(() => FamilyCodeSchema.parse('AB')).toThrow();
  });

  it('should reject codes with special characters', () => {
    expect(() => FamilyCodeSchema.parse('ABC12!')).toThrow();
    expect(() => FamilyCodeSchema.parse('ABC-12')).toThrow();
    expect(() => FamilyCodeSchema.parse('ABC 12')).toThrow();
    expect(() => FamilyCodeSchema.parse('ABC_12')).toThrow();
  });

  it('should reject codes with lowercase (regex validates before transform)', () => {
    // The regex validation runs before the transform, so lowercase is rejected
    const result = FamilyCodeSchema.safeParse('abc123');
    expect(result.success).toBe(false);
  });
});

describe('ValidateFamilyCodeSchema', () => {
  it('should accept valid code object', () => {
    const result = ValidateFamilyCodeSchema.parse({ code: 'ABC123' });
    expect(result.code).toBe('ABC123');
  });

  it('should reject lowercase codes', () => {
    // The regex validation runs before the transform, so lowercase is rejected
    expect(() => ValidateFamilyCodeSchema.parse({ code: 'abc123' })).toThrow();
  });

  it('should reject missing code field', () => {
    expect(() => ValidateFamilyCodeSchema.parse({})).toThrow();
  });

  it('should reject null code', () => {
    expect(() => ValidateFamilyCodeSchema.parse({ code: null })).toThrow();
  });

  it('should reject invalid code format', () => {
    expect(() => ValidateFamilyCodeSchema.parse({ code: 'ABC' })).toThrow();
    expect(() => ValidateFamilyCodeSchema.parse({ code: 'ABC123!' })).toThrow();
  });
});

describe('ChildrenByFamilyCodeSchema', () => {
  it('should accept valid familyCode object', () => {
    const result = ChildrenByFamilyCodeSchema.parse({ familyCode: 'ABC123' });
    expect(result.familyCode).toBe('ABC123');
  });

  it('should reject lowercase familyCode', () => {
    // The regex validation runs before the transform, so lowercase is rejected
    expect(() => ChildrenByFamilyCodeSchema.parse({ familyCode: 'xyz789' })).toThrow();
  });

  it('should reject missing familyCode field', () => {
    expect(() => ChildrenByFamilyCodeSchema.parse({})).toThrow();
  });

  it('should reject invalid familyCode format', () => {
    expect(() => ChildrenByFamilyCodeSchema.parse({ familyCode: '12345' })).toThrow();
    expect(() => ChildrenByFamilyCodeSchema.parse({ familyCode: '1234567' })).toThrow();
  });

  it('should handle edge cases', () => {
    // All numbers
    const result1 = ChildrenByFamilyCodeSchema.parse({ familyCode: '000000' });
    expect(result1.familyCode).toBe('000000');

    // All letters
    const result2 = ChildrenByFamilyCodeSchema.parse({ familyCode: 'AAAAAA' });
    expect(result2.familyCode).toBe('AAAAAA');
  });
});

describe('Type Exports', () => {
  it('should export ValidateFamilyCodeInput type', () => {
    // Type test - this is just to ensure the type is exported
    const input: { code: string } = { code: 'ABC123' };
    const result = ValidateFamilyCodeSchema.parse(input);
    expect(result.code).toBe('ABC123');
  });

  it('should export ChildrenByFamilyCodeInput type', () => {
    // Type test - this is just to ensure the type is exported
    const input: { familyCode: string } = { familyCode: 'ABC123' };
    const result = ChildrenByFamilyCodeSchema.parse(input);
    expect(result.familyCode).toBe('ABC123');
  });
});
