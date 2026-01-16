/**
 * Task Templates Configuration (v2.1)
 *
 * 19 task templates organized by time context:
 * - morning (3): wake_on_time, make_bed, brush_morning
 * - after_school (5): shoes_tidy, backpack, lunchbox_sink, check_planner, wash_hands
 * - evening (3): prep_tomorrow, brush_evening, shower
 * - anytime (8): homework, reading, writing, clean_desk, exercise, outdoor, instrument, art
 */

import { TaskCategory, TaskTimeContext, ApprovalType, TaskFrequency } from '@/lib/types/task';

export interface TaskTemplateConfig {
  templateKey: string;
  name: string;
  nameKo: string;
  description: string;
  descriptionKo: string;
  category: TaskCategory;
  timeContext: TaskTimeContext;
  points: number;
  icon: string;
  frequency: TaskFrequency;
  approvalType: ApprovalType;
  timerMinutes?: number;
  checklist?: string[];
  checklistKo?: string[];
}

export const TASK_TEMPLATES: TaskTemplateConfig[] = [
  // ============================================================================
  // Morning Tasks (3)
  // ============================================================================
  {
    templateKey: 'wake_on_time',
    name: 'Wake Up On Time',
    nameKo: '정해진 시간에 일어나기',
    description: 'Get out of bed at the agreed time',
    descriptionKo: '약속한 시간에 침대에서 일어나기',
    category: 'life',
    timeContext: 'morning',
    points: 10,
    icon: '⏰',
    frequency: 'daily',
    approvalType: 'auto',
  },
  {
    templateKey: 'make_bed',
    name: 'Make Bed',
    nameKo: '이불 정리하기',
    description: 'Tidy your bed after waking up',
    descriptionKo: '일어난 후 침대 정리하기',
    category: 'life',
    timeContext: 'morning',
    points: 10,
    icon: '🛏️',
    frequency: 'daily',
    approvalType: 'parent',
  },
  {
    templateKey: 'brush_morning',
    name: 'Brush Teeth (Morning)',
    nameKo: '양치질 (아침)',
    description: 'Brush teeth for 2 minutes',
    descriptionKo: '2분 동안 양치질하기',
    category: 'health',
    timeContext: 'morning',
    points: 10,
    icon: '🪥',
    frequency: 'daily',
    approvalType: 'timer',
    timerMinutes: 2,
  },

  // ============================================================================
  // After School Tasks (5)
  // ============================================================================
  {
    templateKey: 'shoes_tidy',
    name: 'Tidy Shoes',
    nameKo: '신발 정리하기',
    description: 'Put shoes in the right place when coming home',
    descriptionKo: '집에 오면 신발을 제자리에 놓기',
    category: 'life',
    timeContext: 'after_school',
    points: 5,
    icon: '👟',
    frequency: 'daily',
    approvalType: 'auto',
  },
  {
    templateKey: 'backpack',
    name: 'Unpack Backpack',
    nameKo: '가방 정리하기',
    description: 'Empty backpack and organize contents',
    descriptionKo: '가방을 비우고 내용물 정리하기',
    category: 'life',
    timeContext: 'after_school',
    points: 15,
    icon: '🎒',
    frequency: 'daily',
    approvalType: 'checklist',
    checklist: ['Take out lunchbox', 'Remove papers/homework', 'Check for notes from teacher'],
    checklistKo: ['도시락 꺼내기', '종이/숙제 꺼내기', '선생님 알림장 확인하기'],
  },
  {
    templateKey: 'lunchbox_sink',
    name: 'Lunchbox to Sink',
    nameKo: '도시락 싱크대에 놓기',
    description: 'Put lunchbox in the sink after school',
    descriptionKo: '학교 갔다 와서 도시락을 싱크대에 놓기',
    category: 'life',
    timeContext: 'after_school',
    points: 5,
    icon: '🍱',
    frequency: 'daily',
    approvalType: 'auto',
  },
  {
    templateKey: 'check_planner',
    name: 'Check Planner',
    nameKo: '플래너 확인하기',
    description: 'Review homework and upcoming tasks',
    descriptionKo: '숙제와 할 일 확인하기',
    category: 'learning',
    timeContext: 'after_school',
    points: 10,
    icon: '📋',
    frequency: 'daily',
    approvalType: 'parent',
  },
  {
    templateKey: 'wash_hands',
    name: 'Wash Hands',
    nameKo: '손 씻기',
    description: 'Wash hands when coming home',
    descriptionKo: '집에 오면 손 씻기',
    category: 'health',
    timeContext: 'after_school',
    points: 5,
    icon: '🧼',
    frequency: 'daily',
    approvalType: 'auto',
  },

  // ============================================================================
  // Evening Tasks (3)
  // ============================================================================
  {
    templateKey: 'prep_tomorrow',
    name: 'Prep for Tomorrow',
    nameKo: '내일 준비하기',
    description: 'Pack backpack and prepare clothes',
    descriptionKo: '가방 싸고 옷 준비하기',
    category: 'life',
    timeContext: 'evening',
    points: 15,
    icon: '📦',
    frequency: 'daily',
    approvalType: 'checklist',
    checklist: ['Pack backpack', 'Prepare clothes', 'Check schedule'],
    checklistKo: ['가방 싸기', '옷 준비하기', '일정 확인하기'],
  },
  {
    templateKey: 'brush_evening',
    name: 'Brush Teeth (Evening)',
    nameKo: '양치질 (저녁)',
    description: 'Brush teeth before bed',
    descriptionKo: '자기 전에 양치질하기',
    category: 'health',
    timeContext: 'evening',
    points: 10,
    icon: '🪥',
    frequency: 'daily',
    approvalType: 'timer',
    timerMinutes: 2,
  },
  {
    templateKey: 'shower',
    name: 'Take Shower',
    nameKo: '샤워하기',
    description: 'Take a shower and get clean',
    descriptionKo: '샤워하고 깨끗해지기',
    category: 'health',
    timeContext: 'evening',
    points: 15,
    icon: '🚿',
    frequency: 'daily',
    approvalType: 'parent',
  },

  // ============================================================================
  // Anytime Tasks (8)
  // ============================================================================
  {
    templateKey: 'homework',
    name: 'Homework',
    nameKo: '숙제하기',
    description: 'Complete daily homework assignments',
    descriptionKo: '매일 숙제 완료하기',
    category: 'learning',
    timeContext: 'anytime',
    points: 30,
    icon: '📝',
    frequency: 'daily',
    approvalType: 'parent',
  },
  {
    templateKey: 'reading',
    name: 'Reading Time',
    nameKo: '독서 시간',
    description: 'Read for 20 minutes',
    descriptionKo: '20분 동안 독서하기',
    category: 'learning',
    timeContext: 'anytime',
    points: 25,
    icon: '📚',
    frequency: 'daily',
    approvalType: 'timer',
    timerMinutes: 20,
  },
  {
    templateKey: 'writing',
    name: 'Writing Practice',
    nameKo: '글쓰기 연습',
    description: 'Practice writing or journaling',
    descriptionKo: '글쓰기 또는 일기 쓰기',
    category: 'learning',
    timeContext: 'anytime',
    points: 25,
    icon: '✏️',
    frequency: 'daily',
    approvalType: 'parent',
  },
  {
    templateKey: 'clean_desk',
    name: 'Clean Desk',
    nameKo: '책상 정리하기',
    description: 'Tidy up study area',
    descriptionKo: '공부하는 공간 정리하기',
    category: 'life',
    timeContext: 'anytime',
    points: 15,
    icon: '🗄️',
    frequency: 'daily',
    approvalType: 'parent',
  },
  {
    templateKey: 'exercise',
    name: 'Exercise',
    nameKo: '운동하기',
    description: '20 minutes of physical activity',
    descriptionKo: '20분 신체 활동하기',
    category: 'health',
    timeContext: 'anytime',
    points: 25,
    icon: '🏃',
    frequency: 'daily',
    approvalType: 'timer',
    timerMinutes: 20,
  },
  {
    templateKey: 'outdoor',
    name: 'Outdoor Play',
    nameKo: '야외 활동',
    description: 'Play outside for 30 minutes',
    descriptionKo: '30분 동안 밖에서 놀기',
    category: 'health',
    timeContext: 'anytime',
    points: 20,
    icon: '🌳',
    frequency: 'daily',
    approvalType: 'timer',
    timerMinutes: 30,
  },
  {
    templateKey: 'instrument',
    name: 'Practice Instrument',
    nameKo: '악기 연습하기',
    description: 'Practice musical instrument',
    descriptionKo: '악기 연습하기',
    category: 'learning',
    timeContext: 'anytime',
    points: 30,
    icon: '🎵',
    frequency: 'daily',
    approvalType: 'timer',
    timerMinutes: 15,
  },
  {
    templateKey: 'art',
    name: 'Art/Craft',
    nameKo: '미술/공예',
    description: 'Creative art or craft activity',
    descriptionKo: '창의적인 미술 또는 공예 활동',
    category: 'learning',
    timeContext: 'anytime',
    points: 20,
    icon: '🎨',
    frequency: 'daily',
    approvalType: 'parent',
  },
];

/**
 * Get task template by key
 */
export function getTaskTemplate(templateKey: string): TaskTemplateConfig | undefined {
  return TASK_TEMPLATES.find((t) => t.templateKey === templateKey);
}

/**
 * Get task templates by keys
 */
export function getTaskTemplates(templateKeys: string[]): TaskTemplateConfig[] {
  return TASK_TEMPLATES.filter((t) => templateKeys.includes(t.templateKey));
}

/**
 * Get task templates by time context
 */
export function getTaskTemplatesByTimeContext(timeContext: TaskTimeContext): TaskTemplateConfig[] {
  return TASK_TEMPLATES.filter((t) => t.timeContext === timeContext);
}
