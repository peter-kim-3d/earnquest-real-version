/**
 * Task System v2 - Zod Validation Schemas
 *
 * These schemas validate API requests and ensure data integrity
 * before database operations
 */

import { z } from 'zod';
import { AUTO_APPROVAL_WHITELIST } from '@/lib/types/task';

// ============================================================================
// Core Enum Schemas
// ============================================================================

/**
 * Task category schema (v2)
 */
export const TaskCategorySchema = z.enum(['learning', 'household', 'health'], {
  message: 'Category must be one of: learning, household, health',
});

/**
 * Approval type schema (v2)
 */
export const ApprovalTypeSchema = z.enum(['parent', 'auto', 'timer', 'checklist'], {
  message: 'Approval type must be one of: parent, auto, timer, checklist',
});

/**
 * Task frequency schema
 */
export const TaskFrequencySchema = z.enum(['daily', 'weekly', 'monthly', 'one_time'], {
  message: 'Frequency must be one of: daily, weekly, monthly, one_time',
});

/**
 * Monthly mode schema
 */
export const MonthlyModeSchema = z.enum(['any_day', 'specific_day', 'first_day', 'last_day']);

// ============================================================================
// Metadata Schemas
// ============================================================================

/**
 * Task metadata schema (v2)
 */
export const TaskMetadataSchema = z
  .object({
    subcategory: z.string().max(50).optional(),
    tags: z.array(z.string().max(30)).max(10).optional(),
    source: z
      .object({
        type: z.enum(['manual', 'template', 'ai_photo', 'ai_text', 'integration']),
        templateKey: z.string().max(50).optional(),
        originalImage: z.string().url().optional(),
        aiExtracted: z.boolean().optional(),
        integrationApp: z.string().max(50).optional(),
      })
      .optional(),
    learning: z
      .object({
        subject: z.string().max(50).optional(),
        difficulty: z.number().int().min(1).max(5).optional(),
      })
      .optional(),
  })
  .default({});

// ============================================================================
// Task CRUD Schemas
// ============================================================================

/**
 * Create task schema with comprehensive validation
 */
export const CreateTaskSchema = z
  .object({
    // Required fields
    name: z
      .string()
      .min(1, 'Task name is required')
      .max(200, 'Task name must be 200 characters or less')
      .trim(),

    category: TaskCategorySchema,

    points: z
      .number()
      .int('Points must be a whole number')
      .min(5, 'Points must be at least 5')
      .max(500, 'Points cannot exceed 500'),

    frequency: TaskFrequencySchema,

    approval_type: ApprovalTypeSchema,

    // Optional fields
    description: z.string().max(500, 'Description must be 500 characters or less').optional(),

    child_id: z.string().uuid('Invalid child ID').nullable().optional(),

    // Timer-specific
    timer_minutes: z
      .number()
      .int('Timer minutes must be a whole number')
      .min(1, 'Timer must be at least 1 minute')
      .max(180, 'Timer cannot exceed 180 minutes (3 hours)')
      .optional(),

    // Checklist-specific
    checklist: z
      .array(z.string().min(1).max(100))
      .max(10, 'Checklist cannot have more than 10 items')
      .optional(),

    photo_required: z.boolean().default(false),

    metadata: TaskMetadataSchema,

    // Scheduling fields
    auto_assign: z.boolean().default(false),

    days_of_week: z
      .array(z.number().int().min(0).max(6))
      .max(7, 'Cannot have more than 7 days')
      .optional(),

    monthly_mode: MonthlyModeSchema.optional(),

    monthly_day: z
      .number()
      .int()
      .min(1, 'Monthly day must be between 1 and 31')
      .max(31, 'Monthly day must be between 1 and 31')
      .optional(),

    // Other
    icon: z.string().max(50).optional(),
    image_url: z.string().url('Invalid image URL').nullable().optional(),
    is_active: z.boolean().default(true),

    // Child exclusions (for partial assignment)
    excluded_child_ids: z.array(z.string().uuid()).optional(),
  })
  .refine(
    (data) => {
      // If approval_type is 'timer', timer_minutes is required
      if (data.approval_type === 'timer' && !data.timer_minutes) {
        return false;
      }
      return true;
    },
    {
      message: 'Timer duration (timer_minutes) is required when approval type is "timer"',
      path: ['timer_minutes'],
    }
  )
  .refine(
    (data) => {
      // If approval_type is 'checklist', checklist is required
      if (data.approval_type === 'checklist' && (!data.checklist || data.checklist.length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Checklist items are required when approval type is "checklist"',
      path: ['checklist'],
    }
  )
  .refine(
    (data) => {
      // If frequency is 'weekly', days_of_week should be provided
      if (data.frequency === 'weekly' && (!data.days_of_week || data.days_of_week.length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'At least one day must be selected for weekly tasks',
      path: ['days_of_week'],
    }
  )
  .refine(
    (data) => {
      // If monthly_mode is 'specific_day', monthly_day is required
      if (data.frequency === 'monthly' && data.monthly_mode === 'specific_day' && !data.monthly_day) {
        return false;
      }
      return true;
    },
    {
      message: 'Monthly day is required when monthly mode is "specific_day"',
      path: ['monthly_day'],
    }
  )
  .refine(
    (data) => {
      // Auto-approval whitelist validation
      // Only allow auto for whitelisted template keys
      if (data.approval_type === 'auto' && data.metadata?.source?.templateKey) {
        const templateKey = data.metadata.source.templateKey;
        return AUTO_APPROVAL_WHITELIST.includes(templateKey as any);
      }
      // Allow auto for manual tasks (parent can override), but warn in UI
      return true;
    },
    {
      message: `Auto-approval is only recommended for whitelisted tasks: ${AUTO_APPROVAL_WHITELIST.join(', ')}`,
      path: ['approval_type'],
    }
  );

/**
 * Update task schema (all fields optional except taskId)
 * Note: Cannot use .partial() on schemas with refinements, so we recreate the base schema
 */
const UpdateTaskBaseSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),

  // All CreateTask fields as optional
  name: z
    .string()
    .min(1, 'Task name is required')
    .max(200, 'Task name must be 200 characters or less')
    .trim()
    .optional(),

  category: TaskCategorySchema.optional(),

  points: z
    .number()
    .int('Points must be a whole number')
    .min(5, 'Points must be at least 5')
    .max(500, 'Points cannot exceed 500')
    .optional(),

  frequency: TaskFrequencySchema.optional(),

  approval_type: ApprovalTypeSchema.optional(),

  description: z.string().max(500, 'Description must be 500 characters or less').optional(),

  child_id: z.string().uuid('Invalid child ID').nullable().optional(),

  timer_minutes: z
    .number()
    .int('Timer minutes must be a whole number')
    .min(1, 'Timer must be at least 1 minute')
    .max(180, 'Timer cannot exceed 180 minutes (3 hours)')
    .optional(),

  checklist: z
    .array(z.string().min(1).max(100))
    .max(10, 'Checklist cannot have more than 10 items')
    .optional(),

  photo_required: z.boolean().optional(),

  metadata: TaskMetadataSchema.optional(),

  auto_assign: z.boolean().optional(),

  days_of_week: z
    .array(z.number().int().min(0).max(6))
    .max(7, 'Cannot have more than 7 days')
    .optional(),

  monthly_mode: MonthlyModeSchema.optional(),

  monthly_day: z
    .number()
    .int()
    .min(1, 'Monthly day must be between 1 and 31')
    .max(31, 'Monthly day must be between 1 and 31')
    .optional(),

  icon: z.string().max(50).optional(),
  image_url: z.string().url('Invalid image URL').nullable().optional(),
  is_active: z.boolean().optional(),

  // Child exclusions (for partial assignment)
  excluded_child_ids: z.array(z.string().uuid()).optional(),
});

export const UpdateTaskSchema = UpdateTaskBaseSchema
  .refine(
    (data) => {
      // If approval_type is 'timer', timer_minutes must be provided
      if (data.approval_type === 'timer' && !data.timer_minutes) {
        return false;
      }
      return true;
    },
    {
      message: 'Timer duration is required when changing approval type to "timer"',
      path: ['timer_minutes'],
    }
  )
  .refine(
    (data) => {
      // If approval_type is 'checklist', checklist must be provided
      if (data.approval_type === 'checklist' && (!data.checklist || data.checklist.length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: 'Checklist items are required when changing approval type to "checklist"',
      path: ['checklist'],
    }
  );

// ============================================================================
// Task Completion Schemas
// ============================================================================

/**
 * Evidence schema for task completion
 */
export const EvidenceSchema = z.object({
  photos: z.array(z.string().url()).max(5, 'Cannot upload more than 5 photos').optional(),
  timerCompleted: z.boolean().optional(),
  checklistState: z.array(z.boolean()).max(10, 'Checklist cannot have more than 10 items').optional(),
  note: z.string().max(500, 'Note must be 500 characters or less').optional(),
});

/**
 * Complete task schema
 */
export const CompleteTaskSchema = z.object({
  taskId: z.string().uuid('Invalid task ID'),
  childId: z.string().uuid('Invalid child ID'),
  instanceId: z.string().uuid('Invalid instance ID').optional(),
  evidence: EvidenceSchema.optional(),
});

/**
 * Approve task schema
 */
export const ApproveTaskSchema = z.object({
  completionId: z.string().uuid('Invalid completion ID'),
});

/**
 * Reject task schema
 */
export const RejectTaskSchema = z.object({
  completionId: z.string().uuid('Invalid completion ID'),
  reason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
});

// ============================================================================
// Fix Request Schema
// ============================================================================

/**
 * Fix request schema
 */
export const FixRequestSchema = z.object({
  completionId: z.string().uuid('Invalid completion ID'),
  items: z
    .array(z.string().min(1, 'Fix item cannot be empty').max(200, 'Fix item too long'))
    .min(1, 'At least one fix item is required')
    .max(5, 'Cannot have more than 5 fix items'),
  message: z.string().max(200, 'Custom message must be 200 characters or less').optional(),
});

// ============================================================================
// Batch Operations Schemas
// ============================================================================

/**
 * Batch approve schema
 */
export const BatchApproveSchema = z.object({
  completionIds: z
    .array(z.string().uuid('Invalid completion ID'))
    .min(1, 'At least one completion ID is required')
    .max(20, 'Cannot approve more than 20 completions at once'),
});

/**
 * Batch reject schema
 */
export const BatchRejectSchema = z.object({
  completionIds: z
    .array(z.string().uuid('Invalid completion ID'))
    .min(1, 'At least one completion ID is required')
    .max(20, 'Cannot reject more than 20 completions at once'),
  reason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
});

// ============================================================================
// Onboarding Schemas
// ============================================================================

/**
 * Preset key schema
 */
export const PresetKeySchema = z.enum(['busy', 'balanced', 'academic', 'screen']);

/**
 * Conditional answers schema
 */
export const ConditionalAnswersSchema = z.object({
  hasPet: z.boolean().optional(),
  hasInstrument: z.boolean().optional(),
});

/**
 * Populate tasks and rewards schema (onboarding)
 */
export const PopulateTasksSchema = z.object({
  style: PresetKeySchema,
  childId: z.string().uuid('Invalid child ID'),
  ageGroup: z.enum(['5-7', '8-11', '12-14']),
  conditionalAnswers: ConditionalAnswersSchema.optional(),
});

// ============================================================================
// Query Parameter Schemas
// ============================================================================

/**
 * Get tasks query schema
 */
export const GetTasksQuerySchema = z.object({
  childId: z.string().uuid('Invalid child ID').optional(),
  category: TaskCategorySchema.optional(),
  isActive: z.boolean().optional(),
  frequency: TaskFrequencySchema.optional(),
});

/**
 * Get pending approvals query schema
 */
export const GetPendingApprovalsQuerySchema = z.object({
  childId: z.string().uuid('Invalid child ID').optional(),
  limit: z.number().int().min(1).max(100).default(50).optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Safe parse helper that returns typed result
 */
export function safeValidate<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Format Zod errors for API response
 */
export function formatZodError(error: z.ZodError): {
  message: string;
  fields: Record<string, string[]>;
} {
  const fieldErrors = error.flatten().fieldErrors;
  const formErrors = error.flatten().formErrors;

  return {
    message: formErrors.length > 0 ? formErrors[0] : 'Validation failed',
    fields: fieldErrors as Record<string, string[]>,
  };
}
