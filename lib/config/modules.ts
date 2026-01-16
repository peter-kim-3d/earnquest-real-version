/**
 * Add-on Modules Configuration (v2.1)
 *
 * 3 optional modules (all default OFF):
 * - hygiene (4 tasks): Brushing teeth, washing hands, shower
 * - fitness (2 tasks): Exercise, outdoor play
 * - hobby (2 tasks): Instrument practice, art/craft
 */

import { ModuleKey, TaskModule } from '@/lib/types/task';
import { getTaskTemplates, TaskTemplateConfig } from './task-templates';

export const MODULES: Record<ModuleKey, TaskModule> = {
  hygiene: {
    key: 'hygiene',
    name: 'Hygiene Routine',
    nameKo: '위생 루틴',
    icon: '🧼',
    description: 'Daily hygiene tasks like brushing teeth and showering',
    descriptionKo: '양치질, 샤워 등 매일 위생 습관',
    defaultEnabled: false,
    taskKeys: ['brush_morning', 'wash_hands', 'brush_evening', 'shower'],
  },
  fitness: {
    key: 'fitness',
    name: 'Fitness',
    nameKo: '운동',
    icon: '💪',
    description: 'Physical activities and outdoor play',
    descriptionKo: '신체 활동 및 야외 놀이',
    defaultEnabled: false,
    taskKeys: ['exercise', 'outdoor'],
  },
  hobby: {
    key: 'hobby',
    name: 'Hobby',
    nameKo: '취미',
    icon: '🎵',
    description: 'Creative activities like music and art',
    descriptionKo: '음악, 미술 등 창의적 활동',
    defaultEnabled: false,
    taskKeys: ['instrument', 'art'],
  },
};

/**
 * Get module configuration by key
 */
export function getModule(moduleKey: ModuleKey): TaskModule {
  return MODULES[moduleKey];
}

/**
 * Get all modules as array
 */
export function getAllModules(): TaskModule[] {
  return Object.values(MODULES);
}

/**
 * Get task templates for a module
 */
export function getModuleTaskTemplates(moduleKey: ModuleKey): TaskTemplateConfig[] {
  const taskModule = MODULES[moduleKey];
  return getTaskTemplates(taskModule.taskKeys);
}

/**
 * Get task templates for multiple modules
 */
export function getModulesTaskTemplates(moduleKeys: ModuleKey[]): TaskTemplateConfig[] {
  const allTaskKeys = new Set<string>();

  for (const moduleKey of moduleKeys) {
    const taskModule = MODULES[moduleKey];
    taskModule.taskKeys.forEach((key) => allTaskKeys.add(key));
  }

  return getTaskTemplates(Array.from(allTaskKeys));
}

/**
 * Calculate total daily points for modules
 */
export function calculateModulesDailyPoints(moduleKeys: ModuleKey[]): number {
  const templates = getModulesTaskTemplates(moduleKeys);
  return templates.reduce((sum, t) => sum + t.points, 0);
}
