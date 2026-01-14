# EarnQuest PRD v2.0 - Changelog & Updates

> v1.0 → v2.0 변경사항 요약 (AI 토론 결과 반영)

**Version**: 2.0  
**Date**: 2025-01-09  
**Contributors**: Peter + Claude + Grok + Perplexity + Gemini + GPT

---

## Executive Summary

Task System에 대한 4개 AI (Grok, Perplexity, Gemini, GPT)의 비판적 검토 결과를 반영하여 PRD를 업데이트합니다.

### 핵심 변경 요약

| 영역 | v1.0 | v2.0 | 변경 이유 |
|------|------|------|-----------|
| **카테고리** | learning, life, health | learning, **household**, health | "Life"가 모호, "Household"가 가사 책임을 명확히 표현 |
| **Auto-approval** | 4개 태스크 | **2개만** (backpack, get_dressed) | 치팅 방지, 부모 신뢰 붕괴 방지 |
| **디폴트 태스크** | 5개 | **7개 base + 2개 conditional** | 다양성 확보, US 시장 맞춤 |
| **프리셋** | 3개 | **4개** (Screen Time Peace 추가) | 스크린 갈등이 주요 pain point |
| **Multi-child** | child_id nullable | 유지 + **Phase 2 확장 계획** | MVP 단순성 vs 미래 확장성 균형 |
| **메타데이터** | 없음 | **metadata JSONB** 추가 | 미래 확장 (AI, 연동, 분석) |

---

## 1. Category Changes

### 1.1 Rename: `life` → `household`

```diff
- type TaskCategory = 'learning' | 'life' | 'health';
+ type TaskCategory = 'learning' | 'household' | 'health';
```

**이유:**
- Gemini: "Life"는 너무 추상적, 미국 부모들은 "Household responsibilities"로 인식
- "Household"가 가사, 정리, 책임을 더 명확히 표현
- UI 아이콘/라벨도 더 직관적 (🏠 Household vs 🌱 Life)

### 1.2 Social/Kindness는 별도 유지

```
결정: 4번째 카테고리 추가 안 함

Gemini가 "Social & Kindness" 카테고리 추가를 제안했으나,
Grok 지적대로 Proposal §5의 Kindness System이 이미 존재.

친사회적 행동은 포인트 태스크가 아닌 "인정 시스템"으로 처리:
- 감사 카드
- 친절 배지
- 주간 서프라이즈 보너스
```

---

## 2. Approval System Changes

### 2.1 Auto-approval 대폭 축소

```diff
# v1.0 Auto-approval 태스크
- Make bed (15 pts)
- Clear dishes (20 pts)
- Brush teeth (10 pts)
- Put away backpack (15 pts)

# v2.0 Auto-approval 태스크 (2개만)
+ Put away backpack & shoes (15 pts)  # 있거나 없거나, 명확
+ Get dressed by yourself (10 pts)    # 5-7세용, 명확

# v2.0 변경된 승인 방식
- Make bed → checklist
- Clear dishes → parent
- Brush teeth → checklist (AM/PM)
```

**이유 (Perplexity 시나리오):**
```
Day 1:  Anna clears dishes → auto ✓ (부모 지켜봄)
Day 5:  Anna 까먹고 "done" → auto ✗ (부모 안 봄)
Day 12: 패턴 붕괴 → 부모가 모든 태스크 수동 확인
        → 마찰 증가 → 앱 이탈
```

### 2.2 Approval Type Safety Matrix

| Type | 안전한 태스크 | 위험한 태스크 |
|------|--------------|--------------|
| **auto** | backpack, get_dressed | ❌ dishes, make_bed |
| **timer** | reading, exercise, practice | - |
| **checklist** | brush_teeth, make_bed | - |
| **parent** | homework, clean_room, dishes | - |

---

## 3. Default Tasks Changes

### 3.1 Base Tasks (5개 → 7개)

```diff
# v1.0 (5개)
- Homework (50)
- Reading (30)
- Make bed (15)
- Clear dishes (20)
- Exercise (40)

# v2.0 (7개)
+ Homework (50, parent)
+ Reading 20min (30, timer)
+ Make bed (15, checklist)        # auto → checklist
+ Clear dishes (20, parent)       # auto → parent
+ Put away backpack (15, auto)    # NEW
+ Brush teeth AM/PM (10, checklist)  # NEW (명시적)
+ Exercise 30min (40, timer)
```

### 3.2 Conditional Tasks (NEW)

```typescript
// 온보딩 시 질문 기반 추가
const CONDITIONAL_TASKS = [
  {
    key: 'feed_pet',
    condition: { question: 'hasPet', label: 'Do you have pets?' },
    points: 20,
    approvalType: 'parent',
  },
  {
    key: 'practice_instrument',
    condition: { question: 'hasInstrument', label: 'Play an instrument?' },
    points: 30,
    approvalType: 'timer',
    timerMinutes: 20,
  },
];
```

**이유:**
- Gemini: 66% 미국 가정에 반려동물 → 디폴트 필수
- Grok: 34% 없는 가정에 "나는 못하네" 느낌 → conditional로 타협

### 3.3 Age-Specific Tasks

**5-7세 추가:**
- Pick up toys (15, parent)
- Get dressed by yourself (10, auto)

**12-14세 추가:**
- Help with laundry (25, parent)
- Study session 45min (60, timer)

### 3.4 Points Balance Verification

```
v2.0 Base Tasks (7개):
50 + 30 + 15 + 20 + 15 + 10 + 40 = 180 pts (max)

현실적 완료 (5-6개/day): 100-140 pts ✅

목표: 하루 열심히 하면 게임 30분 (100 pts) 가능
```

---

## 4. Onboarding Presets Changes

### 4.1 Presets (3개 → 4개)

```diff
# v1.0
- Quick Start (3 tasks)
- Balanced (6 tasks)
- Learning Focus (5 tasks)

# v2.0
+ Busy Parent (3 tasks)          # 이름 변경
+ Balanced Growth (7 tasks) ⭐    # 확대
+ Academic First (5 tasks)       # 이름 변경
+ Screen Time Peace (4 tasks)    # NEW
```

### 4.2 Screen Time Peace Preset (NEW)

```typescript
{
  key: 'screen',
  name: 'Screen Time Peace',
  tagline: 'Reduce screen time conflicts',
  taskKeys: ['homework', 'clear_dishes', 'brush_teeth', 'exercise'],
  expectedDailyPoints: { min: 80, max: 120 },
  screenBudgetWeeklyMinutes: 180,  // 3시간 (strict)
}
```

**이유 (Perplexity):**
- 미국 부모 최대 pain point = 스크린 타임 갈등
- 타이트한 스크린 예산 → 태스크 완료 동기부여 ↑

### 4.3 Onboarding Flow Changes

```diff
# v1.0
Step 1: Child Info
Step 2: Style Selection (3 presets)
Step 3: Family Values (optional)
Step 4: Done

# v2.0
Step 1: Child Info
Step 2: Quick Questions (NEW)
  - "Do you have pets?"
  - "Play an instrument?"
  - "What's your main goal?" → preset 추천
Step 3: Preset Selection (4 presets, with recommendation)
Step 4: Preview & Confirm
```

---

## 5. Multi-child Assignment

### 5.1 MVP: 현행 유지

```typescript
// child_id nullable 유지
interface Task {
  childId: string | null;  // null = all children
}
```

**이유:**
- 8주 MVP에서 many-to-many = 리스크
- 미국 평균 자녀 수 1.9명 → 대부분 케이스 커버
- 3자녀+ 필요 시 태스크 복제로 회피

### 5.2 Phase 2: 확장 계획 명시

```sql
-- Phase 2: task_assignments 테이블
CREATE TABLE task_assignments (
  task_id UUID REFERENCES tasks(id),
  child_id UUID REFERENCES children(id),
  PRIMARY KEY (task_id, child_id)
);
```

### 5.3 Sibling Visibility: 기존 유지

```
Child View:
✅ 자신의 태스크/포인트만
❌ 형제 정보 절대 노출 금지

Parent View:
✅ 모든 자녀 정보 접근 가능
```

---

## 6. Data Model Changes

### 6.1 tasks 테이블 변경

```diff
CREATE TABLE tasks (
  ...
- category VARCHAR(20) NOT NULL,  -- learning, life, health
+ category VARCHAR(20) NOT NULL,  -- learning, household, health
  
  ...
  
+ -- v2 NEW: 확장용 메타데이터
+ metadata JSONB DEFAULT '{}',
);
```

### 6.2 metadata JSONB 구조

```typescript
interface TaskMetadata {
  subcategory?: string;           // 'homework', 'cleaning', etc.
  tags?: string[];                // ['school', 'daily']
  
  // Phase 3+
  source?: {
    type: 'manual' | 'ai_photo' | 'ai_text' | 'integration';
    originalImage?: string;
    aiExtracted?: boolean;
    integrationApp?: string;
  };
  
  learning?: {
    subject?: string;             // 'math', 'reading'
    difficulty?: number;          // 1-5
  };
}
```

**이유 (Grok + Gemini):**
- Nullable 컬럼 여러 개 추가 → 스키마 더러워짐
- JSONB 1개 → 유연한 확장, 마이그레이션 최소화
- PostgreSQL JSONB 인덱싱 강력

---

## 7. Fix Request Templates (NEW)

### 7.1 태스크별 템플릿

```typescript
const FIX_TEMPLATES = {
  clean_room: [
    { key: 'floor', icon: '👕', text: 'Please pick up clothes from the floor' },
    { key: 'desk', icon: '📚', text: 'Your desk needs a bit more organizing' },
    { key: 'bed', icon: '🛏️', text: "Don't forget to make your bed" },
  ],
  homework: [
    { key: 'check', icon: '✅', text: 'Double-check your answers' },
    { key: 'handwriting', icon: '✍️', text: 'Try to write a bit neater' },
  ],
  clear_dishes: [
    { key: 'rinse', icon: '💧', text: 'Please rinse the dishes' },
    { key: 'wipe', icon: '🧽', text: 'Wipe down the table too' },
  ],
  default: [
    { key: 'almost', icon: '💪', text: 'Almost there! Just a bit more' },
    { key: 'retry', icon: '🔄', text: 'Give it another try' },
  ],
};
```

---

## 8. Edge Cases Addressed

| Case | v1.0 | v2.0 |
|------|------|------|
| 하루 2회 태스크 (양치) | 불명확 | Checklist 타입 (AM/PM) |
| 형제 공동 태스크 | 불명확 | 태스크 복제 권장 (MVP) |
| 부모 미승인 24h | 자동 승인 | 유지 |
| Fix 3회 이상 반복 | 불명확 | 태스크 재정의 권장 |
| 휴가/병가 | 미지원 | Phase 2 Pause 기능 |

---

## 9. Files Changed/Added

### New Files

| File | Description |
|------|-------------|
| `config/templates/en-US/tasks.json` | 디폴트 태스크 + 프리셋 정의 |
| `earnquest-task-feature-spec-v2.md` | 태스크 기능 상세 스펙 |

### Modified Sections in PRD

| Section | Changes |
|---------|---------|
| §3.6.1 Default Tasks | 7개로 확대, approval type 수정 |
| §6.2 Task System | Auto-approval 가이드라인 추가 |
| §5.2 Task Templates | metadata 컬럼 추가 |
| §11 Onboarding | 4개 프리셋, conditional questions |

---

## 10. Implementation Priority

### MVP Must-Have

1. ✅ Category 변경 (life → household)
2. ✅ Auto-approval 제한 (2개만)
3. ✅ 7개 base tasks + seed
4. ✅ 4개 프리셋 + 선택 UI
5. ✅ metadata JSONB 컬럼

### Phase 2

1. Conditional tasks (pet, instrument)
2. task_assignments 테이블
3. Vacation/Pause 기능
4. Trust Level 연동

### Phase 3+

1. AI 태스크 생성 (사진 → 태스크)
2. 앱 연동 (Artales, Duolingo)
3. 학습 메타데이터 분석

---

## 11. AI Feedback Attribution

| AI | 주요 기여 |
|----|----------|
| **Grok** | Auto-approval 위험성, JSONB 권장, Kindness 분리 유지 |
| **Perplexity** | 치팅 시나리오, 태스크 다양성 (7개), Screen Time Peace |
| **Gemini** | US 시장 인사이트 (pet 66%), Many-to-many 필요성, Household 네이밍 |
| **GPT** | Fast Track 접근, 속도 vs 품질 균형, 구현 지시서 구조 |

---

*EarnQuest PRD v2.0 Changelog*
*Updated: 2025-01-09*
