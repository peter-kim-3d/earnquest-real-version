/**
 * Family System - Zod Validation Schemas
 *
 * Schemas for family join codes and child device access
 */

import { z } from 'zod';

// ============================================================================
// Family Code Schemas
// ============================================================================

/**
 * Family code schema
 * - Must be exactly 6 characters
 * - Uppercase alphanumeric only
 * - Auto-transforms input to uppercase
 */
export const FamilyCodeSchema = z
  .string()
  .length(6, 'Family code must be 6 characters')
  .regex(/^[A-Z0-9]{6}$/, 'Code must be uppercase letters and numbers')
  .transform(s => s.toUpperCase());

/**
 * Validate family code request schema
 */
export const ValidateFamilyCodeSchema = z.object({
  code: FamilyCodeSchema,
});

/**
 * Get children by family code request schema
 */
export const ChildrenByFamilyCodeSchema = z.object({
  familyCode: FamilyCodeSchema,
});

// ============================================================================
// Type Exports
// ============================================================================

export type ValidateFamilyCodeInput = z.infer<typeof ValidateFamilyCodeSchema>;
export type ChildrenByFamilyCodeInput = z.infer<typeof ChildrenByFamilyCodeSchema>;
