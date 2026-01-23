/**
 * Tests for lib/validation/task.ts
 *
 * Task System v2 - Zod Validation Schemas
 */

import { describe, it, expect } from 'vitest';
import {
  TaskCategorySchema,
  TaskTimeContextSchema,
  ApprovalTypeSchema,
  TaskFrequencySchema,
  MonthlyModeSchema,
  TaskMetadataSchema,
  CreateTaskSchema,
  UpdateTaskSchema,
  EvidenceSchema,
  CompleteTaskSchema,
  ApproveTaskSchema,
  RejectTaskSchema,
  FixRequestSchema,
  BatchApproveSchema,
  BatchRejectSchema,
  PresetKeySchema,
  ModuleKeySchema,
  AgeGroupSchema,
  PopulateTasksSchema,
  GetTasksQuerySchema,
  GetPendingApprovalsQuerySchema,
  safeValidate,
  formatZodError,
} from '@/lib/validation/task';
import { ZodError } from 'zod';

// ============================================================================
// Core Enum Schemas
// ============================================================================

describe('TaskCategorySchema', () => {
  it('should accept valid categories', () => {
    expect(TaskCategorySchema.parse('learning')).toBe('learning');
    expect(TaskCategorySchema.parse('life')).toBe('life');
    expect(TaskCategorySchema.parse('health')).toBe('health');
  });

  it('should reject invalid categories', () => {
    expect(() => TaskCategorySchema.parse('invalid')).toThrow();
    expect(() => TaskCategorySchema.parse('chores')).toThrow();
    expect(() => TaskCategorySchema.parse('')).toThrow();
  });
});

describe('TaskTimeContextSchema', () => {
  it('should accept valid time contexts', () => {
    expect(TaskTimeContextSchema.parse('morning')).toBe('morning');
    expect(TaskTimeContextSchema.parse('after_school')).toBe('after_school');
    expect(TaskTimeContextSchema.parse('evening')).toBe('evening');
    expect(TaskTimeContextSchema.parse('anytime')).toBe('anytime');
  });

  it('should reject invalid time contexts', () => {
    expect(() => TaskTimeContextSchema.parse('afternoon')).toThrow();
    expect(() => TaskTimeContextSchema.parse('night')).toThrow();
  });
});

describe('ApprovalTypeSchema', () => {
  it('should accept valid approval types', () => {
    expect(ApprovalTypeSchema.parse('parent')).toBe('parent');
    expect(ApprovalTypeSchema.parse('auto')).toBe('auto');
    expect(ApprovalTypeSchema.parse('timer')).toBe('timer');
    expect(ApprovalTypeSchema.parse('checklist')).toBe('checklist');
  });

  it('should reject invalid approval types', () => {
    expect(() => ApprovalTypeSchema.parse('manual')).toThrow();
    expect(() => ApprovalTypeSchema.parse('')).toThrow();
  });
});

describe('TaskFrequencySchema', () => {
  it('should accept valid frequencies', () => {
    expect(TaskFrequencySchema.parse('daily')).toBe('daily');
    expect(TaskFrequencySchema.parse('weekly')).toBe('weekly');
    expect(TaskFrequencySchema.parse('monthly')).toBe('monthly');
    expect(TaskFrequencySchema.parse('one_time')).toBe('one_time');
  });

  it('should reject invalid frequencies', () => {
    expect(() => TaskFrequencySchema.parse('yearly')).toThrow();
    expect(() => TaskFrequencySchema.parse('once')).toThrow();
  });
});

describe('MonthlyModeSchema', () => {
  it('should accept valid monthly modes', () => {
    expect(MonthlyModeSchema.parse('any_day')).toBe('any_day');
    expect(MonthlyModeSchema.parse('specific_day')).toBe('specific_day');
    expect(MonthlyModeSchema.parse('first_day')).toBe('first_day');
    expect(MonthlyModeSchema.parse('last_day')).toBe('last_day');
  });

  it('should reject invalid monthly modes', () => {
    expect(() => MonthlyModeSchema.parse('random')).toThrow();
  });
});

// ============================================================================
// Metadata Schemas
// ============================================================================

describe('TaskMetadataSchema', () => {
  it('should accept empty metadata', () => {
    const result = TaskMetadataSchema.parse({});
    expect(result).toEqual({});
  });

  it('should accept valid metadata', () => {
    const metadata = {
      subcategory: 'homework',
      tags: ['math', 'important'],
      source: {
        type: 'template' as const,
        templateKey: 'homework_complete',
      },
      learning: {
        subject: 'math',
        difficulty: 3,
      },
    };
    const result = TaskMetadataSchema.parse(metadata);
    expect(result.subcategory).toBe('homework');
    expect(result.tags).toEqual(['math', 'important']);
  });

  it('should use default empty object', () => {
    const result = TaskMetadataSchema.parse(undefined);
    expect(result).toEqual({});
  });

  it('should reject too long subcategory', () => {
    expect(() =>
      TaskMetadataSchema.parse({ subcategory: 'a'.repeat(51) })
    ).toThrow();
  });

  it('should reject too many tags', () => {
    const tags = Array.from({ length: 11 }, (_, i) => `tag${i}`);
    expect(() => TaskMetadataSchema.parse({ tags })).toThrow();
  });

  it('should reject invalid learning difficulty', () => {
    expect(() =>
      TaskMetadataSchema.parse({ learning: { difficulty: 0 } })
    ).toThrow();
    expect(() =>
      TaskMetadataSchema.parse({ learning: { difficulty: 6 } })
    ).toThrow();
  });
});

// ============================================================================
// Task CRUD Schemas
// ============================================================================

describe('CreateTaskSchema', () => {
  const validTask = {
    name: 'Complete homework',
    category: 'learning',
    points: 50,
    frequency: 'daily',
    approval_type: 'parent',
  };

  it('should accept valid task data', () => {
    const result = CreateTaskSchema.parse(validTask);
    expect(result.name).toBe('Complete homework');
    expect(result.category).toBe('learning');
    expect(result.points).toBe(50);
  });

  it('should reject missing required fields', () => {
    expect(() => CreateTaskSchema.parse({})).toThrow();
    expect(() => CreateTaskSchema.parse({ name: 'Test' })).toThrow();
  });

  it('should reject empty name', () => {
    expect(() =>
      CreateTaskSchema.parse({ ...validTask, name: '' })
    ).toThrow();
  });

  it('should reject name over 200 characters', () => {
    expect(() =>
      CreateTaskSchema.parse({ ...validTask, name: 'a'.repeat(201) })
    ).toThrow();
  });

  it('should trim whitespace from name', () => {
    const result = CreateTaskSchema.parse({ ...validTask, name: '  Test Task  ' });
    expect(result.name).toBe('Test Task');
  });

  it('should reject points below 5', () => {
    expect(() =>
      CreateTaskSchema.parse({ ...validTask, points: 4 })
    ).toThrow();
  });

  it('should reject points above 500', () => {
    expect(() =>
      CreateTaskSchema.parse({ ...validTask, points: 501 })
    ).toThrow();
  });

  it('should reject non-integer points', () => {
    expect(() =>
      CreateTaskSchema.parse({ ...validTask, points: 50.5 })
    ).toThrow();
  });

  it('should require timer_minutes when approval_type is timer', () => {
    expect(() =>
      CreateTaskSchema.parse({ ...validTask, approval_type: 'timer' })
    ).toThrow();

    const result = CreateTaskSchema.parse({
      ...validTask,
      approval_type: 'timer',
      timer_minutes: 30,
    });
    expect(result.timer_minutes).toBe(30);
  });

  it('should reject timer_minutes outside range', () => {
    expect(() =>
      CreateTaskSchema.parse({
        ...validTask,
        approval_type: 'timer',
        timer_minutes: 0,
      })
    ).toThrow();

    expect(() =>
      CreateTaskSchema.parse({
        ...validTask,
        approval_type: 'timer',
        timer_minutes: 181,
      })
    ).toThrow();
  });

  it('should require checklist when approval_type is checklist', () => {
    expect(() =>
      CreateTaskSchema.parse({ ...validTask, approval_type: 'checklist' })
    ).toThrow();

    const result = CreateTaskSchema.parse({
      ...validTask,
      approval_type: 'checklist',
      checklist: ['Step 1', 'Step 2'],
    });
    expect(result.checklist).toEqual(['Step 1', 'Step 2']);
  });

  it('should reject empty checklist', () => {
    expect(() =>
      CreateTaskSchema.parse({
        ...validTask,
        approval_type: 'checklist',
        checklist: [],
      })
    ).toThrow();
  });

  it('should reject checklist with more than 10 items', () => {
    const checklist = Array.from({ length: 11 }, (_, i) => `Step ${i}`);
    expect(() =>
      CreateTaskSchema.parse({
        ...validTask,
        approval_type: 'checklist',
        checklist,
      })
    ).toThrow();
  });

  it('should require days_of_week for weekly tasks', () => {
    expect(() =>
      CreateTaskSchema.parse({ ...validTask, frequency: 'weekly' })
    ).toThrow();

    const result = CreateTaskSchema.parse({
      ...validTask,
      frequency: 'weekly',
      days_of_week: [1, 3, 5],
    });
    expect(result.days_of_week).toEqual([1, 3, 5]);
  });

  it('should reject days_of_week outside 0-6 range', () => {
    expect(() =>
      CreateTaskSchema.parse({
        ...validTask,
        frequency: 'weekly',
        days_of_week: [7],
      })
    ).toThrow();

    expect(() =>
      CreateTaskSchema.parse({
        ...validTask,
        frequency: 'weekly',
        days_of_week: [-1],
      })
    ).toThrow();
  });

  it('should require monthly_day when monthly_mode is specific_day', () => {
    expect(() =>
      CreateTaskSchema.parse({
        ...validTask,
        frequency: 'monthly',
        monthly_mode: 'specific_day',
      })
    ).toThrow();

    const result = CreateTaskSchema.parse({
      ...validTask,
      frequency: 'monthly',
      monthly_mode: 'specific_day',
      monthly_day: 15,
    });
    expect(result.monthly_day).toBe(15);
  });

  it('should reject monthly_day outside 1-31 range', () => {
    expect(() =>
      CreateTaskSchema.parse({
        ...validTask,
        frequency: 'monthly',
        monthly_mode: 'specific_day',
        monthly_day: 0,
      })
    ).toThrow();

    expect(() =>
      CreateTaskSchema.parse({
        ...validTask,
        frequency: 'monthly',
        monthly_mode: 'specific_day',
        monthly_day: 32,
      })
    ).toThrow();
  });

  it('should validate UUID for child_id', () => {
    expect(() =>
      CreateTaskSchema.parse({ ...validTask, child_id: 'invalid' })
    ).toThrow();

    const result = CreateTaskSchema.parse({
      ...validTask,
      child_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.child_id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should allow null child_id', () => {
    const result = CreateTaskSchema.parse({ ...validTask, child_id: null });
    expect(result.child_id).toBeNull();
  });
});

describe('UpdateTaskSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('should accept valid update with taskId', () => {
    const result = UpdateTaskSchema.parse({
      taskId: validUuid,
      name: 'Updated name',
    });
    expect(result.taskId).toBe(validUuid);
    expect(result.name).toBe('Updated name');
  });

  it('should require valid taskId', () => {
    expect(() =>
      UpdateTaskSchema.parse({ taskId: 'invalid', name: 'Test' })
    ).toThrow();
  });

  it('should allow partial updates', () => {
    const result = UpdateTaskSchema.parse({
      taskId: validUuid,
      points: 75,
    });
    expect(result.points).toBe(75);
    expect(result.name).toBeUndefined();
  });

  it('should require timer_minutes when changing to timer approval', () => {
    expect(() =>
      UpdateTaskSchema.parse({
        taskId: validUuid,
        approval_type: 'timer',
      })
    ).toThrow();
  });

  it('should require checklist when changing to checklist approval', () => {
    expect(() =>
      UpdateTaskSchema.parse({
        taskId: validUuid,
        approval_type: 'checklist',
      })
    ).toThrow();
  });
});

// ============================================================================
// Task Completion Schemas
// ============================================================================

describe('EvidenceSchema', () => {
  it('should accept valid evidence', () => {
    const result = EvidenceSchema.parse({
      photos: ['https://example.com/photo.jpg'],
      timerCompleted: true,
      checklistState: [true, false, true],
      note: 'Completed task',
    });
    expect(result.timerCompleted).toBe(true);
  });

  it('should accept empty evidence', () => {
    const result = EvidenceSchema.parse({});
    expect(result).toEqual({});
  });

  it('should reject more than 5 photos', () => {
    const photos = Array.from({ length: 6 }, (_, i) => `https://example.com/photo${i}.jpg`);
    expect(() => EvidenceSchema.parse({ photos })).toThrow();
  });

  it('should reject note over 500 characters', () => {
    expect(() =>
      EvidenceSchema.parse({ note: 'a'.repeat(501) })
    ).toThrow();
  });
});

describe('CompleteTaskSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('should accept valid completion', () => {
    const result = CompleteTaskSchema.parse({
      taskId: validUuid,
      childId: validUuid,
    });
    expect(result.taskId).toBe(validUuid);
    expect(result.childId).toBe(validUuid);
  });

  it('should require valid UUIDs', () => {
    expect(() =>
      CompleteTaskSchema.parse({ taskId: 'invalid', childId: validUuid })
    ).toThrow();
    expect(() =>
      CompleteTaskSchema.parse({ taskId: validUuid, childId: 'invalid' })
    ).toThrow();
  });

  it('should accept optional instanceId and evidence', () => {
    const result = CompleteTaskSchema.parse({
      taskId: validUuid,
      childId: validUuid,
      instanceId: validUuid,
      evidence: { timerCompleted: true },
    });
    expect(result.instanceId).toBe(validUuid);
    expect(result.evidence?.timerCompleted).toBe(true);
  });
});

describe('ApproveTaskSchema', () => {
  it('should accept valid UUID', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';
    const result = ApproveTaskSchema.parse({ completionId: validUuid });
    expect(result.completionId).toBe(validUuid);
  });

  it('should reject invalid UUID', () => {
    expect(() => ApproveTaskSchema.parse({ completionId: 'invalid' })).toThrow();
  });
});

describe('RejectTaskSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('should accept valid rejection', () => {
    const result = RejectTaskSchema.parse({
      completionId: validUuid,
      reason: 'Not completed properly',
    });
    expect(result.reason).toBe('Not completed properly');
  });

  it('should allow optional reason', () => {
    const result = RejectTaskSchema.parse({ completionId: validUuid });
    expect(result.reason).toBeUndefined();
  });

  it('should reject reason over 500 characters', () => {
    expect(() =>
      RejectTaskSchema.parse({
        completionId: validUuid,
        reason: 'a'.repeat(501),
      })
    ).toThrow();
  });
});

describe('FixRequestSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('should accept valid fix request', () => {
    const result = FixRequestSchema.parse({
      completionId: validUuid,
      items: ['Please complete step 1'],
    });
    expect(result.items).toHaveLength(1);
  });

  it('should require at least one item', () => {
    expect(() =>
      FixRequestSchema.parse({ completionId: validUuid, items: [] })
    ).toThrow();
  });

  it('should reject more than 5 items', () => {
    const items = Array.from({ length: 6 }, (_, i) => `Item ${i}`);
    expect(() =>
      FixRequestSchema.parse({ completionId: validUuid, items })
    ).toThrow();
  });

  it('should reject empty item strings', () => {
    expect(() =>
      FixRequestSchema.parse({ completionId: validUuid, items: [''] })
    ).toThrow();
  });

  it('should reject item strings over 200 characters', () => {
    expect(() =>
      FixRequestSchema.parse({
        completionId: validUuid,
        items: ['a'.repeat(201)],
      })
    ).toThrow();
  });
});

// ============================================================================
// Batch Operations Schemas
// ============================================================================

describe('BatchApproveSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('should accept valid batch approve', () => {
    const result = BatchApproveSchema.parse({
      completionIds: [validUuid, validUuid],
    });
    expect(result.completionIds).toHaveLength(2);
  });

  it('should require at least one ID', () => {
    expect(() => BatchApproveSchema.parse({ completionIds: [] })).toThrow();
  });

  it('should reject more than 20 IDs', () => {
    const ids = Array.from({ length: 21 }, () => validUuid);
    expect(() => BatchApproveSchema.parse({ completionIds: ids })).toThrow();
  });
});

describe('BatchRejectSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('should accept valid batch reject', () => {
    const result = BatchRejectSchema.parse({
      completionIds: [validUuid],
      reason: 'All incomplete',
    });
    expect(result.reason).toBe('All incomplete');
  });

  it('should allow optional reason', () => {
    const result = BatchRejectSchema.parse({
      completionIds: [validUuid],
    });
    expect(result.reason).toBeUndefined();
  });
});

// ============================================================================
// Onboarding Schemas
// ============================================================================

describe('PresetKeySchema', () => {
  it('should accept valid preset keys', () => {
    expect(PresetKeySchema.parse('starter')).toBe('starter');
    expect(PresetKeySchema.parse('balanced')).toBe('balanced');
    expect(PresetKeySchema.parse('learning_focus')).toBe('learning_focus');
  });

  it('should reject invalid preset keys', () => {
    expect(() => PresetKeySchema.parse('busy')).toThrow();
    expect(() => PresetKeySchema.parse('academic')).toThrow();
  });
});

describe('ModuleKeySchema', () => {
  it('should accept valid module keys', () => {
    expect(ModuleKeySchema.parse('hygiene')).toBe('hygiene');
    expect(ModuleKeySchema.parse('fitness')).toBe('fitness');
    expect(ModuleKeySchema.parse('hobby')).toBe('hobby');
  });

  it('should reject invalid module keys', () => {
    expect(() => ModuleKeySchema.parse('chores')).toThrow();
  });
});

describe('AgeGroupSchema', () => {
  it('should accept valid age groups', () => {
    expect(AgeGroupSchema.parse('5-7')).toBe('5-7');
    expect(AgeGroupSchema.parse('8-11')).toBe('8-11');
    expect(AgeGroupSchema.parse('12-14')).toBe('12-14');
    expect(AgeGroupSchema.parse('all')).toBe('all');
  });

  it('should reject invalid age groups', () => {
    expect(() => AgeGroupSchema.parse('5-12')).toThrow();
    expect(() => AgeGroupSchema.parse('adult')).toThrow();
  });
});

describe('PopulateTasksSchema', () => {
  const validUuid = '550e8400-e29b-41d4-a716-446655440000';

  it('should accept valid populate request with presetKey', () => {
    const result = PopulateTasksSchema.parse({
      presetKey: 'starter',
      childId: validUuid,
      ageGroup: '8-11',
    });
    expect(result.presetKey).toBe('starter');
  });

  it('should accept legacy style field', () => {
    const result = PopulateTasksSchema.parse({
      style: 'balanced',
      childId: validUuid,
      ageGroup: '8-11',
    });
    expect(result.style).toBe('balanced');
  });

  it('should require either presetKey or style', () => {
    expect(() =>
      PopulateTasksSchema.parse({
        childId: validUuid,
        ageGroup: '8-11',
      })
    ).toThrow();
  });

  it('should accept enabled modules', () => {
    const result = PopulateTasksSchema.parse({
      presetKey: 'starter',
      childId: validUuid,
      ageGroup: '8-11',
      enabledModules: ['hygiene', 'fitness'],
    });
    expect(result.enabledModules).toEqual(['hygiene', 'fitness']);
  });
});

// ============================================================================
// Query Parameter Schemas
// ============================================================================

describe('GetTasksQuerySchema', () => {
  it('should accept valid query', () => {
    const result = GetTasksQuerySchema.parse({
      category: 'learning',
      isActive: true,
      frequency: 'daily',
    });
    expect(result.category).toBe('learning');
  });

  it('should accept empty query', () => {
    const result = GetTasksQuerySchema.parse({});
    expect(result).toEqual({});
  });
});

describe('GetPendingApprovalsQuerySchema', () => {
  it('should accept valid query', () => {
    const result = GetPendingApprovalsQuerySchema.parse({
      limit: 20,
      offset: 10,
    });
    expect(result.limit).toBe(20);
    expect(result.offset).toBe(10);
  });

  it('should reject limit over 100', () => {
    expect(() =>
      GetPendingApprovalsQuerySchema.parse({ limit: 101 })
    ).toThrow();
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

describe('safeValidate', () => {
  it('should return success for valid data', () => {
    const result = safeValidate(TaskCategorySchema, 'learning');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('learning');
    }
  });

  it('should return error for invalid data', () => {
    const result = safeValidate(TaskCategorySchema, 'invalid');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ZodError);
    }
  });
});

describe('formatZodError', () => {
  it('should format field errors', () => {
    const result = CreateTaskSchema.safeParse({ name: '' });
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted.message).toBeTruthy();
      expect(typeof formatted.fields).toBe('object');
    }
  });
});
