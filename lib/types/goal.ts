/**
 * Goal Types (v2 with Milestones)
 *
 * Defines types for the extended goals system with milestone bonuses
 * and real value tracking.
 */

import { Tier } from '@/lib/utils/tiers';

/**
 * Milestone bonus configuration
 * Keys are percentage thresholds (25, 50, 75)
 * Values are bonus point amounts
 */
export interface MilestoneBonuses {
  25?: number;
  50?: number;
  75?: number;
}

/**
 * Type of deposit/transaction for goals
 */
export type GoalDepositType = 'deposit' | 'milestone_bonus' | 'parent_match' | 'withdrawal';

/**
 * Individual goal deposit record
 */
export interface GoalDeposit {
  id: string;
  goal_id: string;
  child_id: string;
  family_id: string;
  amount: number;
  balance_after: number;
  type: GoalDepositType;
  created_at: string;
}

/**
 * Goal change log entry
 */
export interface GoalChangeLogEntry {
  action: 'target_change' | 'withdrawal' | 'adjustment';
  old_target?: number;
  new_target?: number;
  amount?: number;
  reason: string;
  timestamp: string;
}

/**
 * Goal model (v2 with milestones)
 */
export interface Goal {
  id: string;
  child_id: string;
  family_id: string;

  // Basic details
  name: string;
  description: string | null;
  icon: string;

  // Point tracking
  target_points: number;
  current_points: number;
  tier: Tier;

  // Status
  is_completed: boolean;
  completed_at: string | null;

  // v2: Real value tracking (parent-only)
  real_value_cents: number | null;
  parent_contribution_cents: number | null;

  // v2: Milestones
  milestone_bonuses: MilestoneBonuses | null;
  milestones_completed: number[] | null;

  // Change tracking
  original_target: number | null;
  change_log: GoalChangeLogEntry[] | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Goal with computed view fields
 */
export interface GoalWithProgress extends Goal {
  progress_percent: number;
  points_remaining: number;
  child_name: string;
  available_balance: number;
}

/**
 * Deposit API response
 */
export interface DepositResult {
  success: boolean;
  newBalance: number;
  goalProgress: number;
  goalTarget: number;
  isCompleted: boolean;
  milestoneReached?: number | null;
  milestoneBonus?: number;
}

/**
 * Create goal request body
 */
export interface CreateGoalRequest {
  childId: string;
  name: string;
  description?: string;
  targetPoints: number;
  icon?: string;
  realValueCents?: number;
  milestoneBonuses?: MilestoneBonuses;
}

/**
 * Update goal request body
 */
export interface UpdateGoalRequest {
  goalId: string;
  name?: string;
  description?: string;
  targetPoints?: number;
  reason?: string;
  realValueCents?: number;
  milestoneBonuses?: MilestoneBonuses;
}

/**
 * Milestone display info
 */
export interface MilestoneInfo {
  percentage: number;
  bonusPoints: number;
  isCompleted: boolean;
  pointsRequired: number;
}
