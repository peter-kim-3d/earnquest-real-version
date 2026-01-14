# 🤖 AI Collaboration Handoff System v2.0
# EarnQuest - Multi-AI Development Protocol

## Overview

이 문서는 Claude Code와 Google AntiGravity (Gemini) 간의 협업을 위한 핸드오프 시스템이다.
주요 목적: 세션 리밋 또는 AI 전환 시에도 작업 연속성과 코드 일관성을 유지한다.

---

## 📁 Handoff File Structure

```
project/
├── .handoff/
│   ├── IMPLEMENTATION_STATUS.md   # 전체 작업 체크리스트
│   ├── DECISIONS.md               # 설계/정책 결정 로그
│   ├── HANDOFF.md                 # 현재 상태 + 다음 스텝
│   ├── CONVENTIONS.md             # 코드 스타일 규칙
│   └── LOCK.md                    # 수정 금지 파일 목록
```

---

## 1. IMPLEMENTATION_STATUS.md

### Purpose
전체 구현 진행 상황을 추적하는 Single Source of Truth

### Template

```markdown
# 📊 Implementation Status
Last Updated: {timestamp}
Current Owner: {Claude | Gemini}

## Phase 1: Database (Week 5 Day 1)

### DB-001: tasks 테이블 수정
- Status: 🟡
- Owner: Claude
- Files: supabase/migrations/00X_task_v2.sql
- Done Definition:
  - [ ] metadata JSONB 컬럼 추가
  - [ ] category 'life' → 'household' 마이그레이션
  - [ ] 로컬 DB에서 테스트 통과
  - [ ] TypeScript 타입 regenerate
- Dependencies: None
- Notes: category enum vs TEXT 결정 필요 → DECISIONS.md 참조

### DB-002: task_templates seed
- Status: ⬜
- Owner: TBD
- Files: supabase/seed/task_templates.sql
- Done Definition:
  - [ ] 7 base tasks 삽입
  - [ ] 2 conditional tasks 삽입
  - [ ] age_group별 필터 동작 확인
- Dependencies: DB-001

## Phase 2: API (Week 5 Day 2-3)
...

## Status Legend
- ⬜ Not Started
- 🟡 In Progress
- ✅ Done & Verified
- 🔴 Blocked (see DECISIONS.md)
- ⏸️ Paused (다른 AI가 이어받을 예정)
```

### Rules
1. 모든 작업은 고유 ID를 가진다 (DB-001, API-001, UI-001 등)
2. Status 변경 시 timestamp 업데이트 필수
3. 🟡 상태인 항목은 1개 AI당 최대 2개
4. Dependencies가 ✅ 아니면 시작하지 않는다

---

## 2. DECISIONS.md

### Purpose
설계 및 정책 결정을 기록하여 나중에 "왜 이렇게 했지?" 방지

### Template

```markdown
# 📝 Design Decisions Log

## DEC-001: category 타입 선택
- Date: 2025-01-09
- Decided By: Claude
- Context: tasks.category를 enum vs TEXT 중 선택 필요
- Options Considered:
  1. PostgreSQL ENUM: 타입 안전, 하지만 변경 시 마이그레이션 복잡
  2. TEXT + CHECK: 유연, 하지만 오타 가능
  3. TEXT + 앱 레벨 validation: 가장 유연
- Decision: Option 3 (TEXT + Zod validation)
- Rationale: 
  - i18n 확장 시 카테고리 추가 가능성
  - Zod가 이미 validation layer로 사용 중
- Impact: lib/validation/task.ts에 enum 정의

## DEC-002: Auto-approval 허용 목록
- Date: 2025-01-09
- Decided By: Claude (AI 토론 결과)
- Context: 어떤 태스크에 auto-approval 허용할지
- Decision: backpack, get_dressed, set_alarm만 허용
- Rationale:
  - 이진 결과(했다/안했다)가 명확한 것만
  - clear_dishes, make_bed는 기준이 모호 → parent approval
- Impact: 
  - config/templates/en-US/tasks.json의 approvalType
  - UI에서 auto 선택 시 경고 표시

## Pending Decisions (🔴 Blocked 항목용)

### PENDING-001: 멀티 자녀 태스크 쿼리 패턴
- Question: child_id IS NULL인 태스크를 어떻게 쿼리할지
- Options:
  1. .or(`child_id.is.null,child_id.eq.${childId}`)
  2. DB View 생성
  3. RPC function
- Waiting For: 성능 테스트 결과
- Assigned To: Claude
```

### Rules
1. 모든 결정에는 Rationale(이유) 필수
2. "나중에 바꿀 수 있음"도 결정이다 - 기록한다
3. Pending은 🔴 Blocked 상태와 연결
4. 다른 AI가 결정을 뒤집으려면 새 DEC-XXX로 기록 후 진행

---

## 3. HANDOFF.md

### Purpose
세션 전환 시 현재 상태와 컨텍스트를 전달

### Template

```markdown
# 🔄 HANDOFF
Last Updated: 2025-01-09 15:30 KST
Session Duration: 2h 15m

## Current Session
- Owner: Claude
- Reason for Handoff: API limit reached
- Next Owner: Gemini (AntiGravity)

---

## 🎯 What I Was Doing

### Active Task: API-002 (Task Completion Endpoint)
- File: app/api/tasks/[taskId]/complete/route.ts
- Progress: 70%
- Current State: Zod validation 완료, DB 저장 로직 작성 중

### Code Pointer
```
File: app/api/tasks/[taskId]/complete/route.ts
Line: 45-67
Status: createCompletion 함수 내부 구현 중
```

---

## 🧠 Why I Did It This Way (Critical!)

### 1. Completion 레코드 생성 시점
- 결정: "완료" 버튼 클릭 시 즉시 생성 (pending 상태)
- 이유: 부모가 "대기 목록"에서 볼 수 있어야 함
- 대안 고려: 승인 시 생성 → 거부함 (대기 목록 구현 불가)

### 2. approvalType별 분기 처리
- 결정: switch문으로 분기
- 이유: 각 타입별 로직이 다름 (auto=즉시, timer=검증, parent=대기)
- 향후: Strategy 패턴으로 리팩토링 가능하나 MVP에선 과함

### 3. 포인트 적립 트랜잭션
- 결정: Supabase RPC function 사용 (add_points)
- 이유: 원자성 보장, 중복 적립 방지
- 참조: earnquest-data-model.md의 add_points 함수

---

## ➡️ Next 3 Steps

1. **[30min]** createCompletion 함수 완성
   - DB insert
   - auto_approve_at 계산 (24h 후)
   - 반환 타입 정의

2. **[45min]** approvalType별 분기 구현
   - auto → 즉시 approve_task_completion RPC 호출
   - timer → timerCompleted 검증 후 승인
   - parent → pending 상태로 반환

3. **[30min]** 테스트 & 에러 핸들링
   - 존재하지 않는 taskId
   - 이미 완료된 태스크 (오늘)
   - 권한 없는 childId

---

## ⚠️ Watch Out (주의사항)

1. **RLS 주의**: complete API는 child 본인 또는 parent만 호출 가능
   - 현재 임시로 parent만 허용 중
   - Child auth 구현 후 수정 필요

2. **중복 완료 방지**: 
   - 같은 날 같은 태스크 2번 완료 막아야 함
   - 쿼리: WHERE task_id = X AND child_id = Y AND DATE(requested_at) = TODAY

3. **타이머 검증**:
   - 프론트에서 보내는 timerCompleted를 신뢰하면 안 됨
   - 백엔드에서 시작 시간 기록 → 종료 시 검증 필요 (Phase 2)

---

## 🧪 Test Commands

```bash
# 타입 체크
npm run typecheck

# API 테스트 (curl)
curl -X POST http://localhost:3000/api/tasks/123/complete \
  -H "Content-Type: application/json" \
  -d '{"childId": "abc", "evidence": {}}'

# 전체 테스트
npm run test

# 개발 서버
npm run dev
```

---

## 📂 Files Changed This Session

| File | Status | Notes |
|------|--------|-------|
| app/api/tasks/[taskId]/complete/route.ts | 🟡 70% | 메인 작업 파일 |
| lib/validation/completion.ts | ✅ | Zod 스키마 완료 |
| types/completion.ts | ✅ | 타입 정의 완료 |
| lib/supabase/completions.ts | 🟡 50% | DB 함수 작성 중 |

---

## 🚫 DO NOT

1. ❌ TaskForm.tsx 건드리지 마세요 (별도 작업, LOCK 참조)
2. ❌ RLS 정책 변경하지 마세요 (테스트 중)
3. ❌ add_points RPC 수정하지 마세요 (검증 완료)
```

### Rules
1. 세션 종료 5분 전에 반드시 업데이트
2. "Why I Did It This Way" 섹션은 필수 (최소 2개 항목)
3. Next 3 Steps는 구체적 시간 추정 포함
4. 다음 AI는 HANDOFF.md를 먼저 읽고 시작

---

## 4. CONVENTIONS.md

### Purpose
코드 스타일 일관성 유지 - AI가 바뀌어도 같은 스타일

### Template

```markdown
# 📐 Code Conventions

## TypeScript

### Naming
- Variables/Functions: camelCase
- Components/Types/Interfaces: PascalCase
- Constants: SCREAMING_SNAKE_CASE
- Files: kebab-case.ts (utils), PascalCase.tsx (components)

### Types
- 타입은 types/ 폴더에 분리
- any 사용 금지 (unknown 사용)
- 타입 추론 가능하면 명시 안 함

```typescript
// ✅ Good
const tasks = await getTasks(); // 반환 타입 추론

// ❌ Bad
const tasks: Task[] = await getTasks(); // 불필요한 명시
```

### Functions
- 30줄 이하 권장
- 단일 책임 원칙
- Early return 패턴 사용

```typescript
// ✅ Good
function validateTask(task: Task) {
  if (!task.name) return { error: 'Name required' };
  if (task.points < 1) return { error: 'Points must be positive' };
  return { success: true };
}

// ❌ Bad
function validateTask(task: Task) {
  if (task.name) {
    if (task.points >= 1) {
      return { success: true };
    } else {
      return { error: 'Points must be positive' };
    }
  } else {
    return { error: 'Name required' };
  }
}
```

## React Components

### Structure
```typescript
// 1. Imports
// 2. Types
// 3. Component
// 4. Styles (if any)

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
}

export function TaskCard({ task, onComplete }: TaskCardProps) {
  // hooks first
  const [loading, setLoading] = useState(false);
  
  // handlers
  const handleComplete = async () => {
    setLoading(true);
    await onComplete(task.id);
    setLoading(false);
  };
  
  // render
  return (
    <div>...</div>
  );
}
```

### Props
- Props interface는 컴포넌트 바로 위에
- children 타입: React.ReactNode
- event handlers: on{Event} 패턴

## API Routes

### Structure
```typescript
// app/api/tasks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CreateTaskSchema } from '@/lib/validation/task';

export async function POST(request: NextRequest) {
  try {
    // 1. Parse & Validate
    const body = await request.json();
    const validated = CreateTaskSchema.parse(body);
    
    // 2. Auth Check
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 3. Business Logic
    const result = await createTask(validated);
    
    // 4. Response
    return NextResponse.json(result, { status: 201 });
    
  } catch (error) {
    // 5. Error Handling
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

## Git Commits

### Format
```
[TYPE] Short description

- Detail 1
- Detail 2

Refs: #issue or TASK-ID
```

### Types
- [FEAT] 새 기능
- [FIX] 버그 수정
- [REFACTOR] 리팩토링
- [DOCS] 문서
- [CHECKPOINT] AI 핸드오프용 중간 저장
- [WIP] 작업 중 (push 전용)

### Examples
```
[FEAT] Add task completion API

- POST /api/tasks/:id/complete
- Zod validation
- RLS policy applied

Refs: API-002

---

[CHECKPOINT] Task completion 70% done

- Validation complete
- DB logic in progress
- See HANDOFF.md for details

Refs: API-002
```

## Comments

### When to Comment
- 복잡한 비즈니스 로직
- "왜" 이렇게 했는지 (how는 코드가 설명)
- TODO/FIXME

### Format
```typescript
// ✅ Good: 왜 이렇게 하는지 설명
// 24시간 후 자동 승인을 위해 UTC 기준으로 계산
const autoApproveAt = addHours(new Date(), 24);

// ❌ Bad: 코드가 이미 설명하는 것
// 24시간을 더함
const autoApproveAt = addHours(new Date(), 24);
```

## Forbidden Patterns

1. ❌ any 타입
2. ❌ console.log (개발 중에도 logger 사용)
3. ❌ 하드코딩된 값 (constants.ts로)
4. ❌ 주석 처리된 코드 (삭제하고 git에 맡기기)
5. ❌ // eslint-disable 남용
```

---

## 5. LOCK.md

### Purpose
현재 작업 중이거나 검증 완료된 파일을 다른 AI가 건드리지 않도록 보호

### Template

```markdown
# 🔒 File Lock Status
Last Updated: 2025-01-09 15:30 KST

## 🔴 LOCKED - DO NOT MODIFY

| File | Locked By | Reason | Unlock Condition |
|------|-----------|--------|------------------|
| app/api/tasks/[taskId]/complete/route.ts | Claude | 작업 중 (70%) | API-002 완료 시 |
| lib/supabase/completions.ts | Claude | 작업 중 | API-002 완료 시 |
| supabase/migrations/001_*.sql | Claude | 적용 완료 | Never (히스토리) |

## 🟡 SOFT LOCK - Ask Before Modifying

| File | Owner | Reason | Contact |
|------|-------|--------|---------|
| lib/validation/task.ts | Claude | 참조 중 | HANDOFF.md 확인 |
| types/task.ts | Claude | 참조 중 | HANDOFF.md 확인 |

## 🟢 SAFE TO MODIFY

| File | Last Modified | Verified By | Notes |
|------|---------------|-------------|-------|
| components/tasks/TaskList.tsx | 2025-01-09 | Claude | 테스트 통과 |
| components/tasks/TaskCard.tsx | 2025-01-09 | Claude | 테스트 통과 |
| app/api/tasks/route.ts | 2025-01-09 | Claude | CRUD 완료 |

## 📜 History

| Date | File | Action | By |
|------|------|--------|-----|
| 2025-01-09 14:00 | TaskList.tsx | Unlocked | Claude |
| 2025-01-09 12:00 | TaskList.tsx | Locked | Claude |
| 2025-01-09 10:00 | task.ts (types) | Created | Claude |
```

### Rules
1. 🔴 LOCKED 파일은 절대 수정 금지
2. 🟡 SOFT LOCK은 HANDOFF.md 확인 후 필요시 수정 가능
3. 🟢 SAFE는 자유롭게 수정 (단, CONVENTIONS.md 준수)
4. Lock/Unlock 시 History에 기록

---

## 🔄 AI Collaboration Protocol

### Session Start Checklist

```markdown
□ HANDOFF.md 읽기
□ LOCK.md 확인 - 건드릴 수 없는 파일 파악
□ IMPLEMENTATION_STATUS.md에서 내 작업 확인
□ DECISIONS.md에서 최근 결정 확인
□ CONVENTIONS.md 숙지 (첫 세션이면)
```

### During Session

```markdown
매 30분 또는 파일 3개 변경 시:
□ git commit -m "[CHECKPOINT] {작업 내용}"
□ IMPLEMENTATION_STATUS.md 상태 업데이트

결정 사항 발생 시:
□ DECISIONS.md에 즉시 기록
□ 관련 IMPLEMENTATION_STATUS 항목에 참조 추가
```

### Session End Checklist (5분 전 시작)

```markdown
□ 현재 작업 저장
□ HANDOFF.md 업데이트
  - What I Was Doing
  - Why I Did It This Way (필수!)
  - Next 3 Steps
  - Watch Out
  - Files Changed
□ LOCK.md 업데이트
  - 작업 중 파일 → 🔴 LOCKED
  - 완료된 파일 → 🟢 SAFE
□ IMPLEMENTATION_STATUS.md 업데이트
  - 진행 중 → 🟡 또는 ⏸️
  - 완료 → ✅
□ git commit -m "[CHECKPOINT] Session end - see HANDOFF.md"
□ git push
```

### Conflict Resolution

```markdown
이전 AI의 코드가 이상해 보일 때:
1. DECISIONS.md 확인 - 이유가 있을 수 있음
2. HANDOFF.md의 "Why" 섹션 확인
3. 그래도 이상하면:
   - 새 결정으로 DECISIONS.md에 기록
   - 이전 결정 참조하며 왜 바꾸는지 설명
   - 그 후 수정

절대 금지:
❌ 이유 없이 이전 코드 전체 리팩토링
❌ LOCK된 파일 수정
❌ 결정 기록 없이 구조 변경
```

---

## 📋 Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    AI HANDOFF QUICK REF                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  SESSION START:                                             │
│  1. Read HANDOFF.md                                         │
│  2. Check LOCK.md                                           │
│  3. Find my task in IMPLEMENTATION_STATUS.md                │
│                                                             │
│  DURING WORK:                                               │
│  • Commit every 30min: [CHECKPOINT]                         │
│  • Log decisions in DECISIONS.md                            │
│  • Follow CONVENTIONS.md                                    │
│                                                             │
│  SESSION END (5min before):                                 │
│  1. Update HANDOFF.md (with WHY!)                           │
│  2. Update LOCK.md                                          │
│  3. Update IMPLEMENTATION_STATUS.md                         │
│  4. git push                                                │
│                                                             │
│  NEVER:                                                     │
│  ❌ Modify 🔴 LOCKED files                                  │
│  ❌ Refactor without logging in DECISIONS.md                │
│  ❌ Skip the "Why" section                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 EarnQuest Task System v2 - Initial Status

아래는 Task System v2 구현을 위한 초기 IMPLEMENTATION_STATUS.md 내용이다.

```markdown
# 📊 Implementation Status - Task System v2
Last Updated: 2025-01-09 00:00 KST
Current Owner: (시작 전)

## Phase 1: Database (Day 1)

### DB-001: tasks 테이블 수정
- Status: ⬜
- Owner: TBD
- Files: supabase/migrations/00X_task_v2.sql
- Done Definition:
  - [ ] metadata JSONB 컬럼 추가
  - [ ] category 'life' → 'household' 마이그레이션
  - [ ] 로컬 supabase에서 테스트
  - [ ] npx supabase gen types 실행
- Dependencies: None

### DB-002: task_templates seed
- Status: ⬜
- Owner: TBD
- Files: supabase/seed/task_templates.sql
- Done Definition:
  - [ ] 7 base tasks 삽입
  - [ ] 2 conditional tasks 삽입
  - [ ] Seed 실행 후 SELECT 확인
- Dependencies: DB-001

## Phase 2: Types & Validation (Day 1)

### TYPE-001: Task 타입 정의
- Status: ⬜
- Owner: TBD
- Files: types/task.ts
- Done Definition:
  - [ ] Task interface 정의
  - [ ] TaskMetadata interface 정의
  - [ ] TaskCategory, ApprovalType 타입
  - [ ] npm run typecheck 통과
- Dependencies: DB-001

### TYPE-002: Zod 스키마
- Status: ⬜
- Owner: TBD
- Files: lib/validation/task.ts
- Done Definition:
  - [ ] CreateTaskSchema
  - [ ] UpdateTaskSchema
  - [ ] TaskMetadataSchema
  - [ ] 테스트 케이스 3개 이상
- Dependencies: TYPE-001

## Phase 3: API (Day 2-3)

### API-001: Task CRUD
- Status: ⬜
- Owner: TBD
- Files: app/api/tasks/route.ts, app/api/tasks/[id]/route.ts
- Done Definition:
  - [ ] GET /api/tasks (list)
  - [ ] POST /api/tasks (create)
  - [ ] PATCH /api/tasks/:id (update)
  - [ ] DELETE /api/tasks/:id (soft delete)
  - [ ] RLS 테스트 통과
- Dependencies: TYPE-002

### API-002: Task Completion
- Status: ⬜
- Owner: TBD
- Files: app/api/tasks/[taskId]/complete/route.ts
- Done Definition:
  - [ ] POST 엔드포인트 구현
  - [ ] approvalType별 분기 (auto/timer/checklist/parent)
  - [ ] 중복 완료 방지
  - [ ] 포인트 트랜잭션 (auto 승인 시)
- Dependencies: API-001

### API-003: Approval Endpoints
- Status: ⬜
- Owner: TBD
- Files: app/api/approvals/...
- Done Definition:
  - [ ] GET /api/approvals/pending
  - [ ] POST /api/approvals/:id/approve
  - [ ] POST /api/approvals/:id/fix
  - [ ] POST /api/approvals/batch
  - [ ] 포인트 트랜잭션 연동
- Dependencies: API-002

## Phase 4: Parent UI (Day 4-5)

### UI-001: TaskList & TaskCard
- Status: ⬜
- Owner: TBD
- Files: components/tasks/TaskList.tsx, TaskCard.tsx
- Done Definition:
  - [ ] 카테고리별 그룹핑
  - [ ] 포인트/승인타입 표시
  - [ ] 로딩/에러 상태
- Dependencies: API-001

### UI-002: TaskForm
- Status: ⬜
- Owner: TBD
- Files: components/tasks/TaskForm.tsx
- Done Definition:
  - [ ] Create/Edit 모드
  - [ ] Zod validation 연동
  - [ ] approvalType별 추가 필드
  - [ ] API 연동
- Dependencies: UI-001, TYPE-002

### UI-003: PendingApprovals
- Status: ⬜
- Owner: TBD
- Files: app/[locale]/(app)/approvals/page.tsx
- Done Definition:
  - [ ] 대기 목록 표시
  - [ ] Approve/Fix/Later 액션
  - [ ] BatchApprove 버튼
  - [ ] FixRequestModal
- Dependencies: API-003

## Phase 5: Child UI (Day 6-7)

### UI-004: Child Tasks Page
- Status: ⬜
- Owner: TBD
- Files: app/[locale]/(child)/tasks/page.tsx
- Done Definition:
  - [ ] 오늘 태스크 목록
  - [ ] 완료 버튼
  - [ ] TimerModal
  - [ ] ChecklistModal
  - [ ] 축하 애니메이션
- Dependencies: API-002

## Phase 6: Onboarding (Day 8)

### UI-005: Preset Selection
- Status: ⬜
- Owner: TBD
- Files: components/onboarding/PresetSelector.tsx
- Done Definition:
  - [ ] 4개 프리셋 표시
  - [ ] 추천 하이라이트
  - [ ] 태스크 미리보기
  - [ ] Conditional questions
  - [ ] Bulk task 생성
- Dependencies: API-001
```

---

*AI Collaboration Handoff System v2.0*
*For EarnQuest Development*