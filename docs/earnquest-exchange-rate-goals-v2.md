# EarnQuest - 포인트 환율 시스템 및 목표(Goal) 확장

## 📋 작업 개요

EarnQuest에 포인트 환율 시스템을 추가하고, 기존 Goal 시스템에 마일스톤 보너스 기능을 확장합니다.

**핵심 변경사항:**
1. **환율 시스템 추가**: 부모용 "$ ↔ pts" 계산 가이드 (디폴트 $1 = 100 pts)
2. **Goal 시스템 확장**: 마일스톤 보너스, 부모 매칭, $ 가치 표시 (부모 전용)
3. **포인트 2배 조정**: 모든 태스크/리워드 포인트 값 × 2
4. **"Save Towards Game" 제거**: Goal 시스템으로 대체

---

## 📚 필수 참조 문서

**프로젝트 문서:**
- `/mnt/project/docs/earnquest-prd-final.md` - 제품 요구사항
- `/mnt/project/docs/earnquest-data-model.md` - 데이터베이스 스키마

**기존 코드 (반드시 확인):**
- `/mnt/project/supabase/migrations/034_goals_system.sql` - 기존 Goal 시스템
- `/mnt/project/lib/config/task-templates.ts` - 현재 태스크 템플릿 (18개)
- `/mnt/project/lib/utils/tiers.ts` - 현재 Tier 범위
- `/mnt/project/components/goals/` - 기존 Goal 컴포넌트

**스킬:**
- `/mnt/skills/public/vercel-react-best-practices/SKILL.md` - 반드시 먼저 읽고 적용

---

## 🎯 현재 시스템 분석

### 현재 태스크 템플릿 (18개) - `task-templates.ts` 기준

| Time Context | Template Key | 현재 포인트 | 변경 후 (×2) |
|--------------|--------------|------------|-------------|
| **Morning** | wake_on_time | 10 | 20 |
| | make_bed | 10 | 20 |
| | brush_morning | 10 | 20 |
| **After School** | backpack_shoes | 15 | 30 |
| | lunchbox_sink | 5 | 10 |
| | check_planner | 10 | 20 |
| | wash_hands | 5 | 10 |
| **Evening** | prep_tomorrow | 15 | 30 |
| | brush_evening | 10 | 20 |
| | shower | 15 | 30 |
| **Anytime** | homework | 30 | 60 |
| | reading | 25 | 50 |
| | writing | 25 | 50 |
| | clean_desk | 15 | 30 |
| | exercise | 25 | 50 |
| | outdoor | 20 | 40 |
| | instrument | 30 | 60 |
| | art | 20 | 40 |

**현재 하루 평균**: ~100-120 pts → **변경 후**: ~200-240 pts

### 현재 리워드 템플릿 (17개) - DB 기준

| Category | Name | 현재 포인트 | 변경 후 (×2) |
|----------|------|------------|-------------|
| **Screen** | 30 Minutes Screen Time | 150 | 300 |
| | 1 Hour Screen Time | 280 | 560 |
| | Weekend Movie Night | 400 | 800 |
| **Autonomy** | Pick Tonight's Dinner | 200 | 400 |
| | Pick Family Movie/Show | 80 | 160 |
| **Experience** | Ice Cream Trip | 300 | 600 |
| | Park Playdate | 350 | 700 |
| | Movie Theater | 600 | 1200 |
| | Mini Golf Outing | 500 | 1000 |
| | Museum Visit | 550 | 1100 |
| **Savings** | Save Towards Game | 800 | ~~삭제~~ |
| | Save to Bank | 150 | 300 |
| **Item (en-US)** | $10 Gift Card | 500 | 1000 |
| | $20 Gift Card | 1000 | 2000 |
| | $50 Gift Card | 2500 | 5000 |
| **Item (ko-KR)** | ₩10,000 기프트 카드 | 500 | 1000 |
| | ₩20,000 기프트 카드 | 1000 | 2000 |
| | ₩50,000 기프트 카드 | 2500 | 5000 |

**변경 후 리워드 개수**: 16개 (Save Towards Game 제거)

### 현재 Goal 시스템 (이미 존재)

**테이블:**
- `goals` - target_points, current_points, tier, is_completed, change_log
- `goal_deposits` - amount, balance_after

**함수:**
- `deposit_to_goal()` - 포인트 저축
- `withdraw_from_goal()` - 포인트 인출
- `update_goal_target()` - 목표 변경 (사유 필수)

**뷰:**
- `v_child_goals` - 진행률 포함

**없는 것 (이번에 추가):**
- `real_value_cents` - $ 가치 (부모 전용)
- `milestone_bonuses` - 마일스톤 보너스
- `parent_contribution_cents` - 부모 매칭

### 현재 Tier 범위 - `tiers.ts` 기준

```typescript
// 현재 범위
small: { min: 50, max: 100 }
medium: { min: 100, max: 200 }
large: { min: 200, max: 500 }
xl: { min: 500, max: Infinity }

// 변경 후 (×2)
small: { min: 100, max: 200 }
medium: { min: 200, max: 400 }
large: { min: 400, max: 1000 }
xl: { min: 1000, max: Infinity }
```

---

## 🎯 환율 시스템 설계

### 핵심 원칙

1. **환율 = 계산 도우미** (부모용 가이드)
2. **실제 포인트 값은 독립적** (환율 바꿔도 기존 데이터 안 건드림)
3. **온보딩 때 선택 + 이후 변경 가능** (단, 경고 표시)

### 환율 옵션

| 환율 | 설명 | 예시 |
|-----|------|-----|
| $1 = 10 pts | 숫자 작게 | $10 = 100 pts |
| $1 = 20 pts | | $10 = 200 pts |
| $1 = 50 pts | | $10 = 500 pts |
| **$1 = 100 pts** | **디폴트** | **$10 = 1000 pts** |
| $1 = 200 pts | 숫자 크게 | $10 = 2000 pts |

### 환율 사용 시나리오

**부모가 새 리워드 만들 때:**
```
┌─────────────────────────────────────┐
│ 실제 비용 (선택)                     │
│ $ [6.00            ]                │
│                                     │
│ 포인트 (자동 계산)                   │
│ [600              ] pts             │
│   ↑ 환율 $1 = 100 pts 기준          │
│                                     │
│ 💡 약 3일 노력 필요 (하루 200 pts)   │
└─────────────────────────────────────┘
```

**환율 변경 시 경고:**
```
⚠️ 환율 변경

현재: $1 = 100 pts → 변경: $1 = 50 pts

• 기존 태스크/리워드 포인트는 유지됩니다
• 아이의 포인트 잔액도 유지됩니다
• 새로 만드는 항목에만 계산 가이드로 적용됩니다

[취소]  [변경하기]
```

### 부모/아이 뷰 분리

**부모 대시보드에만 표시:**
- 환율 ($1 = X pts)
- $ 환산 ("Ice Cream Trip - 600 pts ($6)")
- real_value_cents
- 경제 가이드 ("약 3일 노력 필요")

**아이 뷰에서 완전 제거:**
- $ 금액 일절 표시 안 함
- 환율 정보 없음
- 포인트만 표시 (600 pts)

---

## 🎯 Goal 시스템 확장

### 기존 테이블 확장

```sql
-- goals 테이블에 추가
ALTER TABLE goals ADD COLUMN real_value_cents INT;
ALTER TABLE goals ADD COLUMN parent_contribution_cents INT DEFAULT 0;
ALTER TABLE goals ADD COLUMN milestone_bonuses JSONB DEFAULT '{}';
-- 예: {"25": 1000, "50": 2000, "75": 3000}
```

### 마일스톤 보너스 로직

```
목표: Meta Quest 3
포인트: 40,000 pts ($400, 1:100 환율)

마일스톤 설정 (부모가 설정):
• 25% (10,000 pts): +1,000 pts 보너스
• 50% (20,000 pts): +2,000 pts 보너스
• 75% (30,000 pts): +3,000 pts 보너스

실제 필요 포인트: 40,000 - 6,000 = 34,000 pts
```

### 마일스톤 체크 함수

```sql
-- deposit_to_goal 함수 수정 필요
-- 저축 후 마일스톤 도달 시 보너스 자동 지급
-- goal_deposits에 type 컬럼 추가: 'deposit' | 'milestone_bonus'
```

### Goal 생성 UI (부모)

```
┌─────────────────────────────────────────┐
│ 새 목표 만들기                          │
│                                         │
│ 목표 이름                               │
│ [Meta Quest 3         ]                 │
│                                         │
│ 실제 가격 (선택)                        │
│ $ [400.00           ]                   │
│                                         │
│ 목표 포인트 (자동 계산)                  │
│ [40,000            ] pts                │
│   ↑ 환율 $1 = 100 pts 기준              │
│                                         │
│ 📊 예상 달성 기간                       │
│ 하루 200 pts 기준 → 약 200일 (6.5개월)  │
│                                         │
│ 🎯 마일스톤 보너스 (선택)               │
│ ☑ 25% 달성 시: [1000    ] pts          │
│ ☑ 50% 달성 시: [2000    ] pts          │
│ ☑ 75% 달성 시: [3000    ] pts          │
│                                         │
│ 보너스 포함 시: 34,000 pts → 170일      │
│                                         │
│ [취소]  [만들기]                        │
└─────────────────────────────────────────┘
```

### Goal 표시 UI (아이)

```
┌─────────────────────────────────────────┐
│ 🎯 Meta Quest 3                         │
│                                         │
│ ████████████░░░░░░░░░░░░ 52%           │
│ 20,800 / 40,000 pts                     │
│                                         │
│ ✅ 25% 마일스톤 달성! (+1,000 pts)      │
│ ✅ 50% 마일스톤 달성! (+2,000 pts)      │
│ ⬜ 75% 마일스톤 (30,000 pts까지 9,200)  │
│                                         │
│ [💰 포인트 저축하기]                    │
└─────────────────────────────────────────┘
```

---

## 🏗️ 구현 범위

### Phase 1: Database & Types

**1. Supabase Migrations:**

```sql
-- 055_add_exchange_rate.sql
ALTER TABLE families
ADD COLUMN point_exchange_rate INT NOT NULL DEFAULT 100;

COMMENT ON COLUMN families.point_exchange_rate IS
'Point exchange rate for parent display. $1 = X pts. Default 100.';

-- 056_add_reward_real_value.sql
ALTER TABLE rewards
ADD COLUMN real_value_cents INT;

COMMENT ON COLUMN rewards.real_value_cents IS
'Real dollar value in cents. For parent display only.';

-- 057_extend_goals_milestones.sql
ALTER TABLE goals ADD COLUMN real_value_cents INT;
ALTER TABLE goals ADD COLUMN parent_contribution_cents INT DEFAULT 0;
ALTER TABLE goals ADD COLUMN milestone_bonuses JSONB DEFAULT '{}';

ALTER TABLE goal_deposits ADD COLUMN type TEXT DEFAULT 'deposit'
  CHECK (type IN ('deposit', 'milestone_bonus', 'parent_match'));

-- 058_update_deposit_function.sql
-- deposit_to_goal 함수 수정 - 마일스톤 체크 로직 추가

-- 059_double_template_points.sql
-- task_templates, reward_templates 포인트 ×2

-- 060_remove_save_towards_game.sql
DELETE FROM reward_templates WHERE name = 'Save Towards Game';
```

**2. TypeScript Types 업데이트:**

```typescript
// lib/types/family.ts
interface Family {
  // ... existing
  point_exchange_rate: number; // 디폴트 100
}

// lib/types/reward.ts
interface Reward {
  // ... existing
  real_value_cents?: number; // 부모 전용
}

// lib/types/goal.ts
interface Goal {
  // ... existing (034_goals_system.sql 기반)
  real_value_cents?: number;
  parent_contribution_cents?: number;
  milestone_bonuses?: {
    25?: number;
    50?: number;
    75?: number;
  };
}

interface GoalDeposit {
  // ... existing
  type: 'deposit' | 'milestone_bonus' | 'parent_match';
}
```

**3. Utility Functions:**

```typescript
// lib/utils/exchange-rate.ts

export function calculatePoints(
  dollarValue: number,
  exchangeRate: number = 100
): number {
  return Math.round(dollarValue * exchangeRate);
}

export function calculateDollarValue(
  points: number,
  exchangeRate: number = 100
): number {
  return points / exchangeRate;
}

export function formatDollarValue(
  points: number,
  exchangeRate: number = 100
): string {
  const dollars = calculateDollarValue(points, exchangeRate);
  return `$${dollars.toFixed(2)}`;
}

export function calculateDaysNeeded(
  points: number,
  dailyAverage: number = 200
): number {
  return Math.ceil(points / dailyAverage);
}

// lib/utils/milestones.ts

export function checkMilestoneReached(
  oldPoints: number,
  newPoints: number,
  targetPoints: number,
  milestones?: Record<number, number>
): { reached: boolean; milestone?: number; bonus?: number } {
  if (!milestones) return { reached: false };

  const oldPercentage = (oldPoints / targetPoints) * 100;
  const newPercentage = (newPoints / targetPoints) * 100;

  for (const [milestone, bonus] of Object.entries(milestones)) {
    const m = Number(milestone);
    if (oldPercentage < m && newPercentage >= m) {
      return { reached: true, milestone: m, bonus };
    }
  }

  return { reached: false };
}

export function getNextMilestone(
  currentPoints: number,
  targetPoints: number,
  milestones?: Record<number, number>
): { milestone: number; pointsNeeded: number; bonus: number } | null {
  if (!milestones) return null;

  const currentPercent = (currentPoints / targetPoints) * 100;
  const sortedMilestones = Object.entries(milestones)
    .map(([m, b]) => ({ milestone: Number(m), bonus: b }))
    .sort((a, b) => a.milestone - b.milestone);

  for (const { milestone, bonus } of sortedMilestones) {
    if (currentPercent < milestone) {
      const pointsNeeded = Math.ceil((milestone / 100) * targetPoints) - currentPoints;
      return { milestone, pointsNeeded, bonus };
    }
  }

  return null;
}
```

### Phase 2: 부모 대시보드 UI

**1. 환율 설정 페이지:**

```typescript
// app/[locale]/(app)/settings/points/page.tsx

export default function PointsSettingsPage() {
  // 환율 표시 (10, 20, 50, 100, 200)
  // 환율 변경 UI + 경고 모달
  // 현재 환율 기준 가이드
}
```

**2. 리워드 생성/편집 확장:**

```typescript
// components/parent/RewardFormDialog.tsx 수정

// $ 입력 필드 추가
// 포인트 자동 계산
// 경제 가이드 컴포넌트 추가
```

**3. 태스크 생성/편집 확장:**

```typescript
// components/parent/TaskFormDialog.tsx 수정

// $ 환산 표시 (읽기 전용)
// 경제 가이드 표시
```

**4. Goal 생성 확장:**

```typescript
// components/parent/GoalFormDialog.tsx 수정

// $ 입력 → 포인트 자동 계산
// 예상 달성 기간 표시
// 마일스톤 보너스 설정 UI
// 부모 매칭 옵션 (선택)
```

### Phase 3: 아이 뷰 UI

**1. $ 정보 완전 제거:**

```typescript
// 확인 필요한 컴포넌트:
// - components/child/TicketsClientPage.tsx
// - components/store/RewardCard.tsx
// - components/goals/GoalCard.tsx

// 모든 $ 관련 표시 제거
// 포인트만 표시
```

**2. Goal 마일스톤 표시:**

```typescript
// components/goals/GoalCard.tsx 수정

// 달성한 마일스톤 ✅ 표시
// 다음 마일스톤까지 남은 포인트
// 마일스톤 보너스 표시
```

**3. 마일스톤 축하 모달:**

```typescript
// components/goals/MilestoneModal.tsx (신규)

// 축하 메시지
// 보너스 포인트 표시
// 애니메이션 (confetti?)
```

### Phase 4: API 업데이트

```typescript
// app/api/goals/[id]/deposit/route.ts 수정
// 마일스톤 체크 로직 추가
// 보너스 자동 지급

// app/api/family/settings/route.ts 수정
// 환율 변경 API

// app/api/rewards/route.ts 수정
// real_value_cents 저장
```

### Phase 5: 템플릿 업데이트

**1. task-templates.ts:**
모든 포인트 값 ×2

**2. reward_templates (DB):**
마이그레이션으로 모든 포인트 값 ×2

**3. tiers.ts:**
```typescript
export const TIER_RANGES: Record<Tier, TierRange> = {
  small: { min: 100, max: 200 },
  medium: { min: 200, max: 400 },
  large: { min: 400, max: 1000 },
  xl: { min: 1000, max: Infinity },
};
```

---

## ⚠️ 중요 주의사항

### 1. 기존 Goal 시스템 유지

`034_goals_system.sql`의 기존 구조를 **확장**만 함:
- 기존 `deposit_to_goal()` 함수 수정 (교체 X)
- 기존 `goal_deposits` 테이블에 컬럼만 추가
- 기존 RLS 정책 유지

### 2. 마이그레이션 순서

```
1. families 테이블에 point_exchange_rate 추가
2. rewards 테이블에 real_value_cents 추가
3. goals 테이블에 새 컬럼들 추가
4. goal_deposits에 type 컬럼 추가
5. deposit_to_goal 함수 수정
6. task_templates 포인트 ×2
7. reward_templates 포인트 ×2
8. "Save Towards Game" 제거
9. tiers.ts 범위 조정
```

### 3. 기존 사용자 데이터

**영향 없음:**
- 기존 `children.points_balance` 유지
- 기존 `goals.current_points` 유지
- 기존 `goals.target_points` 유지

**이유:** 환율은 "표시용 가이드"일 뿐, 실제 포인트 값은 독립적

### 4. 부모/아이 뷰 완전 분리

테스트 필수:
- [ ] 아이 뷰에서 $ 금액 표시 없음
- [ ] 아이 뷰에서 환율 정보 없음
- [ ] 부모 뷰에서 $ 환산 표시
- [ ] 부모 뷰에서 경제 가이드 표시

---

## 📝 체크리스트

### 구현 전
- [ ] `/mnt/skills/public/vercel-react-best-practices/SKILL.md` 읽음
- [ ] `034_goals_system.sql` 분석 완료
- [ ] `task-templates.ts` 현재 포인트 확인
- [ ] `tiers.ts` 현재 범위 확인
- [ ] 기존 Goal 컴포넌트 분석

### Phase 1 완료
- [ ] 모든 마이그레이션 성공
- [ ] 타입 정의 업데이트
- [ ] 유틸리티 함수 작성
- [ ] 테스트 데이터로 검증

### Phase 2-3 완료
- [ ] 환율 설정 UI 작동
- [ ] 리워드/태스크 생성 시 $ 가이드 표시
- [ ] Goal 마일스톤 설정 UI 작동
- [ ] 아이 뷰에서 $ 정보 완전 제거

### Phase 4-5 완료
- [ ] 마일스톤 보너스 자동 지급
- [ ] 모든 템플릿 포인트 ×2
- [ ] Tier 범위 ×2
- [ ] "Save Towards Game" 제거

### 최종 테스트
- [ ] 새 가족 온보딩: 디폴트 환율 100
- [ ] 환율 변경: 기존 데이터 유지 확인
- [ ] Goal 생성: $ 입력 → 포인트 자동 계산
- [ ] Goal 저축: 마일스톤 도달 시 보너스 지급
- [ ] 마일스톤 축하 모달 표시
- [ ] 아이 뷰: $ 정보 없음 확인

---

## 💬 참고사항

1. **Supabase 연결 확인** 후 마이그레이션 실행
2. **기존 테스트 데이터**는 포인트 조정 영향 없음 (새 템플릿만 적용)
3. **Goal 이미지 업로드**는 이번 범위 아님 (기존 icon 사용)
4. **부모 매칭(parent_contribution_cents)**은 컬럼만 추가, UI는 Phase 2에서 구현

---

시작 명령어:
```bash
# Plan 모드로 상세 구현 계획 수립
claude --plan
```
