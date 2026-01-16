/**
 * Onboarding Presets Configuration (v2.1)
 *
 * 3 presets:
 * - starter (5 tasks): Minimal starter set
 * - balanced (9 tasks): Recommended for most families
 * - learning_focus (6 tasks): Academic emphasis
 */

import { PresetKey } from '@/lib/types/task';
import { getTaskTemplates, TaskTemplateConfig } from './task-templates';

export interface PresetConfig {
  key: PresetKey;
  name: string;
  nameKo: string;
  tagline: string;
  taglineKo: string;
  description: string;
  descriptionKo: string;
  icon: string;
  color: string;
  recommended: boolean;
  taskKeys: string[];
  /** Expected daily points range */
  expectedDailyPoints: {
    min: number;
    max: number;
  };
}

export const PRESETS: Record<PresetKey, PresetConfig> = {
  starter: {
    key: 'starter',
    name: 'Starter',
    nameKo: '스타터',
    tagline: 'Simple start',
    taglineKo: '간단한 시작',
    description: 'A minimal set of 5 tasks to get started. Great for younger kids or families new to task systems.',
    descriptionKo: '시작하기 위한 5개의 최소 태스크. 어린 아이들이나 태스크 시스템이 처음인 가족에게 적합합니다.',
    icon: '🌱',
    color: '#00B894',
    recommended: false,
    taskKeys: ['wake_on_time', 'make_bed', 'backpack', 'homework', 'clean_desk'],
    expectedDailyPoints: {
      min: 65,
      max: 80,
    },
  },
  balanced: {
    key: 'balanced',
    name: 'Balanced',
    nameKo: '밸런스',
    tagline: 'Well-rounded routine',
    taglineKo: '균형 잡힌 루틴',
    description:
      '9 tasks covering morning, after-school, and anytime activities. The recommended choice for most families.',
    descriptionKo: '아침, 방과 후, 언제든지 활동을 포함하는 9개의 태스크. 대부분의 가족에게 추천하는 선택입니다.',
    icon: '⭐',
    color: '#6C5CE7',
    recommended: true,
    taskKeys: [
      'wake_on_time',
      'make_bed',
      'shoes_tidy',
      'backpack',
      'lunchbox_sink',
      'prep_tomorrow',
      'homework',
      'reading',
      'clean_desk',
    ],
    expectedDailyPoints: {
      min: 120,
      max: 130,
    },
  },
  learning_focus: {
    key: 'learning_focus',
    name: 'Learning Focus',
    nameKo: '학습 중심',
    tagline: 'Academic emphasis',
    taglineKo: '학습 강조',
    description: '6 tasks with focus on academic activities. Ideal for families prioritizing education.',
    descriptionKo: '학업 활동에 중점을 둔 6개의 태스크. 교육을 우선시하는 가족에게 이상적입니다.',
    icon: '📖',
    color: '#0984E3',
    recommended: false,
    taskKeys: ['wake_on_time', 'check_planner', 'prep_tomorrow', 'homework', 'reading', 'writing'],
    expectedDailyPoints: {
      min: 105,
      max: 115,
    },
  },
};

/**
 * Get preset configuration by key
 */
export function getPreset(presetKey: PresetKey): PresetConfig {
  return PRESETS[presetKey];
}

/**
 * Get all presets as array
 */
export function getAllPresets(): PresetConfig[] {
  return Object.values(PRESETS);
}

/**
 * Get task templates for a preset
 */
export function getPresetTaskTemplates(presetKey: PresetKey): TaskTemplateConfig[] {
  const preset = PRESETS[presetKey];
  return getTaskTemplates(preset.taskKeys);
}

/**
 * Calculate total daily points for a preset
 */
export function calculatePresetDailyPoints(presetKey: PresetKey): number {
  const templates = getPresetTaskTemplates(presetKey);
  return templates.reduce((sum, t) => sum + t.points, 0);
}
