# 🧠 Claude Code Plan Mode Prompt
# EarnQuest Task System v2 – Implementation Plan

## Context

EarnQuest는 아이들이 태스크를 완료하고 포인트를 벌어 리워드로 교환하는 가족 플랫폼이다.
Task System v2는 내부 AI 토론 및 설계 리뷰를 반영한 업데이트된 핵심 시스템이다.
이 Plan은 MVP Phase 1 (Week 5–6) 범위에서 구현된다.

---

## 📁 참조 문서 (Required Reading)

구현 전 반드시 아래 문서들을 읽어라:

```
docs/earnquest_v2_specs/
├── earnquest-task-feature-spec-v2.md    # 태스크 기능 상세 스펙 (핵심!)
├── earnquest-tasks-en-US.json           # 디폴트 태스크 + 프리셋 정의
├── earnquest-prd-v2-changelog.md        # v1→v2 변경사항
└── claude-code-task-prompt.md           # 이 프롬프트의 원본

기존 문서 (docs/):
├── earnquest-prd-final.md               # 전체 PRD
├── earnquest-data-model.md              # DB 스키마
└── earnquest-setup-guide.md             # 프로젝트 설정
```

**읽는 순서:**
1. `docs/earnquest_v2_specs/earnquest-prd-v2-changelog.md` (5분) - 뭐가 바뀌었는지
2. `docs/earnquest_v2_specs/earnquest-task-feature-spec-v2.md` (15분) - 상세 스펙
3. `docs/earnquest_v2_specs/earnquest-tasks-en-US.json` (5분) - 데이터 구조

---

## v1 → v2 핵심 변경사항

1. **카테고리**: `life` → `household`로 변경
2. **Auto-approval**: 대폭 축소
   - 허용: `backpack`, `get_dressed`, `set_alarm`만
   - 금지: `clear_dishes`, `make_bed` (기준 모호)
3. **디폴트 태스크**: 7 base + 2 conditional
4. **프리셋**: 3개 → 4개 (`Screen Time Peace` 추가)
5. **tasks.metadata**: JSONB 컬럼 추가
6. **Multi-child**: `child_id` nullable 유지 (Phase 2 확장)

---

## 구현 범위: MVP Phase 1 (Week 5–6)

### 1. Database Changes

#### 1.1 tasks 테이블 수정

```sql
-- 파일: supabase/migrations/00X_task_system_v2.sql

-- metadata 컬럼 추가
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- category 마이그레이션 (life → household)
UPDATE tasks 
SET category = 'household' 
WHERE category = 'life';

-- metadata 인덱스 (검색 성능)
CREATE INDEX IF NOT EXISTS idx_tasks_metadata 
ON tasks USING gin(metadata);
```

**참조**: `docs/earnquest_v2_specs/earnquest-task-feature-spec-v2.md` §3.1

#### 1.2 task_templates seed

```sql
-- 파일: supabase/seed/task_templates_en_us.sql
-- 참조: docs/earnquest_v2_specs/earnquest-tasks-en-US.json

-- 7 base tasks + 2 conditional tasks + age-specific tasks
```

**Done Definition:**
- [ ] metadata JSONB 컬럼 존재
- [ ] 기존 'life' 데이터 → 'household' 변환됨
- [ ] `npx supabase gen types` 실행 완료
- [ ] 로컬 DB에서 SELECT 확인

---

### 2. Types & Validation

#### 2.1 TypeScript 타입

```typescript
// 파일: types/task.ts
// 참조: docs/earnquest_v2_specs/earnquest-task-feature-spec-v2.md §3.2

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
    difficulty?: number;
  };
}

export interface Task {
  id: string;
  familyId: string;
  templateId?: string;
  childId?: string;  // null = all children
  
  name: string;
  description?: string;
  category: TaskCategory;
  icon?: string;
  points: number;
  
  approvalType: ApprovalType;
  timerMinutes?: number;
  checklist?: string[];
  photoRequired: boolean;
  
  metadata: TaskMetadata;
  
  isTrustTask: boolean;
  minTrustLevel: number;
  
  isActive: boolean;
  sortOrder: number;
  
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
```

#### 2.2 Zod Schemas

```typescript
// 파일: lib/validation/task.ts

import { z } from 'zod';

export const TaskCategorySchema = z.enum(['learning', 'household', 'health']);
export const ApprovalTypeSchema = z.enum(['parent', 'auto', 'timer', 'checklist']);

export const TaskMetadataSchema = z.object({
  subcategory: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.object({
    type: z.enum(['manual', 'ai_photo', 'ai_text', 'integration']),
    originalImage: z.string().optional(),
    aiExtracted: z.boolean().optional(),
    integrationApp: z.string().optional(),
  }).optional(),
  learning: z.object({
    subject: z.string().optional(),
    difficulty: z.number().min(1).max(5).optional(),
  }).optional(),
}).default({});

export const CreateTaskSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: TaskCategorySchema,
  points: z.number().int().min(1).max(1000),
  approvalType: ApprovalTypeSchema,
  childId: z.string().uuid().nullable().default(null),
  timerMinutes: z.number().int().min(1).max(180).optional(),
  checklist: z.array(z.string()).optional(),
  photoRequired: z.boolean().default(false),
  metadata: TaskMetadataSchema,
});

export const UpdateTaskSchema = CreateTaskSchema.partial();
```

**Done Definition:**
- [ ] `npm run typecheck` 통과
- [ ] Zod 스키마 테스트 케이스 3개 이상

---

### 3. API Endpoints

```
GET    /api/tasks                    - 가족 태스크 목록
POST   /api/tasks                    - 태스크 생성
PATCH  /api/tasks/:id                - 태스크 수정
DELETE /api/tasks/:id                - 태스크 삭제 (soft delete)

POST   /api/tasks/:taskId/complete   - 완료 요청

GET    /api/approvals/pending        - 대기 승인 목록
POST   /api/approvals/:id/approve    - 승인
POST   /api/approvals/:id/fix        - Fix 요청
POST   /api/approvals/batch          - 일괄 승인
```

**참조**: `docs/earnquest_v2_specs/earnquest-task-feature-spec-v2.md` §9

#### 필수 조건:
- Zod validation 적용
- Supabase RLS 통과
- approve 시 포인트 트랜잭션 (`add_points` RPC)
- 중복 승인 방지 (idempotency)

---

### 4. UI Components

#### 4.1 Parent View

```
components/tasks/
├── TaskList.tsx           # 카테고리별 그룹핑
├── TaskCard.tsx           # 포인트, 승인타입 표시
├── TaskForm.tsx           # Create/Edit 모달

components/approvals/
├── PendingList.tsx        # 대기 목록
├── ApprovalCard.tsx       # approve/fix/later 버튼
├── FixRequestModal.tsx    # Fix 템플릿 선택
└── BatchApproveButton.tsx # 일괄 승인
```

**Fix 템플릿**: `docs/earnquest_v2_specs/earnquest-tasks-en-US.json`의 `fixRequestTemplates` 참조

#### 4.2 Child View

```
app/[locale]/(child)/tasks/page.tsx

components/child/
├── TaskCard.tsx              # 완료 버튼
├── TimerModal.tsx            # 타이머 UI
├── ChecklistModal.tsx        # 체크리스트 UI
└── CompletionCelebration.tsx # 포인트 획득 애니메이션
```

#### 4.3 Onboarding

```
components/onboarding/
├── PresetSelector.tsx        # 4개 프리셋 카드
├── ConditionalQuestions.tsx  # pet, instrument 질문
└── TaskPreview.tsx           # 선택된 태스크 미리보기
```

**프리셋 데이터**: `docs/earnquest_v2_specs/earnquest-tasks-en-US.json`의 `presets` 참조

---

### 5. State Management

```typescript
// stores/tasks.ts (Zustand)
interface TasksStore {
  tasks: Task[];
  pendingApprovals: TaskCompletion[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
}

// hooks/use-tasks.ts (TanStack Query)
export function useTasksQuery(familyId: string, childId?: string);
export function useCreateTaskMutation();
export function useCompleteTaskMutation();
export function useApproveTaskMutation();
export function useBatchApproveMutation();
```

---

### 6. Implementation Order

| Day | 작업 | 파일 | Done Definition |
|-----|------|------|-----------------|
| **Day 1** | DB migration | `supabase/migrations/` | metadata 컬럼 존재, types 재생성 |
| **Day 1** | task_templates seed | `supabase/seed/` | 9개 템플릿 삽입됨 |
| **Day 1** | Types & Zod | `types/`, `lib/validation/` | typecheck 통과 |
| **Day 2** | Task CRUD API | `app/api/tasks/` | 4개 엔드포인트 동작 |
| **Day 3** | Complete & Approve API | `app/api/tasks/[taskId]/`, `app/api/approvals/` | 포인트 트랜잭션 동작 |
| **Day 4** | Parent UI - TaskList | `components/tasks/` | 목록 표시, CRUD 동작 |
| **Day 5** | Parent UI - Approvals | `components/approvals/` | 승인/Fix/배치 동작 |
| **Day 6** | Child UI - Tasks | `app/[locale]/(child)/`, `components/child/` | 완료 플로우 동작 |
| **Day 7** | Child UI - Timer/Checklist | `components/child/` | 타이머, 체크리스트 동작 |
| **Day 8** | Onboarding | `components/onboarding/` | 프리셋 선택 → 태스크 생성 |

---

## ⚠️ Critical Rules

### Auto-Approval 제한

```typescript
// 이 태스크만 auto 허용 - 절대 추가하지 마라
const SAFE_FOR_AUTO = ['backpack', 'get_dressed', 'set_alarm'];

// 절대 auto 금지 (기준 모호)
// ❌ clear_dishes
// ❌ make_bed
// ❌ homework
```

**참조**: `docs/earnquest_v2_specs/earnquest-prd-v2-changelog.md` §2

### Multi-child Query

```typescript
// child_id가 null이면 모든 자녀에게 표시
const query = supabase
  .from('tasks')
  .select('*')
  .eq('family_id', familyId)
  .or(`child_id.is.null,child_id.eq.${childId}`);
```

### RLS Policy

```sql
-- 가족 내 데이터만 접근 가능
CREATE POLICY "Users can view own family tasks"
ON tasks FOR SELECT
USING (
  family_id = (SELECT family_id FROM users WHERE id = auth.uid())
);
```

### Fix Request Templates

```typescript
// docs/earnquest_v2_specs/earnquest-tasks-en-US.json의 fixRequestTemplates 사용
// 태스크별로 맞춤 템플릿 제공
// default 템플릿도 반드시 포함
```

---

## 🧪 Test Commands

```bash
# 타입 체크
npm run typecheck

# 린트
npm run lint

# 개발 서버
npm run dev

# Supabase 로컬
npx supabase start
npx supabase db reset  # 마이그레이션 + seed 재실행

# API 테스트 (예시)
curl http://localhost:3000/api/tasks \
  -H "Authorization: Bearer {token}"
```

---

## ✅ Final Checklist

구현 완료 후 확인:

### Database
- [ ] `tasks.metadata` JSONB 컬럼 존재
- [ ] `tasks.category = 'household'` 동작
- [ ] `task_templates`에 9개 이상 seed됨
- [ ] RLS: 다른 가족 데이터 접근 불가

### API
- [ ] POST /tasks 생성 동작
- [ ] POST /tasks/:id/complete 동작
- [ ] auto approval → 즉시 포인트 적립
- [ ] parent approval → 24h 후 자동 승인
- [ ] fix request 후 재완료 가능
- [ ] batch approve 동작

### Parent UI
- [ ] 태스크 목록 표시 (카테고리 그룹핑)
- [ ] 태스크 생성/수정/삭제
- [ ] 대기 승인 목록
- [ ] 개별/일괄 승인
- [ ] Fix 요청 + 템플릿

### Child UI
- [ ] 내 태스크만 표시 (형제 안 보임)
- [ ] 완료 버튼 동작
- [ ] 타이머 동작 (시간 충족 시 승인)
- [ ] 체크리스트 동작 (모두 체크 시 승인)
- [ ] 포인트 적립 애니메이션

### Onboarding
- [ ] 4개 프리셋 표시
- [ ] Recommended 하이라이트 (Balanced)
- [ ] Conditional questions 동작
- [ ] 프리셋 선택 → 태스크 bulk 생성
- [ ] 전체 플로우 < 2분

---

## 📚 Quick Reference

| 항목 | 위치 |
|------|------|
| 태스크 스펙 | `docs/earnquest_v2_specs/earnquest-task-feature-spec-v2.md` |
| 디폴트 태스크 JSON | `docs/earnquest_v2_specs/earnquest-tasks-en-US.json` |
| v2 변경사항 | `docs/earnquest_v2_specs/earnquest-prd-v2-changelog.md` |
| DB 스키마 | `earnquest-data-model.md` (루트) |
| 전체 PRD | `earnquest-prd-final.md` (루트) |

---

*Ready for Claude Code plan mode*
*Last Updated: 2025-01-09*