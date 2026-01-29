/**
 * Family System - TypeScript Type Definitions
 */

// ============================================================================
// Family Settings
// ============================================================================

/**
 * Family settings stored in JSONB column
 */
export interface FamilySettings {
  /** Whether children need PIN to log in */
  requireChildPin?: boolean;

  /** Family timezone (e.g., 'America/New_York') */
  timezone?: string;

  /** Preferred language (e.g., 'en-US', 'ko-KR') */
  language?: string;

  /** Week start day (0 = Sunday, 1 = Monday) */
  weekStartsOn?: 0 | 1;

  /** Hours before auto-approval kicks in */
  autoApprovalHours?: number;

  /** Weekly screen time budget in minutes */
  screenBudgetWeeklyMinutes?: number;
}

/**
 * Family record from database
 */
export interface Family {
  id: string;
  name: string;
  join_code: string;
  settings: FamilySettings;
  created_at: string;
  updated_at: string;
}

/**
 * Create family request parameters
 */
export interface CreateFamilyParams {
  name?: string;
  timezone?: string;
  language?: string;
}

/**
 * Family invitation record
 */
export interface FamilyInvitation {
  id: string;
  family_id: string;
  email: string;
  token: string;
  role: 'parent' | 'caregiver';
  expires_at: string;
  accepted_at?: string | null;
  created_at: string;
}
