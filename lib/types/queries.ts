/**
 * Query result types for Supabase queries
 *
 * These types provide minimal type safety for common query patterns
 * while remaining compatible with component prop types.
 *
 * Note: These are intentionally loose to work with Supabase's dynamic
 * query return types. For strict typing, regenerate database types.
 */

// ============================================================================
// Child Types
// ============================================================================

/**
 * Child data from children table (flexible for different select queries)
 */
export interface ChildData {
  id: string;
  name: string;
  age_group?: string;
  points_balance?: number;
  avatar_url?: string | null;
  pin_code?: string | null;
  settings?: Record<string, unknown> | null;
  family_id?: string;
  created_at?: string;
}

/**
 * Basic child info for relations
 */
export interface ChildBasicInfo {
  id: string;
  name: string;
  avatar_url?: string | null;
  family_id?: string;
}

// ============================================================================
// Task Types
// ============================================================================

/**
 * Task override data
 */
export interface TaskOverride {
  task_id: string;
  child_id: string;
  is_enabled: boolean;
}

/**
 * Today's task view data
 */
export interface TodayTaskView {
  task_id: string;
  child_id: string;
  name: string;
  description?: string | null;
  category: string;
  time_context?: string | null;
  points: number;
  icon?: string | null;
  image_url?: string | null;
  frequency: string;
  approval_type: string;
  timer_minutes?: number | null;
  checklist?: string[] | null;
  photo_required?: boolean;
  is_enabled?: boolean;
  completion_status?: string | null;
  completion_id?: string | null;
}

// ============================================================================
// Goal Types
// ============================================================================

/**
 * Goal with optional child relation (matches database schema)
 */
export interface GoalData {
  id: string;
  child_id: string;
  family_id?: string;
  name: string;
  description?: string | null;
  target_points: number;
  current_points: number;
  tier?: string | null;
  icon?: string | null;
  status?: string;
  is_completed?: boolean;
  created_at?: string;
  completed_at?: string | null;
  deleted_at?: string | null;
  children?: ChildBasicInfo;
}
