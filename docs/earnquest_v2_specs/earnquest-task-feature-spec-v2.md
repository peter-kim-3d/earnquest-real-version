# EarnQuest - Task Feature Specification v2.0

> AI 토론 결과를 반영한 태스크 시스템 상세 설계

**Version**: 2.0  
**Last Updated**: 2025-01-09  
**Status**: Ready for Implementation

---

## 📋 Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-05 | Initial PRD |
| 2.0 | 2025-01-09 | AI 토론 결과 반영 (Grok, Perplexity, Gemini, GPT) |

### v2.0 주요 변경사항

1. **카테고리**: `life` → `household`로 명확화
2. **Auto-approval**: 대폭 축소 (2개만)
3. **디폴트 태스크**: 7개 base + 2개 conditional
4. **프리셋**: 3개 → 4개 (Screen Time Peace 추가)
5. **Multi-child**: Phase 2 확장 계획 명시
6. **메타데이터**: JSONB 컬럼 추가

---

## 1. Task System Overview

### 1.1 Core Loop

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TASK CORE LOOP                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐   │
│  │  DEFINE  │ ───▶ │ COMPLETE │ ───▶ │ APPROVE  │ ───▶ │  EARN    │   │
│  │  (부모)   │      │  (아이)   │      │(부모/자동)│      │ (포인트)  │   │
│  └──────────┘      └──────────┘      └──────────┘      └──────────┘   │
│       │                 │                 │                 │          │
│       ▼                 ▼                 ▼                 ▼          │
│  • 디폴트 선택      • 완료 버튼       • Parent check     • 잔액 증가   │
│  • 커스텀 생성      • 타이머 실행     • Auto approve     • 거래 기록   │
│  • 자녀 할당        • 체크리스트      • Timer complete   • 알림 발송   │
│  • 포인트 설정      • 증빙 첨부       • Fix request      │              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Design Principles (v2 업데이트)

| Principle | Description | v2 변경사항 |
|-----------|-------------|-------------|
| **Trust over Verification** | 기본은 신뢰, 필요 시 검증 | Auto-approval 최소화로 신뢰 남용 방지 |
| **Motivation over Control** | 감시 아닌 동기부여 | Fix 요청 템플릿 강화 |
| **Simplicity over Completeness** | 쉬운 사용 우선 | 4개 프리셋으로 빠른 온보딩 |
| **Fairness for Siblings** | 형제 간 공정성 | 비교 UI 차단 유지 |

---

## 2. Task Categories

### 2.1 Category Structure

```typescript
type TaskCategory = 'learning' | 'household' | 'health';

// v2: 'life' → 'household' 변경
// - "Life"가 너무 모호함
// - "Household"가 가사/책임을 더 명확히 표현
```

### 2.2 Category Details

| Category | Key | Icon | Color | Description |
|----------|-----|------|-------|-------------|
| **Learning** | `learning` | 📚 | `#6C5CE7` | 학습, 숙제, 독서 |
| **Household** | `household` | 🏠 | `#00B894` | 가사, 정리, 책임 |
| **Health** | `health` | 💪 | `#FF7675` | 건강, 운동, 자기관리 |

### 2.3 Subcategory (Flexible String)

```typescript
// 권장 subcategory 목록 (자동완성용)
const RECOMMENDED_SUBCATEGORIES = {
  learning: ['homework', 'reading', 'practice', 'self_study', 'learning_app'],
  household: ['cleaning', 'chores', 'pet_care', 'self_care', 'organization'],
  health: ['exercise', 'hygiene', 'sleep', 'nutrition'],
};

// 사용자는 자유롭게 입력 가능
// 분석 시 정규화 처리
```

### 2.4 Social/Kindness는 별도 시스템

```
⚠️ 친사회적 행동 (동생 돕기, 배려 등)은 Task가 아닙니다!

Proposal §5에 따라 Kindness System으로 분리:
• 감사 카드 (Kindness Card)
• 친절 배지 (Kindness Badge)
• 주간 서프라이즈 보너스

이유: 친사회적 행동에 정규 포인트를 주면 내적 동기가 감소함
```

---

## 3. Task Data Model

### 3.1 Database Schema (v2)

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  template_id UUID REFERENCES task_templates(id),
  
  -- 할당 (v2: 설명 추가)
  child_id UUID REFERENCES children(id),
  -- null = 모든 자녀에게 할당
  -- specific UUID = 특정 자녀만
  -- Phase 2: task_assignments 테이블로 확장 예정
  
  -- 기본 정보
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL,  -- v2: 'household' 추가
  icon VARCHAR(50),
  points INT NOT NULL,
  
  -- 승인 설정 (v2: 가이드라인 강화)
  approval_type VARCHAR(20) DEFAULT 'parent',
  -- 'parent': 부모 확인 필요 (권장)
  -- 'auto': 즉시 승인 (최소한만 - backpack, get_dressed)
  -- 'timer': 시간 충족 시 승인 (reading, exercise)
  -- 'checklist': 항목 체크 시 승인 (brush_teeth, make_bed)
  
  timer_minutes INT,
  checklist JSONB,  -- ["AM", "PM"] or ["항목1", "항목2"]
  photo_required BOOLEAN DEFAULT false,
  
  -- v2 NEW: 확장용 메타데이터
  metadata JSONB DEFAULT '{}',
  -- {
  --   "subcategory": "homework",
  --   "tags": ["school", "daily"],
  --   "source": { "type": "manual" },
  --   "learning": { "subject": "math" }
  -- }
  
  -- 신뢰 (Phase 2)
  is_trust_task BOOLEAN DEFAULT false,
  min_trust_level INT DEFAULT 1,
  
  -- 스케줄 (Phase 2)
  schedule JSONB,  -- {"days": ["mon","wed","fri"], "time": "15:00"}
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  
  -- 메타
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_tasks_family_id ON tasks(family_id);
CREATE INDEX idx_tasks_child_id ON tasks(child_id);
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_active ON tasks(is_active) WHERE is_active = true;

-- v2 NEW: metadata 내 subcategory 검색용
CREATE INDEX idx_tasks_metadata ON tasks USING gin(metadata);
```

### 3.2 TypeScript Interface

```typescript
// types/task.ts

export type TaskCategory = 'learning' | 'household' | 'health';

export type ApprovalType = 'parent' | 'auto' | 'timer' | 'checklist';

export interface TaskMetadata {
  subcategory?: string;
  tags?: string[];
  source?: {
    type: 'manual' | 'ai_photo' | 'ai_text' | 'integration';
    originalImage?: string;
    aiExtracted?: boolean;
    integrationApp?: string;
  };
  learning?: {
    subject?: string;
    difficulty?: number;  // 1-5
  };
}

export interface Task {
  id: string;
  familyId: string;
  templateId?: string;
  childId?: string;  // null = all children
  
  // Basic info
  name: string;
  description?: string;
  category: TaskCategory;
  icon?: string;
  points: number;
  
  // Approval settings
  approvalType: ApprovalType;
  timerMinutes?: number;
  checklist?: string[];
  photoRequired: boolean;
  
  // v2: Metadata
  metadata: TaskMetadata;
  
  // Trust (Phase 2)
  isTrustTask: boolean;
  minTrustLevel: number;
  
  // Schedule (Phase 2)
  schedule?: TaskSchedule;
  
  // Status
  isActive: boolean;
  sortOrder: number;
  
  // Meta
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSchedule {
  days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  time?: string;  // "15:00"
}
```

---

## 4. Approval System (v2 대폭 수정)

### 4.1 Approval Type Guidelines

```
⚠️ v2 핵심 변경: Auto-approval 최소화

AI 토론 결과:
- Auto-approval 남용 → 치팅 유발 → 부모 신뢰 붕괴 → 앱 이탈
- "Clear dishes" auto는 위험 (기준이 가정마다 다름)
- 안전한 Auto는 "binary outcome" 태스크만
```

| Type | 사용 조건 | 안전한 태스크 | 위험한 태스크 |
|------|----------|--------------|--------------|
| **parent** | 품질 판단 필요 | homework, clean_room, clear_dishes | - |
| **auto** | 이진 결과 (했다/안했다) | backpack, get_dressed | ❌ make_bed, dishes |
| **timer** | 시간 기반 검증 | reading, exercise, practice | - |
| **checklist** | 다중 항목 자기체크 | brush_teeth (AM/PM), make_bed | - |

### 4.2 Auto-Approval 허용 목록 (v2 Whitelist)

```typescript
// v2: 오직 이 태스크만 auto 허용
const SAFE_FOR_AUTO = [
  'backpack',      // 가방/신발 제자리에 - 있거나 없거나
  'get_dressed',   // 혼자 옷 입기 - 5-7세용
  'set_alarm',     // 알람 설정 - 확인 가능
];

// 나머지는 모두 parent, timer, checklist 중 선택
```

### 4.3 Approval Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        APPROVAL FLOW (v2)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  아이: "완료" 버튼                                                       │
│         │                                                               │
│         ├─── approvalType == 'auto' ───────────────────▶ 즉시 승인     │
│         │    (whitelist만)                                ↓            │
│         │                                              포인트 적립      │
│         │                                                               │
│         ├─── approvalType == 'timer' ──────────────────▶ 타이머 체크   │
│         │                                                 │            │
│         │                                    ┌────────────┴───────────┐│
│         │                                    │ 시간 충족?             ││
│         │                                    ├─ Yes → 승인 → 포인트   ││
│         │                                    └─ No → 계속 진행        ││
│         │                                                               │
│         ├─── approvalType == 'checklist' ──────────────▶ 체크리스트   │
│         │                                                 │            │
│         │                                    ┌────────────┴───────────┐│
│         │                                    │ 모두 체크?             ││
│         │                                    ├─ Yes → 승인 → 포인트   ││
│         │                                    └─ No → 완료 불가        ││
│         │                                                               │
│         └─── approvalType == 'parent' ─────────────────▶ PENDING      │
│                                                            │            │
│                                               ┌────────────┴──────────┐│
│                                               │ 부모 액션             ││
│                                               ├─ ✅ 승인 → 포인트     ││
│                                               ├─ 🔁 Fix 요청 → 재시도 ││
│                                               ├─ ⏳ 나중에 → 대기     ││
│                                               └─ 24h 경과 → 자동 승인 ││
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Fix Request System

```typescript
// Fix 요청 템플릿 (태스크별)
interface FixRequestTemplate {
  key: string;
  icon: string;
  text: string;
}

const FIX_TEMPLATES: Record<string, FixRequestTemplate[]> = {
  clean_room: [
    { key: 'floor', icon: '👕', text: 'Please pick up clothes from the floor' },
    { key: 'desk', icon: '📚', text: 'Your desk needs a bit more organizing' },
    { key: 'bed', icon: '🛏️', text: "Don't forget to make your bed" },
  ],
  homework: [
    { key: 'check', icon: '✅', text: 'Double-check your answers' },
    { key: 'handwriting', icon: '✍️', text: 'Try to write a bit neater' },
  ],
  default: [
    { key: 'almost', icon: '💪', text: 'Almost there! Just a bit more' },
    { key: 'retry', icon: '🔄', text: 'Give it another try' },
  ],
};
```

### 4.5 Completion Status

| Status | Code | Child Message | Parent Action |
|--------|------|---------------|---------------|
| **Pending** | `pending` | "Waiting for check" | Approve / Fix / Later |
| **Fix Requested** | `fix_requested` | "Almost there! Try again" | - |
| **Approved** | `approved` | "Great job! +50 pts" | - |
| **Auto Approved** | `auto_approved` | "Great job! +50 pts" | - |

---

## 5. Default Tasks (v2)

### 5.1 Base Tasks (7개)

| # | Template Key | Category | Name | Points | Approval | Age |
|---|--------------|----------|------|--------|----------|-----|
| 1 | `homework` | learning | Complete homework | 50 | parent | 8-14 |
| 2 | `reading` | learning | Read for 20 minutes | 30 | timer (20m) | 5-14 |
| 3 | `make_bed` | household | Make your bed | 15 | checklist | 5-14 |
| 4 | `clear_dishes` | household | Clear dishes after meal | 20 | parent | 8-14 |
| 5 | `backpack` | household | Put away backpack & shoes | 15 | auto | 5-11 |
| 6 | `brush_teeth` | health | Brush teeth (AM/PM) | 10 | checklist | 5-14 |
| 7 | `exercise` | health | Exercise for 30 minutes | 40 | timer (30m) | 8-14 |

**Daily Points Range: 100-180 pts** (5-6개 완료 시 100-140)

### 5.2 Conditional Tasks (2개)

| Template Key | Category | Name | Points | Condition |
|--------------|----------|------|--------|-----------|
| `feed_pet` | household | Feed your pet | 20 | "Do you have pets?" |
| `practice_instrument` | learning | Practice instrument | 30 | "Play an instrument?" |

### 5.3 Age-Specific Tasks

**5-7세 추가:**
| Template Key | Name | Points | Approval |
|--------------|------|--------|----------|
| `pick_up_toys` | Pick up toys | 15 | parent |
| `get_dressed` | Get dressed by yourself | 10 | auto |

**12-14세 추가:**
| Template Key | Name | Points | Approval |
|--------------|------|--------|----------|
| `laundry` | Help with laundry | 25 | parent |
| `study_session` | Study session (45 min) | 60 | timer |

---

## 6. Onboarding Presets (v2: 4개)

### 6.1 Preset Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ONBOARDING PRESETS (v2)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🟢 Busy Parent (3 tasks)                                               │
│  "Minimal management, maximum impact"                                   │
│  → homework, brush_teeth, backpack                                      │
│  → Daily: 60-90 pts                                                     │
│                                                                         │
│  🟣 Balanced Growth (7 tasks) ⭐ RECOMMENDED                            │
│  "Build habits across all areas"                                        │
│  → All base tasks                                                       │
│  → Daily: 100-150 pts                                                   │
│                                                                         │
│  🔵 Academic First (5 tasks)                                            │
│  "Focus on learning habits"                                             │
│  → homework(60↑), reading(40↑), practice, brush, exercise               │
│  → Daily: 100-170 pts                                                   │
│                                                                         │
│  🟡 Screen Time Peace (4 tasks) ← v2 NEW                                │
│  "Reduce screen time conflicts"                                         │
│  → homework, clear_dishes, brush_teeth, exercise                        │
│  → Screen budget: 3hr/week (strict)                                     │
│  → Daily: 80-120 pts                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Preset Details

```typescript
interface OnboardingPreset {
  key: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  taskKeys: string[];
  pointOverrides?: Record<string, number>;
  timerOverrides?: Record<string, number>;
  expectedDailyPoints: { min: number; max: number };
  screenBudgetWeeklyMinutes: number;
  recommended: boolean;
}

const PRESETS: OnboardingPreset[] = [
  {
    key: 'busy',
    name: 'Busy Parent',
    tagline: 'Minimal management, maximum impact',
    taskKeys: ['homework', 'brush_teeth', 'backpack'],
    expectedDailyPoints: { min: 60, max: 90 },
    screenBudgetWeeklyMinutes: 300,
    recommended: false,
  },
  {
    key: 'balanced',
    name: 'Balanced Growth',
    tagline: 'Build habits across all areas',
    taskKeys: ['homework', 'reading', 'make_bed', 'clear_dishes', 'backpack', 'brush_teeth', 'exercise'],
    expectedDailyPoints: { min: 100, max: 150 },
    screenBudgetWeeklyMinutes: 300,
    recommended: true,
  },
  {
    key: 'academic',
    name: 'Academic First',
    tagline: 'Focus on learning habits',
    taskKeys: ['homework', 'reading', 'practice_instrument', 'brush_teeth', 'exercise'],
    pointOverrides: { homework: 60, reading: 40 },
    timerOverrides: { reading: 30 },
    expectedDailyPoints: { min: 100, max: 170 },
    screenBudgetWeeklyMinutes: 240,
    recommended: false,
  },
  {
    key: 'screen',
    name: 'Screen Time Peace',
    tagline: 'Reduce screen time conflicts',
    taskKeys: ['homework', 'clear_dishes', 'brush_teeth', 'exercise'],
    expectedDailyPoints: { min: 80, max: 120 },
    screenBudgetWeeklyMinutes: 180,  // Stricter
    recommended: false,
  },
];
```

### 6.3 Onboarding Flow

```
Step 1: Child Info
├── Name
├── Age group (5-7 / 8-11 / 12-14)
└── Avatar (optional)

Step 2: Quick Questions (v2 NEW)
├── "Do you have pets at home?" → adds feed_pet
├── "Does your child play an instrument?" → adds practice_instrument
└── "What's your main goal?" → recommends preset

Step 3: Preset Selection
├── Show 4 presets with recommended highlighted
├── Preview tasks for selected preset
└── "Customize" option (skip to manual)

Step 4: Confirmation
├── Show final task list
├── Expected daily points
└── "Start" or "Edit tasks"

Target: < 2 minutes total
```

---

## 7. Multi-Child System

### 7.1 MVP Approach (v2 확정)

```typescript
// MVP: Simple nullable child_id
interface Task {
  childId: string | null;  // null = all children
}

// 쿼리 예시
const getTasksForChild = (familyId: string, childId: string) => {
  return supabase
    .from('tasks')
    .select('*')
    .eq('family_id', familyId)
    .or(`child_id.is.null,child_id.eq.${childId}`)
    .eq('is_active', true);
};
```

### 7.2 Sibling Visibility Rules

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SIBLING VISIBILITY (v2)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Child View:                                                            │
│  ✅ 자신의 태스크만 보임                                                 │
│  ✅ 자신의 포인트만 보임                                                 │
│  ✅ child_id=null 태스크도 "내 것"처럼 표시                              │
│  ❌ 형제 태스크/포인트/랭킹 절대 안 보임                                 │
│                                                                         │
│  Parent View:                                                           │
│  ✅ 모든 자녀의 태스크/포인트 보임                                       │
│  ✅ 자녀별 필터링 가능                                                   │
│  ✅ 전체 가족 현황 대시보드                                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Phase 2: Many-to-Many Extension

```sql
-- Phase 2: task_assignments 테이블
CREATE TABLE task_assignments (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, child_id)
);

-- 마이그레이션: 기존 데이터 이전
INSERT INTO task_assignments (task_id, child_id)
SELECT t.id, c.id
FROM tasks t
CROSS JOIN children c
WHERE t.child_id IS NULL
AND c.family_id = t.family_id;

INSERT INTO task_assignments (task_id, child_id)
SELECT id, child_id
FROM tasks
WHERE child_id IS NOT NULL;
```

---

## 8. Points Integration

### 8.1 Point Flow

```typescript
// 태스크 승인 시 포인트 적립
async function approveTask(completionId: string, approvedBy?: string) {
  const completion = await getCompletion(completionId);
  const task = await getTask(completion.taskId);
  
  // 1. 상태 업데이트
  await updateCompletion(completionId, {
    status: approvedBy ? 'approved' : 'auto_approved',
    pointsAwarded: task.points,
    approvedBy,
    approvedAt: new Date(),
  });
  
  // 2. 포인트 적립 (트랜잭션)
  await addPoints({
    childId: completion.childId,
    amount: task.points,
    type: 'task_completion',
    referenceType: 'task_completion',
    referenceId: completionId,
    description: `${task.name} completed`,
  });
  
  // 3. 알림 발송
  await sendNotification({
    to: completion.childId,
    type: 'points_earned',
    data: { points: task.points, taskName: task.name },
  });
}
```

### 8.2 Points Balance Check

```
일일 목표: 100-150 pts
주간 목표: 500-700 pts

게임 30분 = 100 pts
→ 하루 열심히 하면 = 1회 게임 가능
→ 일주일 모으면 = 경험 리워드 가능 (150-300 pts)
```

---

## 9. API Endpoints

### 9.1 Task CRUD

```typescript
// GET /api/tasks
// 가족의 모든 태스크 조회
interface GetTasksQuery {
  childId?: string;      // 특정 자녀용 필터
  category?: TaskCategory;
  isActive?: boolean;
}

// POST /api/tasks
// 새 태스크 생성
interface CreateTaskBody {
  name: string;
  category: TaskCategory;
  points: number;
  approvalType: ApprovalType;
  childId?: string;      // null = all
  timerMinutes?: number;
  checklist?: string[];
  metadata?: TaskMetadata;
}

// PATCH /api/tasks/:id
// 태스크 수정

// DELETE /api/tasks/:id
// 태스크 소프트 삭제
```

### 9.2 Task Completion

```typescript
// POST /api/tasks/:taskId/complete
// 완료 요청
interface CompleteTaskBody {
  childId: string;
  evidence?: {
    photos?: string[];
    timerCompleted?: boolean;
    checklist?: boolean[];
  };
}

// Response
interface CompleteTaskResponse {
  completionId: string;
  status: 'pending' | 'approved' | 'auto_approved';
  autoApproveAt?: string;  // 24h 후
  pointsAwarded?: number;  // 즉시 승인 시
}
```

### 9.3 Approval

```typescript
// GET /api/approvals/pending
// 대기 중인 승인 목록

// POST /api/approvals/:completionId/approve
// 승인

// POST /api/approvals/:completionId/fix
// Fix 요청
interface FixRequestBody {
  items: string[];    // Fix 항목
  message?: string;   // 커스텀 메시지
}

// POST /api/approvals/batch
// 일괄 승인
interface BatchApproveBody {
  completionIds: string[];
}
```

---

## 10. Implementation Checklist

### MVP (Phase 1: Week 5-6)

```
□ Database
  □ tasks 테이블 생성 (metadata JSONB 포함)
  □ task_completions 테이블 생성
  □ task_templates 테이블 + seed data
  □ RLS 정책 설정

□ API
  □ GET /api/tasks
  □ POST /api/tasks
  □ PATCH /api/tasks/:id
  □ DELETE /api/tasks/:id
  □ POST /api/tasks/:taskId/complete
  □ GET /api/approvals/pending
  □ POST /api/approvals/:id/approve
  □ POST /api/approvals/:id/fix
  □ POST /api/approvals/batch

□ UI - Parent
  □ TaskList 컴포넌트
  □ TaskCard 컴포넌트
  □ TaskForm (create/edit)
  □ PendingApprovals 페이지
  □ ApprovalCard (approve/fix/later)
  □ FixRequestModal
  □ BatchApproveButton

□ UI - Child
  □ MyTasks 페이지
  □ TaskCard (완료 버튼)
  □ TimerModal
  □ ChecklistModal
  □ CompletionAnimation

□ Onboarding
  □ PresetSelector 컴포넌트
  □ ConditionalQuestions (pet, instrument)
  □ TaskPreview 컴포넌트
  □ Bulk task creation

□ State
  □ Zustand: tasksStore
  □ TanStack Query: useTasksQuery, useCreateTask, etc.
```

### Phase 2 (Week 9-10)

```
□ Timer-based approval
□ Checklist-based approval
□ Photo upload option
□ Trust Level system
□ task_assignments 테이블 (multi-child extension)
```

---

## 11. Edge Cases & Error Handling

### 11.1 Known Edge Cases

| Case | Current Handling | Future |
|------|------------------|--------|
| 하루 2회 태스크 (양치) | Checklist 타입 | - |
| 형제 공동 태스크 | 태스크 복제 권장 | task_assignments |
| 부모 미승인 24h | 자동 승인 | - |
| Fix 3회 이상 반복 | 태스크 재정의 권장 | - |
| 휴가/병가 | 미지원 | Pause 기능 |

### 11.2 Error Messages

```typescript
const TASK_ERRORS = {
  TASK_NOT_FOUND: 'Task not found',
  ALREADY_COMPLETED_TODAY: 'Task already completed today',
  COMPLETION_NOT_FOUND: 'Completion record not found',
  ALREADY_APPROVED: 'Task already approved',
  TIMER_NOT_COMPLETE: 'Timer has not completed yet',
  CHECKLIST_INCOMPLETE: 'Please complete all checklist items',
  INSUFFICIENT_TRUST_LEVEL: 'Trust level required for auto-approval',
};
```

---

## 12. Analytics Events

```typescript
// Task events
track('task_created', { category, approvalType, isDefault });
track('task_completed', { taskId, childId, approvalType });
track('task_approved', { taskId, isAuto, secondsToApprove });
track('task_fix_requested', { taskId, fixCount });

// Onboarding events
track('preset_selected', { presetKey });
track('conditional_task_added', { taskKey, condition });
track('onboarding_completed', { taskCount, durationSeconds });
```

---

*End of Task Feature Specification v2.0*
