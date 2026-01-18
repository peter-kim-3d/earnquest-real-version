/**
 * Reward System - TypeScript Type Definitions
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Reward category types
 */
export type RewardCategory =
  | 'screen'
  | 'autonomy'
  | 'instant'
  | 'experience'
  | 'approval_required'
  | 'savings'
  | 'other';

/**
 * Reward purchase status
 */
export type RewardPurchaseStatus =
  | 'active'
  | 'requested'
  | 'approved'
  | 'fulfilled'
  | 'cancelled'
  | 'expired';

// ============================================================================
// Settings Interfaces
// ============================================================================

/**
 * Reward settings (JSONB in database)
 */
export interface RewardSettings {
  /** Custom color for reward card (hex or CSS color) */
  color?: string | null;

  /** Custom expiration rules */
  expiration?: {
    /** Days until ticket expires after purchase */
    daysToExpire?: number;
    /** Whether to auto-refund on expiration */
    autoRefund?: boolean;
  };

  /** Screen time specific settings */
  screenTime?: {
    /** Allowed apps/platforms */
    allowedApps?: string[];
    /** Blocked times of day */
    blockedTimes?: string[];
  };
}

// ============================================================================
// Main Interfaces
// ============================================================================

/**
 * Reward interface (matches database schema)
 */
export interface Reward {
  id: string;
  family_id: string;

  // Basic info
  name: string;
  description: string | null;
  category: RewardCategory;
  points_cost: number;

  // Screen time specific
  screen_minutes: number | null;

  // Limits
  weekly_limit: number | null;
  daily_limit: number | null;

  // Media
  icon: string | null;
  image_url: string | null;

  // Settings (JSONB)
  settings: RewardSettings | null;

  // Status
  is_active: boolean;
  sort_order: number;

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Reward purchase (ticket) interface
 */
export interface RewardPurchase {
  id: string;
  reward_id: string;
  child_id: string;
  family_id: string;

  // Cost at time of purchase
  points_spent: number;

  // Status
  status: RewardPurchaseStatus;

  // Request tracking
  requested_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  fulfilled_at: string | null;

  // Expiration
  expires_at: string | null;
  auto_refunded: boolean;

  // Screen time tracking
  screen_minutes_remaining: number | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Relations (when joined)
  rewards?: Reward;
  children?: any;
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Create reward request body
 */
export interface CreateRewardRequest {
  name: string;
  description?: string;
  category: RewardCategory;
  points_cost: number;
  screen_minutes?: number;
  weekly_limit?: number;
  daily_limit?: number;
  icon?: string;
  image_url?: string;
  settings?: RewardSettings;
  is_active?: boolean;
}

/**
 * Update reward request body
 */
export interface UpdateRewardRequest extends Partial<CreateRewardRequest> {
  rewardId: string;
}

/**
 * Purchase reward request body
 */
export interface PurchaseRewardRequest {
  rewardId: string;
  childId: string;
}

/**
 * Purchase reward response
 */
export interface PurchaseRewardResponse {
  success: boolean;
  message: string;
  newBalance: number;
  purchaseId: string;
}

// ============================================================================
// Category Info
// ============================================================================

/**
 * Category display information
 */
export const REWARD_CATEGORY_INFO: Record<
  RewardCategory,
  { label: string; labelKo: string; icon: string; description: string }
> = {
  screen: {
    label: 'Screen Time',
    labelKo: '스크린 타임',
    icon: '⏱️',
    description: 'TV, games, or device time',
  },
  autonomy: {
    label: 'Autonomy',
    labelKo: '자율성',
    icon: '⚡',
    description: 'Instant rewards like skip a chore',
  },
  instant: {
    label: 'Instant',
    labelKo: '즉시',
    icon: '⚡',
    description: 'Instant rewards redeemable immediately',
  },
  experience: {
    label: 'Experience',
    labelKo: '경험',
    icon: '🎁',
    description: 'Special activities or outings',
  },
  approval_required: {
    label: 'Approval Required',
    labelKo: '승인 필요',
    icon: '✅',
    description: 'Rewards that need parent approval',
  },
  savings: {
    label: 'Savings',
    labelKo: '저축',
    icon: '💰',
    description: 'Save points toward bigger goals',
  },
  other: {
    label: 'Other',
    labelKo: '기타',
    icon: '🎯',
    description: 'Custom rewards',
  },
};
