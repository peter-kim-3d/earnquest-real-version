/**
 * Task System v2 - TypeScript Type Definitions
 *
 * These types match the database schema from migrations 020-022
 * and the specification in docs/earnquest_v2_specs/
 */

// ============================================================================
// Core Enums
// ============================================================================

/**
 * Task category (v2)
 * Changed from: hygiene, chores, learning, kindness, other
 * v2.1: household → life
 */
export type TaskCategory = 'learning' | 'life' | 'health';

/**
 * Time context for UI grouping (v2.1)
 * Used to group tasks by time of day in child dashboard
 */
export type TaskTimeContext = 'morning' | 'after_school' | 'evening' | 'anytime';

/**
 * Approval type (v2)
 * Changed from: manual, auto
 * New: timer, checklist
 */
export type ApprovalType = 'parent' | 'auto' | 'timer' | 'checklist';

/**
 * Task completion status
 */
export type TaskStatus = 'pending' | 'approved' | 'rejected' | 'auto_approved' | 'fix_requested';

/**
 * Task frequency
 */
export type TaskFrequency = 'daily' | 'weekly' | 'monthly' | 'one_time';

/**
 * Age group for templates
 */
export type AgeGroup = '5-7' | '8-11' | '12-14' | 'all';

/**
 * Monthly mode for recurring tasks
 */
export type MonthlyMode = 'any_day' | 'specific_day' | 'first_day' | 'last_day';

// ============================================================================
// Metadata Interfaces
// ============================================================================

/**
 * Task metadata (v2 - extensible JSONB)
 * Allows for future expansion without schema changes
 */
export interface TaskMetadata {
  /** Custom color for task card (hex or CSS color) */
  color?: string | null;

  /** Subcategory for more granular classification */
  subcategory?: string;

  /** Tags for filtering and search */
  tags?: string[];

  /** Source information for task creation */
  source?: {
    type: 'manual' | 'template' | 'ai_photo' | 'ai_text' | 'integration';
    /** Template key if created from template */
    templateKey?: string;
    /** Original image URL if from photo */
    originalImage?: string;
    /** Whether AI extracted this task */
    aiExtracted?: boolean;
    /** Integration app name (e.g., 'duolingo', 'artales') */
    integrationApp?: string;
  };

  /** Learning-specific metadata (Phase 3+) */
  learning?: {
    /** Subject area (math, reading, science, etc.) */
    subject?: string;
    /** Difficulty level 1-5 */
    difficulty?: number;
  };
}

/**
 * Fix request details
 */
export interface FixRequest {
  /** Fix items selected from templates or custom */
  items: string[];
  /** Optional custom message */
  message?: string;
  /** When the fix was requested */
  requestedAt: string;
  /** User ID who requested the fix */
  requestedBy: string;
}

// ============================================================================
// Task Interfaces
// ============================================================================

/**
 * Main Task interface (matches database schema)
 */
export interface Task {
  // Primary fields
  id: string;
  family_id: string;
  template_id?: string | null;
  child_id?: string | null; // null = all children

  // Basic info
  name: string;
  description?: string | null;
  category: TaskCategory;
  time_context?: TaskTimeContext | null; // v2.1: UI grouping
  icon?: string | null;
  points: number;
  frequency: TaskFrequency;

  // v2: Approval settings
  approval_type: ApprovalType;
  timer_minutes?: number | null;
  checklist?: string[] | null;
  photo_required: boolean;

  // v2: Metadata
  metadata: TaskMetadata;

  // Hybrid system fields
  auto_assign: boolean;
  archived_at?: string | null;

  // Weekly/Monthly scheduling
  days_of_week?: number[] | null; // [0-6] Sunday=0
  monthly_mode?: MonthlyMode | null;
  monthly_day?: number | null; // 1-31

  // Trust system (Phase 2)
  is_trust_task: boolean;
  min_trust_level: number;

  // Status
  is_active: boolean;
  sort_order: number;

  // Auto-approval (legacy, mostly unused in v2)
  auto_approve_hours?: number | null;
  requires_photo?: boolean;

  // Metadata
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Task completion record
 */
export interface TaskCompletion {
  // Primary fields
  id: string;
  task_id: string;
  child_id: string;
  family_id: string;

  // Status
  status: TaskStatus;

  // v2: Timer/Checklist evidence
  timer_completed: boolean;
  checklist_state?: boolean[] | null;

  // v2: Fix request
  fix_request?: FixRequest | null;
  fix_request_count?: number;

  // Proof
  proof_image_url?: string | null;
  note?: string | null;

  // Approval
  requested_at: string;
  approved_by?: string | null;
  approved_at?: string | null;
  auto_approve_at?: string | null;
  completed_at?: string | null;

  // Points
  points_awarded?: number | null;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Relations (when joined)
  tasks?: Task;
  children?: any;
}

/**
 * Task instance (for auto-assigned recurring tasks)
 */
export interface TaskInstance {
  id: string;
  task_id: string;
  child_id: string;
  family_id: string;
  scheduled_date: string; // DATE
  status: 'pending' | 'submitted' | 'completed' | 'skipped';
  completion_id?: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  tasks?: Task;
  task_completions?: TaskCompletion;
}

/**
 * Task template
 */
export interface TaskTemplate {
  id: string;
  template_key: string; // v2: unique key for preset mapping
  name: string;
  description?: string | null;
  category: TaskCategory;
  time_context?: TaskTimeContext | null; // v2.1: UI grouping
  points: number;
  icon?: string | null;
  frequency: TaskFrequency;
  approval_type: ApprovalType;

  // v2: New fields
  timer_minutes?: number | null;
  checklist?: string[] | null;
  metadata: TaskMetadata;

  // Template classification
  age_group: AgeGroup;
  style: string; // For filtering (all, busy, balanced, academic, screen)
  child_specific: boolean;

  // Settings
  settings?: any; // JSONB

  created_at: string;
  updated_at: string;
}

// ============================================================================
// Onboarding Types
// ============================================================================

/**
 * Onboarding preset keys (v2.1)
 * Changed from: busy, balanced, academic, screen
 */
export type PresetKey = 'starter' | 'balanced' | 'learning_focus';

/**
 * Module keys for add-on task groups (v2.1)
 */
export type ModuleKey = 'hygiene' | 'fitness' | 'hobby';

/**
 * Onboarding preset configuration
 */
export interface TaskPreset {
  key: PresetKey;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;

  /** Template keys to include */
  taskKeys: string[];

  /** Point overrides for specific tasks */
  pointOverrides?: Record<string, number>;

  /** Timer overrides for specific tasks */
  timerOverrides?: Record<string, number>;

  /** Expected daily points range */
  expectedDailyPoints: {
    min: number;
    max: number;
  };

  /** Weekly screen time budget in minutes */
  screenBudgetWeeklyMinutes: number;

  /** Is this preset recommended? */
  recommended: boolean;
}

/**
 * @deprecated Use enabledModules: ModuleKey[] instead
 * Conditional answers for onboarding (legacy v2)
 */
export interface ConditionalAnswers {
  hasPet?: boolean;
  hasInstrument?: boolean;
}

/**
 * Module configuration (v2.1)
 */
export interface TaskModule {
  key: ModuleKey;
  name: string;
  nameKo: string;
  icon: string;
  description: string;
  descriptionKo: string;
  defaultEnabled: boolean;
  taskKeys: string[];
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Create task request body
 */
export interface CreateTaskRequest {
  name: string;
  description?: string;
  category: TaskCategory;
  time_context?: TaskTimeContext; // v2.1: UI grouping
  points: number;
  frequency: TaskFrequency;
  approval_type: ApprovalType;

  // Conditional fields
  child_id?: string | null;
  timer_minutes?: number;
  checklist?: string[];
  photo_required?: boolean;
  metadata?: TaskMetadata;

  // Scheduling
  auto_assign?: boolean;
  days_of_week?: number[];
  monthly_mode?: MonthlyMode;
  monthly_day?: number;

  // Other
  icon?: string;
  is_active?: boolean;
}

/**
 * Update task request body
 */
export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  taskId: string;
}

/**
 * Complete task request body
 */
export interface CompleteTaskRequest {
  taskId: string;
  childId: string;
  instanceId?: string;
  evidence?: {
    photos?: string[];
    timerCompleted?: boolean;
    checklistState?: boolean[];
    note?: string;
  };
}

/**
 * Complete task response
 */
export interface CompleteTaskResponse {
  success: boolean;
  completion: TaskCompletion;
  autoApproved: boolean;
  instanceUpdated?: boolean;
}

/**
 * Fix request body
 */
export interface FixRequestRequest {
  completionId: string;
  items: string[];
  message?: string;
}

/**
 * Batch approve request body
 */
export interface BatchApproveRequest {
  completionIds: string[];
}

/**
 * Batch approve response
 */
export interface BatchApproveResponse {
  success: boolean;
  approvedCount: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Auto-approval whitelist
 * Only these template keys are allowed to use auto approval
 */
export const AUTO_APPROVAL_WHITELIST = ['get_dressed', 'set_alarm'] as const;

/**
 * Category display information
 * v2.1: household → life
 */
export const CATEGORY_INFO: Record<TaskCategory, { label: string; icon: string; color: string }> = {
  learning: {
    label: 'Learning',
    icon: 'school',
    color: '#6C5CE7',
  },
  life: {
    label: 'Life Skills',
    icon: 'home_work',
    color: '#00B894',
  },
  health: {
    label: 'Health',
    icon: 'fitness_center',
    color: '#FF7675',
  },
};

/**
 * Time context display information (v2.1)
 */
export const TIME_CONTEXT_INFO: Record<TaskTimeContext, { label: string; labelKo: string; icon: string }> = {
  morning: {
    label: 'Morning',
    labelKo: '아침에 해요',
    icon: '☀️',
  },
  after_school: {
    label: 'After School',
    labelKo: '집에 오면 해요',
    icon: '🏠',
  },
  evening: {
    label: 'Evening',
    labelKo: '저녁에 해요',
    icon: '🌙',
  },
  anytime: {
    label: 'Anytime',
    labelKo: '언제든 해요',
    icon: '📚',
  },
};

/**
 * Approval type display information
 */
export const APPROVAL_TYPE_INFO: Record<ApprovalType, { label: string; description: string }> = {
  parent: {
    label: 'Parent Check',
    description: 'Parent reviews and approves the task',
  },
  auto: {
    label: 'Auto Approve',
    description: 'Task is approved immediately when marked done',
  },
  timer: {
    label: 'Timer Based',
    description: 'Task is approved when timer completes',
  },
  checklist: {
    label: 'Checklist',
    description: 'Task is approved when all items are checked',
  },
};

/**
 * Fix request templates (from earnquest-tasks-en-US.json)
 */
export interface FixRequestTemplate {
  key: string;
  icon: string;
  text: string;
}

export const FIX_TEMPLATES: Record<string, FixRequestTemplate[]> = {
  clean_room: [
    { key: 'floor', icon: '👕', text: 'Please pick up clothes from the floor' },
    { key: 'desk', icon: '📚', text: 'Your desk needs a bit more organizing' },
    { key: 'bed', icon: '🛏️', text: "Don't forget to make your bed" },
    { key: 'trash', icon: '🗑️', text: 'Empty the trash can please' },
  ],
  homework: [
    { key: 'check', icon: '✅', text: 'Double-check your answers' },
    { key: 'handwriting', icon: '✍️', text: 'Try to write a bit neater' },
    { key: 'complete', icon: '📝', text: 'Looks like something is missing' },
    { key: 'show_work', icon: '🔢', text: 'Remember to show your work' },
  ],
  clear_dishes: [
    { key: 'rinse', icon: '💧', text: 'Please rinse the dishes before putting in sink' },
    { key: 'wipe', icon: '🧽', text: 'Wipe down the table too' },
    { key: 'all', icon: '🍽️', text: 'Did you get all the dishes?' },
  ],
  default: [
    { key: 'almost', icon: '💪', text: 'Almost there! Just a bit more' },
    { key: 'retry', icon: '🔄', text: 'Give it another try' },
    { key: 'help', icon: '🤝', text: 'Need help? Ask me!' },
  ],
};
