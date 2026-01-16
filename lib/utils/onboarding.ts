/**
 * Onboarding Utility Functions (v2.1)
 *
 * Helper functions for combining presets and modules
 */

import { PresetKey, ModuleKey, TaskTimeContext } from '@/lib/types/task';
import { getPreset, calculatePresetDailyPoints } from '@/lib/config/presets';
import { getModule, calculateModulesDailyPoints } from '@/lib/config/modules';
import { getTaskTemplates, TaskTemplateConfig } from '@/lib/config/task-templates';

/**
 * Get combined task keys from preset and enabled modules (no duplicates)
 */
export function getTaskKeysForSelection(presetKey: PresetKey, enabledModules: ModuleKey[]): string[] {
  const taskKeySet = new Set<string>();

  // Add preset task keys
  const preset = getPreset(presetKey);
  preset.taskKeys.forEach((key) => taskKeySet.add(key));

  // Add module task keys
  for (const moduleKey of enabledModules) {
    const taskModule = getModule(moduleKey);
    taskModule.taskKeys.forEach((key) => taskKeySet.add(key));
  }

  return Array.from(taskKeySet);
}

/**
 * Get task templates for a selection (preset + modules)
 */
export function getTaskTemplatesForSelection(
  presetKey: PresetKey,
  enabledModules: ModuleKey[]
): TaskTemplateConfig[] {
  const taskKeys = getTaskKeysForSelection(presetKey, enabledModules);
  return getTaskTemplates(taskKeys);
}

/**
 * Calculate expected daily points for a selection
 */
export function calculateDailyPoints(presetKey: PresetKey, enabledModules: ModuleKey[]): number {
  const templates = getTaskTemplatesForSelection(presetKey, enabledModules);
  return templates.reduce((sum, t) => sum + t.points, 0);
}

/**
 * Group items by time context
 */
export function groupByTimeContext<T extends { timeContext?: TaskTimeContext | null }>(
  items: T[]
): Record<TaskTimeContext, T[]> {
  const groups: Record<TaskTimeContext, T[]> = {
    morning: [],
    after_school: [],
    evening: [],
    anytime: [],
  };

  for (const item of items) {
    const context = item.timeContext || 'anytime';
    groups[context].push(item);
  }

  return groups;
}

/**
 * Group task templates by time context for preview
 */
export function groupTaskTemplatesByTimeContext(
  presetKey: PresetKey,
  enabledModules: ModuleKey[]
): Record<TaskTimeContext, TaskTemplateConfig[]> {
  const templates = getTaskTemplatesForSelection(presetKey, enabledModules);

  return groupByTimeContext(
    templates.map((t) => ({
      ...t,
      timeContext: t.timeContext,
    }))
  );
}

/**
 * Get selection summary for display
 */
export function getSelectionSummary(presetKey: PresetKey, enabledModules: ModuleKey[]) {
  const templates = getTaskTemplatesForSelection(presetKey, enabledModules);
  const preset = getPreset(presetKey);

  const categoryCount = {
    learning: 0,
    life: 0,
    health: 0,
  };

  for (const template of templates) {
    categoryCount[template.category]++;
  }

  return {
    presetName: preset.name,
    presetNameKo: preset.nameKo,
    totalTasks: templates.length,
    totalDailyPoints: templates.reduce((sum, t) => sum + t.points, 0),
    categoryCount,
    enabledModules: enabledModules.map((m) => getModule(m)),
  };
}

/**
 * Validate selection - check for minimum tasks
 */
export function validateSelection(presetKey: PresetKey, enabledModules: ModuleKey[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const templates = getTaskTemplatesForSelection(presetKey, enabledModules);

  if (templates.length < 3) {
    errors.push('At least 3 tasks are required');
  }

  if (templates.length > 20) {
    errors.push('Maximum 20 tasks allowed for initial setup');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
