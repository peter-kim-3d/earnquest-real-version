/**
 * User System - TypeScript Type Definitions
 */

// ============================================================================
// Notification Settings
// ============================================================================

/**
 * User notification preferences stored in JSONB column
 */
export interface NotificationSettings {
  /** Whether to receive email notifications */
  email: boolean;
  /** Whether to receive push notifications */
  push: boolean;
  /** Notify when tasks are approved/rejected */
  taskApprovals: boolean;
  /** Notify when rewards are purchased */
  rewardPurchases: boolean;
  /** Receive weekly summary reports */
  weeklyReport: boolean;
}

/**
 * Default notification settings for new users
 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  email: true,
  push: false,
  taskApprovals: true,
  rewardPurchases: true,
  weeklyReport: true,
};

// ============================================================================
// Auth User
// ============================================================================

/**
 * Supabase Auth user object shape
 */
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
}

// ============================================================================
// User Profile
// ============================================================================

/**
 * User profile from database
 */
export interface UserProfile {
  id: string;
  family_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'parent' | 'child';
  notification_settings: NotificationSettings;
  passcode: string | null;
  passcode_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Parameters for creating a new user
 */
export interface CreateUserParams {
  /** Auth user ID from Supabase Auth */
  id: string;
  /** Family to join */
  familyId: string;
  /** User email */
  email: string;
  /** Display name */
  fullName?: string;
  /** Avatar image URL */
  avatarUrl?: string;
  /** User role in the family */
  role?: 'parent' | 'child';
}

/**
 * Parameters for updating a user
 */
export interface UpdateUserParams {
  fullName?: string;
  avatarUrl?: string;
}
