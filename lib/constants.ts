/**
 * Application-wide constants
 *
 * Centralizes magic numbers and hard-coded values to improve maintainability
 */

// ============================================================================
// Points & Rewards
// ============================================================================

/** Minimum points for a task */
export const MIN_TASK_POINTS = 5;

/** Maximum points for a task */
export const MAX_TASK_POINTS = 500;

/** Points step increment */
export const POINTS_STEP = 5;

/** Points earned per minute for timer tasks */
export const POINTS_PER_MINUTE = 1.5;

// ============================================================================
// Timer
// ============================================================================

/** Default timer duration in minutes */
export const DEFAULT_TIMER_MINUTES = 20;

/** Minimum timer duration in minutes */
export const MIN_TIMER_MINUTES = 1;

/** Maximum timer duration in minutes */
export const MAX_TIMER_MINUTES = 180;

/** Screen time session save interval in milliseconds */
export const SCREEN_TIME_SAVE_INTERVAL_MS = 10000;

// ============================================================================
// Invitations
// ============================================================================

/** Family invitation expiration in days */
export const INVITE_EXPIRATION_DAYS = 7;

// ============================================================================
// Batch Operations
// ============================================================================

/** Maximum number of completions that can be batch approved at once */
export const MAX_BATCH_APPROVE_COUNT = 20;

// ============================================================================
// Defaults
// ============================================================================

/** Default days of week (all days selected) */
export const DEFAULT_DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const;

/** Default monthly day */
export const DEFAULT_MONTHLY_DAY = 15;

// ============================================================================
// Family Settings Defaults
// ============================================================================

/** Default auto-approval hours */
export const DEFAULT_AUTO_APPROVAL_HOURS = 24;

/** Default weekly screen time budget in minutes */
export const DEFAULT_SCREEN_BUDGET_WEEKLY_MINUTES = 300;

// ============================================================================
// Join Code Generation
// ============================================================================

/** Characters used for join code generation (excluding confusing characters) */
export const JOIN_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Join code length */
export const JOIN_CODE_LENGTH = 6;

/** Maximum attempts to generate a unique join code */
export const JOIN_CODE_MAX_ATTEMPTS = 100;

// ============================================================================
// Checklist
// ============================================================================

/** Maximum number of checklist items */
export const MAX_CHECKLIST_ITEMS = 10;

/** Maximum length of a checklist item */
export const MAX_CHECKLIST_ITEM_LENGTH = 100;

// ============================================================================
// Task Name
// ============================================================================

/** Maximum length of a task name */
export const MAX_TASK_NAME_LENGTH = 100;

// ============================================================================
// Session & Cookie
// ============================================================================

/** Child session cookie max age in days */
export const SESSION_COOKIE_MAX_AGE_DAYS = 7;

/** Child session cookie max age in seconds */
export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * SESSION_COOKIE_MAX_AGE_DAYS;

/** Parent impersonation session duration in milliseconds (24 hours) */
export const IMPERSONATION_DURATION_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// Time Constants
// ============================================================================

/** Time constants in milliseconds */
export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

/** History lookback period in days (for filtering old completions) */
export const HISTORY_LOOKBACK_DAYS = 30;

// ============================================================================
// File Upload
// ============================================================================

/** Maximum file size for avatar uploads in bytes (5MB) */
export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024;

// ============================================================================
// Exchange Rates
// ============================================================================

/** Valid exchange rates for points conversion */
export const VALID_EXCHANGE_RATES = [10, 20, 50, 100, 200] as const;

// ============================================================================
// Timezone
// ============================================================================

/** Default timezone for families */
export const DEFAULT_TIMEZONE = 'America/New_York';
