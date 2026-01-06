# EarnQuest - Data Model v1.0

> 확장성과 유연성을 고려한 Supabase/PostgreSQL 스키마 설계

---

## 설계 원칙

1. **JSONB 활용**: 메타데이터, 커스텀 설정은 JSONB로 저장 (스키마 변경 최소화)
2. **Soft Delete**: 실제 삭제 대신 `deleted_at` 사용
3. **Audit Trail**: 모든 테이블에 `created_at`, `updated_at`
4. **Row Level Security**: 가족별 데이터 격리
5. **확장 가능한 Enum**: 카테고리는 별도 테이블 또는 체크 제약조건
6. **다국어 준비**: 시스템 텍스트는 key로 저장

---

## ERD 개요

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   families  │────<│    users    │────<│   children  │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
            ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
            │    tasks    │           │   rewards   │           │  kindness   │
            └─────────────┘           └─────────────┘           │   _cards    │
                    │                         │                 └─────────────┘
                    ▼                         ▼
            ┌─────────────┐           ┌─────────────┐
            │    task_    │           │   reward_   │
            │ completions │           │  purchases  │
            └─────────────┘           └─────────────┘

            ┌─────────────┐           ┌─────────────┐
            │    app_     │           │   weekly_   │
            │integrations │           │  summaries  │
            └─────────────┘           └─────────────┘
```

---

## 테이블 정의

### 1. families (가족 계정)

```sql
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,                    -- "김씨 가족"
  
  -- 설정 (JSONB로 유연하게)
  settings JSONB DEFAULT '{
    "timezone": "Asia/Seoul",
    "language": "ko",
    "weekStartsOn": "monday",
    "autoApprovalHours": 24,
    "screenBudgetWeeklyMinutes": 300
  }'::jsonb,
  
  -- 구독 정보
  subscription_tier VARCHAR(20) DEFAULT 'free', -- free, premium
  subscription_expires_at TIMESTAMPTZ,
  
  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_families_deleted_at ON families(deleted_at) WHERE deleted_at IS NULL;
```

### 2. users (부모 계정)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),  -- Supabase Auth 연동
  family_id UUID REFERENCES families(id),
  
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'parent',              -- parent, admin
  avatar_url TEXT,
  
  -- 설정
  settings JSONB DEFAULT '{
    "notifications": {
      "taskCompletion": true,
      "weeklyReport": true,
      "rewardPurchase": true
    }
  }'::jsonb,
  
  -- 메타
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_users_family_id ON users(family_id);
CREATE INDEX idx_users_email ON users(email);
```

### 3. children (자녀)

```sql
CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  
  name VARCHAR(100) NOT NULL,
  age_group VARCHAR(10) NOT NULL,                 -- '5-7', '8-11', '12-14'
  birth_year INT,                                 -- 선택적
  avatar_url TEXT,
  pin_code VARCHAR(4),                            -- 아이 로그인용 PIN (선택)
  
  -- 포인트
  points_balance INT DEFAULT 0,
  points_lifetime_earned INT DEFAULT 0,
  
  -- 신뢰 레벨 (§7)
  trust_level INT DEFAULT 1,                      -- 1, 2, 3
  trust_streak_days INT DEFAULT 0,                -- 연속 정직 일수
  
  -- 설정
  settings JSONB DEFAULT '{
    "weeklyGoal": 500,
    "screenBudgetUsedThisWeek": 0
  }'::jsonb,
  
  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 인덱스
CREATE INDEX idx_children_family_id ON children(family_id);
CREATE INDEX idx_children_age_group ON children(age_group);
```

### 4. task_templates (태스크 템플릿 - 시스템 제공)

```sql
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 분류
  category VARCHAR(20) NOT NULL,                  -- learning, life, health
  age_group VARCHAR(10),                          -- null = 전체, '8-11' = 특정
  
  -- 내용
  name_key VARCHAR(100) NOT NULL,                 -- i18n key: 'task.homework'
  name_default VARCHAR(200) NOT NULL,             -- 기본값: '숙제 완료'
  description_key VARCHAR(100),
  icon VARCHAR(50),
  
  -- 포인트 기본값
  default_points INT NOT NULL,
  
  -- 승인 설정
  default_approval_type VARCHAR(20) DEFAULT 'parent', -- parent, auto, timer, checklist
  default_timer_minutes INT,
  default_checklist JSONB,                        -- ["침대 정리", "바닥 정리"]
  
  -- 메타
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시드 데이터는 별도 마이그레이션에서
```

### 5. tasks (가족별 태스크)

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  template_id UUID REFERENCES task_templates(id), -- null이면 커스텀
  
  -- 대상 자녀 (null이면 모든 자녀)
  child_id UUID REFERENCES children(id),
  
  -- 분류
  category VARCHAR(20) NOT NULL,
  
  -- 내용
  name VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  
  -- 포인트
  points INT NOT NULL,
  
  -- 승인 설정
  approval_type VARCHAR(20) DEFAULT 'parent',
  timer_minutes INT,
  checklist JSONB,                                -- ["항목1", "항목2"]
  photo_required BOOLEAN DEFAULT false,
  
  -- 신뢰 태스크 여부
  is_trust_task BOOLEAN DEFAULT false,            -- true면 자동 승인
  min_trust_level INT DEFAULT 1,                  -- 자동 승인에 필요한 신뢰 레벨
  
  -- 스케줄 (확장용)
  schedule JSONB,                                 -- {"days": ["mon","tue"], "time": "15:00"}
  
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
CREATE INDEX idx_tasks_is_active ON tasks(is_active) WHERE is_active = true;
```

### 6. task_completions (태스크 완료 기록)

```sql
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id),
  child_id UUID NOT NULL REFERENCES children(id),
  family_id UUID NOT NULL REFERENCES families(id), -- 쿼리 최적화용
  
  -- 상태
  status VARCHAR(20) DEFAULT 'pending',           -- pending, approved, fix_requested, auto_approved
  
  -- 포인트 (승인 시점의 값 저장)
  points_awarded INT,
  
  -- 완료 증빙
  evidence JSONB,                                 -- {"photos": [], "timer_completed": true, "checklist": [...]}
  
  -- Fix 요청 내용
  fix_request JSONB,                              -- {"items": ["바닥 정리", "책상 정리"], "message": "..."}
  fix_request_count INT DEFAULT 0,
  
  -- 승인 정보
  approved_by UUID REFERENCES users(id),          -- null이면 자동 승인
  approved_at TIMESTAMPTZ,
  auto_approve_at TIMESTAMPTZ,                    -- 이 시간 지나면 자동 승인
  
  -- 타임스탬프
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,                       -- 최종 완료 시간
  
  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_task_completions_child_id ON task_completions(child_id);
CREATE INDEX idx_task_completions_family_id ON task_completions(family_id);
CREATE INDEX idx_task_completions_status ON task_completions(status);
CREATE INDEX idx_task_completions_requested_at ON task_completions(requested_at);
CREATE INDEX idx_task_completions_auto_approve ON task_completions(auto_approve_at) 
  WHERE status = 'pending';
```

### 7. reward_templates (리워드 템플릿 - 시스템 제공)

```sql
CREATE TABLE reward_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 분류
  category VARCHAR(20) NOT NULL,                  -- autonomy, experience, screen, savings, item
  age_group VARCHAR(10),
  
  -- 내용
  name_key VARCHAR(100) NOT NULL,
  name_default VARCHAR(200) NOT NULL,
  description_key VARCHAR(100),
  description_default TEXT,                       -- 감정적 언어 포함
  icon VARCHAR(50),
  
  -- 포인트 기본값
  default_points INT NOT NULL,
  
  -- 제한
  default_weekly_limit INT,                       -- 주간 구매 제한
  is_screen_reward BOOLEAN DEFAULT false,         -- 스크린 예산에 포함?
  screen_minutes INT,                             -- 스크린 리워드인 경우
  
  -- 메타
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8. rewards (가족별 리워드)

```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  template_id UUID REFERENCES reward_templates(id),
  
  -- 분류
  category VARCHAR(20) NOT NULL,
  
  -- 내용
  name VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  
  -- 포인트
  points INT NOT NULL,
  
  -- 제한
  weekly_limit INT,
  is_screen_reward BOOLEAN DEFAULT false,
  screen_minutes INT,
  
  -- 부모 실행 필요 여부
  requires_parent_action BOOLEAN DEFAULT true,
  
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
CREATE INDEX idx_rewards_family_id ON rewards(family_id);
CREATE INDEX idx_rewards_category ON rewards(category);
```

### 9. reward_purchases (리워드 구매 = 티켓)

```sql
CREATE TABLE reward_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reward_id UUID NOT NULL REFERENCES rewards(id),
  child_id UUID NOT NULL REFERENCES children(id),
  family_id UUID NOT NULL REFERENCES families(id),
  
  -- 구매 시점 정보 저장
  reward_name VARCHAR(200) NOT NULL,
  points_spent INT NOT NULL,
  
  -- 티켓 상태
  status VARCHAR(20) DEFAULT 'purchased',         -- purchased, fulfilled, expired, cancelled
  
  -- 지급 정보
  fulfilled_by UUID REFERENCES users(id),
  fulfilled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,                         -- 티켓 만료 시간 (선택)
  
  -- 메타
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_reward_purchases_child_id ON reward_purchases(child_id);
CREATE INDEX idx_reward_purchases_family_id ON reward_purchases(family_id);
CREATE INDEX idx_reward_purchases_status ON reward_purchases(status);
```

### 10. kindness_cards (감사 카드)

```sql
CREATE TABLE kindness_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  
  -- 발신/수신
  from_user_id UUID REFERENCES users(id),         -- 부모가 보낸 경우
  from_child_id UUID REFERENCES children(id),     -- 아이가 보낸 경우
  to_child_id UUID NOT NULL REFERENCES children(id),
  
  -- 내용
  message TEXT NOT NULL,
  action_description TEXT,                        -- "동생 숙제 도와줌"
  
  -- 주간 보너스 선정 여부
  is_weekly_bonus BOOLEAN DEFAULT false,
  bonus_points INT,
  
  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_kindness_cards_to_child ON kindness_cards(to_child_id);
CREATE INDEX idx_kindness_cards_family_id ON kindness_cards(family_id);
CREATE INDEX idx_kindness_cards_created_at ON kindness_cards(created_at);
```

### 11. kindness_badges (친절 배지)

```sql
CREATE TABLE kindness_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id),
  family_id UUID NOT NULL REFERENCES families(id),
  
  -- 배지 정보
  badge_type VARCHAR(50) DEFAULT 'kindness',      -- 확장 가능
  badge_number INT NOT NULL,                      -- 몇 번째 배지
  
  -- 획득 조건 (감사 카드 5개)
  cards_counted INT DEFAULT 5,
  
  -- 메타
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_kindness_badges_child_id ON kindness_badges(child_id);
```

### 12. app_integrations (앱 연동 - Artales 등)

```sql
CREATE TABLE app_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  
  -- 앱 정보
  app_name VARCHAR(100) NOT NULL,                 -- 'artales', 'duolingo', etc.
  app_display_name VARCHAR(100) NOT NULL,
  
  -- 연동 설정
  is_enabled BOOLEAN DEFAULT true,
  points_per_completion INT NOT NULL,             -- 미션당 포인트
  daily_limit INT,                                -- 하루 최대 횟수
  
  -- 연동 자격 증명 (암호화 필요)
  credentials JSONB,                              -- {"api_key": "...", "user_id": "..."}
  
  -- 메타
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_app_integrations_family_id ON app_integrations(family_id);
CREATE INDEX idx_app_integrations_app_name ON app_integrations(app_name);
```

### 13. app_integration_events (연동 앱 이벤트)

```sql
CREATE TABLE app_integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES app_integrations(id),
  child_id UUID NOT NULL REFERENCES children(id),
  family_id UUID NOT NULL REFERENCES families(id),
  
  -- 이벤트 정보
  event_type VARCHAR(50) NOT NULL,                -- 'mission_complete', 'lesson_done', etc.
  event_data JSONB,                               -- 앱별 추가 데이터
  external_event_id VARCHAR(255),                 -- 중복 방지용
  
  -- 포인트
  points_awarded INT NOT NULL,
  
  -- 메타
  event_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_app_events_child_id ON app_integration_events(child_id);
CREATE INDEX idx_app_events_integration_id ON app_integration_events(integration_id);
CREATE INDEX idx_app_events_external_id ON app_integration_events(external_event_id);
```

### 14. weekly_summaries (주간 정산)

```sql
CREATE TABLE weekly_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  child_id UUID NOT NULL REFERENCES children(id),
  
  -- 기간
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  
  -- 통계
  stats JSONB NOT NULL,                           -- 아래 구조 참조
  /*
  {
    "tasksCompleted": 15,
    "pointsEarned": 520,
    "pointsSpent": 300,
    "screenMinutesUsed": 180,
    "topTask": "숙제 완료",
    "kindnessCardsReceived": 3,
    "trustLevelChange": 0,
    "streakDays": 5
  }
  */
  
  -- 주간 친절 보너스
  kindness_bonus_card_id UUID REFERENCES kindness_cards(id),
  kindness_bonus_points INT,
  
  -- 부모 메모
  parent_note TEXT,
  
  -- 메타
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_weekly_summaries_child_id ON weekly_summaries(child_id);
CREATE INDEX idx_weekly_summaries_week ON weekly_summaries(week_start);

-- 유니크 제약
ALTER TABLE weekly_summaries ADD CONSTRAINT unique_child_week 
  UNIQUE (child_id, week_start);
```

### 15. point_transactions (포인트 거래 내역 - 감사용)

```sql
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id),
  family_id UUID NOT NULL REFERENCES families(id),
  
  -- 거래 유형
  type VARCHAR(30) NOT NULL,                      -- task_completion, reward_purchase, 
                                                  -- kindness_bonus, manual_adjustment,
                                                  -- app_integration
  
  -- 금액 (양수 = 획득, 음수 = 사용)
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  
  -- 참조
  reference_type VARCHAR(30),                     -- task_completion, reward_purchase, etc.
  reference_id UUID,
  
  -- 설명
  description TEXT,
  
  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_point_transactions_child_id ON point_transactions(child_id);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at);
CREATE INDEX idx_point_transactions_type ON point_transactions(type);
```

### 16. family_values (가족 가치 - No-Point Zone)

```sql
CREATE TABLE family_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  
  -- 내용
  value_key VARCHAR(100),                         -- 시스템 제공인 경우: 'greeting', 'honesty'
  value_text VARCHAR(200) NOT NULL,               -- "가족 인사", "거짓말 안 하기"
  
  -- 상태
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  
  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_family_values_family_id ON family_values(family_id);
```

---

## Row Level Security (RLS) 정책

```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE kindness_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE kindness_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_values ENABLE ROW LEVEL SECURITY;

-- 예시: users 테이블 RLS 정책
CREATE POLICY "Users can view own family members"
  ON users FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- 예시: children 테이블 RLS 정책
CREATE POLICY "Parents can view own children"
  ON children FOR SELECT
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Parents can manage own children"
  ON children FOR ALL
  USING (family_id = (SELECT family_id FROM users WHERE id = auth.uid()));

-- (나머지 테이블도 동일 패턴)
```

---

## 주요 뷰 (Views)

### 1. 아이별 오늘 할 일

```sql
CREATE VIEW v_child_today_tasks AS
SELECT 
  t.id,
  t.family_id,
  t.child_id,
  t.name,
  t.category,
  t.points,
  t.approval_type,
  t.is_trust_task,
  c.name as child_name,
  c.trust_level,
  -- 오늘 완료 여부
  EXISTS (
    SELECT 1 FROM task_completions tc 
    WHERE tc.task_id = t.id 
    AND tc.child_id = COALESCE(t.child_id, tc.child_id)
    AND DATE(tc.requested_at) = CURRENT_DATE
    AND tc.status IN ('pending', 'approved', 'auto_approved')
  ) as completed_today
FROM tasks t
LEFT JOIN children c ON t.child_id = c.id
WHERE t.is_active = true
AND t.deleted_at IS NULL;
```

### 2. 승인 대기 목록 (부모용)

```sql
CREATE VIEW v_pending_approvals AS
SELECT 
  tc.id,
  tc.task_id,
  tc.child_id,
  tc.family_id,
  tc.status,
  tc.requested_at,
  tc.auto_approve_at,
  tc.fix_request_count,
  t.name as task_name,
  t.points,
  c.name as child_name,
  c.avatar_url as child_avatar
FROM task_completions tc
JOIN tasks t ON tc.task_id = t.id
JOIN children c ON tc.child_id = c.id
WHERE tc.status IN ('pending', 'fix_requested')
ORDER BY tc.requested_at DESC;
```

### 3. 아이별 주간 스크린 사용량

```sql
CREATE VIEW v_weekly_screen_usage AS
SELECT 
  rp.child_id,
  rp.family_id,
  DATE_TRUNC('week', rp.purchased_at) as week_start,
  SUM(r.screen_minutes) as total_screen_minutes,
  COUNT(*) as screen_purchases
FROM reward_purchases rp
JOIN rewards r ON rp.reward_id = r.id
WHERE r.is_screen_reward = true
AND rp.status != 'cancelled'
GROUP BY rp.child_id, rp.family_id, DATE_TRUNC('week', rp.purchased_at);
```

---

## 함수 (Functions)

### 1. 포인트 추가 (트랜잭션 보장)

```sql
CREATE OR REPLACE FUNCTION add_points(
  p_child_id UUID,
  p_amount INT,
  p_type VARCHAR(30),
  p_reference_type VARCHAR(30) DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
  v_new_balance INT;
  v_family_id UUID;
BEGIN
  -- 가족 ID 조회
  SELECT family_id INTO v_family_id FROM children WHERE id = p_child_id;
  
  -- 포인트 업데이트
  UPDATE children 
  SET 
    points_balance = points_balance + p_amount,
    points_lifetime_earned = CASE 
      WHEN p_amount > 0 THEN points_lifetime_earned + p_amount 
      ELSE points_lifetime_earned 
    END,
    updated_at = NOW()
  WHERE id = p_child_id
  RETURNING points_balance INTO v_new_balance;
  
  -- 거래 내역 기록
  INSERT INTO point_transactions (
    child_id, family_id, type, amount, balance_after,
    reference_type, reference_id, description
  ) VALUES (
    p_child_id, v_family_id, p_type, p_amount, v_new_balance,
    p_reference_type, p_reference_id, p_description
  );
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;
```

### 2. 태스크 승인

```sql
CREATE OR REPLACE FUNCTION approve_task_completion(
  p_completion_id UUID,
  p_approved_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_completion task_completions%ROWTYPE;
  v_task tasks%ROWTYPE;
  v_new_balance INT;
BEGIN
  -- 완료 기록 조회
  SELECT * INTO v_completion FROM task_completions WHERE id = p_completion_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Completion not found');
  END IF;
  
  -- 이미 승인됨?
  IF v_completion.status IN ('approved', 'auto_approved') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already approved');
  END IF;
  
  -- 태스크 조회
  SELECT * INTO v_task FROM tasks WHERE id = v_completion.task_id;
  
  -- 상태 업데이트
  UPDATE task_completions SET
    status = CASE WHEN p_approved_by IS NULL THEN 'auto_approved' ELSE 'approved' END,
    points_awarded = v_task.points,
    approved_by = p_approved_by,
    approved_at = NOW(),
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_completion_id;
  
  -- 포인트 추가
  v_new_balance := add_points(
    v_completion.child_id,
    v_task.points,
    'task_completion',
    'task_completion',
    p_completion_id,
    v_task.name || ' 완료'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'points_awarded', v_task.points,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql;
```

### 3. 리워드 구매

```sql
CREATE OR REPLACE FUNCTION purchase_reward(
  p_reward_id UUID,
  p_child_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_reward rewards%ROWTYPE;
  v_child children%ROWTYPE;
  v_family families%ROWTYPE;
  v_weekly_purchases INT;
  v_weekly_screen INT;
  v_new_balance INT;
  v_purchase_id UUID;
BEGIN
  -- 리워드 조회
  SELECT * INTO v_reward FROM rewards WHERE id = p_reward_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward not found');
  END IF;
  
  -- 아이 조회
  SELECT * INTO v_child FROM children WHERE id = p_child_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Child not found');
  END IF;
  
  -- 포인트 충분?
  IF v_child.points_balance < v_reward.points THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient points');
  END IF;
  
  -- 주간 제한 확인
  IF v_reward.weekly_limit IS NOT NULL THEN
    SELECT COUNT(*) INTO v_weekly_purchases
    FROM reward_purchases
    WHERE reward_id = p_reward_id
    AND child_id = p_child_id
    AND purchased_at >= DATE_TRUNC('week', NOW())
    AND status != 'cancelled';
    
    IF v_weekly_purchases >= v_reward.weekly_limit THEN
      RETURN jsonb_build_object('success', false, 'error', 'Weekly limit reached');
    END IF;
  END IF;
  
  -- 스크린 예산 확인
  IF v_reward.is_screen_reward THEN
    SELECT COALESCE(SUM(r.screen_minutes), 0) INTO v_weekly_screen
    FROM reward_purchases rp
    JOIN rewards r ON rp.reward_id = r.id
    WHERE rp.child_id = p_child_id
    AND r.is_screen_reward = true
    AND rp.purchased_at >= DATE_TRUNC('week', NOW())
    AND rp.status != 'cancelled';
    
    SELECT * INTO v_family FROM families WHERE id = v_child.family_id;
    
    IF v_weekly_screen + v_reward.screen_minutes > 
       (v_family.settings->>'screenBudgetWeeklyMinutes')::INT THEN
      RETURN jsonb_build_object('success', false, 'error', 'Screen budget exceeded');
    END IF;
  END IF;
  
  -- 구매 기록 생성
  INSERT INTO reward_purchases (
    reward_id, child_id, family_id, reward_name, points_spent
  ) VALUES (
    p_reward_id, p_child_id, v_child.family_id, v_reward.name, v_reward.points
  ) RETURNING id INTO v_purchase_id;
  
  -- 포인트 차감
  v_new_balance := add_points(
    p_child_id,
    -v_reward.points,
    'reward_purchase',
    'reward_purchase',
    v_purchase_id,
    v_reward.name || ' 구매'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', v_purchase_id,
    'points_spent', v_reward.points,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 트리거 (Triggers)

### 1. updated_at 자동 업데이트

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 모든 테이블에 적용
CREATE TRIGGER set_updated_at BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- (나머지 테이블도 동일)
```

### 2. 친절 배지 자동 생성

```sql
CREATE OR REPLACE FUNCTION check_kindness_badge()
RETURNS TRIGGER AS $$
DECLARE
  v_card_count INT;
  v_badge_count INT;
BEGIN
  -- 해당 아이의 감사 카드 수
  SELECT COUNT(*) INTO v_card_count
  FROM kindness_cards
  WHERE to_child_id = NEW.to_child_id
  AND is_weekly_bonus = false;
  
  -- 현재 배지 수
  SELECT COUNT(*) INTO v_badge_count
  FROM kindness_badges
  WHERE child_id = NEW.to_child_id;
  
  -- 5개마다 배지 생성
  IF v_card_count >= (v_badge_count + 1) * 5 THEN
    INSERT INTO kindness_badges (child_id, family_id, badge_number)
    VALUES (NEW.to_child_id, NEW.family_id, v_badge_count + 1);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_kindness_badge
  AFTER INSERT ON kindness_cards
  FOR EACH ROW EXECUTE FUNCTION check_kindness_badge();
```

### 3. 자동 승인 스케줄러 (pg_cron 또는 외부 cron)

```sql
-- 주기적으로 실행할 함수
CREATE OR REPLACE FUNCTION process_auto_approvals()
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_completion RECORD;
BEGIN
  FOR v_completion IN
    SELECT id FROM task_completions
    WHERE status = 'pending'
    AND auto_approve_at IS NOT NULL
    AND auto_approve_at <= NOW()
  LOOP
    PERFORM approve_task_completion(v_completion.id, NULL);
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

---

## 시드 데이터 (Seed Data)

별도 파일: `seed_task_templates.sql`, `seed_reward_templates.sql`

```sql
-- task_templates 예시
INSERT INTO task_templates (category, age_group, name_key, name_default, default_points, default_approval_type)
VALUES
  ('learning', '8-11', 'task.homework', '숙제 완료', 50, 'parent'),
  ('learning', '8-11', 'task.reading', '독서 20분', 30, 'timer'),
  ('life', '8-11', 'task.room_cleaning', '방 정리', 30, 'parent'),
  ('life', '8-11', 'task.dish_cleanup', '식사 후 정리', 20, 'auto'),
  ('health', '8-11', 'task.exercise', '운동 30분', 40, 'parent');

-- reward_templates 예시
INSERT INTO reward_templates (category, name_key, name_default, description_default, default_points, is_screen_reward, screen_minutes, sort_order)
VALUES
  ('autonomy', 'reward.menu_choice', '저녁 메뉴 결정권', '오늘 뭐 먹을지 네가 정해!', 80, false, NULL, 1),
  ('autonomy', 'reward.bedtime_extend', '취침 30분 연장', '주말에 조금 더 놀 수 있어', 120, false, NULL, 2),
  ('experience', 'reward.board_game', '부모와 보드게임 30분', '엄마/아빠랑 둘이서만', 60, false, NULL, 3),
  ('experience', 'reward.ice_cream', '아이스크림', NULL, 150, false, NULL, 4),
  ('screen', 'reward.game_30min', '게임 30분', NULL, 100, true, 30, 5),
  ('screen', 'reward.youtube_30min', '유튜브 30분', NULL, 100, true, 30, 6),
  ('savings', 'reward.save_1dollar', '$1 저축', '저축통에 적립', 150, false, NULL, 7);
```

---

## TypeScript 타입 (프론트엔드용)

```typescript
// types/database.ts

export interface Family {
  id: string;
  name: string;
  settings: FamilySettings;
  subscription_tier: 'free' | 'premium';
  subscription_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilySettings {
  timezone: string;
  language: string;
  weekStartsOn: 'monday' | 'sunday';
  autoApprovalHours: number;
  screenBudgetWeeklyMinutes: number;
}

export interface User {
  id: string;
  family_id: string;
  email: string;
  name: string | null;
  role: 'parent' | 'admin';
  avatar_url: string | null;
  settings: UserSettings;
  last_active_at: string | null;
  created_at: string;
}

export interface UserSettings {
  notifications: {
    taskCompletion: boolean;
    weeklyReport: boolean;
    rewardPurchase: boolean;
  };
}

export interface Child {
  id: string;
  family_id: string;
  name: string;
  age_group: '5-7' | '8-11' | '12-14';
  birth_year: number | null;
  avatar_url: string | null;
  pin_code: string | null;
  points_balance: number;
  points_lifetime_earned: number;
  trust_level: 1 | 2 | 3;
  trust_streak_days: number;
  settings: ChildSettings;
  created_at: string;
}

export interface ChildSettings {
  weeklyGoal: number;
  screenBudgetUsedThisWeek: number;
}

export interface Task {
  id: string;
  family_id: string;
  template_id: string | null;
  child_id: string | null;
  category: 'learning' | 'life' | 'health';
  name: string;
  description: string | null;
  icon: string | null;
  points: number;
  approval_type: 'parent' | 'auto' | 'timer' | 'checklist';
  timer_minutes: number | null;
  checklist: string[] | null;
  photo_required: boolean;
  is_trust_task: boolean;
  min_trust_level: number;
  schedule: TaskSchedule | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface TaskSchedule {
  days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  time: string | null;
}

export type TaskCompletionStatus = 
  | 'pending' 
  | 'approved' 
  | 'fix_requested' 
  | 'auto_approved';

export interface TaskCompletion {
  id: string;
  task_id: string;
  child_id: string;
  family_id: string;
  status: TaskCompletionStatus;
  points_awarded: number | null;
  evidence: TaskEvidence | null;
  fix_request: FixRequest | null;
  fix_request_count: number;
  approved_by: string | null;
  approved_at: string | null;
  auto_approve_at: string | null;
  requested_at: string;
  completed_at: string | null;
}

export interface TaskEvidence {
  photos?: string[];
  timer_completed?: boolean;
  checklist?: boolean[];
  summary?: string;
}

export interface FixRequest {
  items: string[];
  message?: string;
}

export interface Reward {
  id: string;
  family_id: string;
  template_id: string | null;
  category: 'autonomy' | 'experience' | 'screen' | 'savings' | 'item';
  name: string;
  description: string | null;
  icon: string | null;
  points: number;
  weekly_limit: number | null;
  is_screen_reward: boolean;
  screen_minutes: number | null;
  requires_parent_action: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export type RewardPurchaseStatus = 
  | 'purchased' 
  | 'fulfilled' 
  | 'expired' 
  | 'cancelled';

export interface RewardPurchase {
  id: string;
  reward_id: string;
  child_id: string;
  family_id: string;
  reward_name: string;
  points_spent: number;
  status: RewardPurchaseStatus;
  fulfilled_by: string | null;
  fulfilled_at: string | null;
  expires_at: string | null;
  purchased_at: string;
}

export interface KindnessCard {
  id: string;
  family_id: string;
  from_user_id: string | null;
  from_child_id: string | null;
  to_child_id: string;
  message: string;
  action_description: string | null;
  is_weekly_bonus: boolean;
  bonus_points: number | null;
  created_at: string;
}

export interface KindnessBadge {
  id: string;
  child_id: string;
  family_id: string;
  badge_type: string;
  badge_number: number;
  cards_counted: number;
  earned_at: string;
}

export interface AppIntegration {
  id: string;
  family_id: string;
  app_name: string;
  app_display_name: string;
  is_enabled: boolean;
  points_per_completion: number;
  daily_limit: number | null;
  connected_at: string;
  last_sync_at: string | null;
}

export interface WeeklySummary {
  id: string;
  family_id: string;
  child_id: string;
  week_start: string;
  week_end: string;
  stats: WeeklyStats;
  kindness_bonus_card_id: string | null;
  kindness_bonus_points: number | null;
  parent_note: string | null;
  generated_at: string;
}

export interface WeeklyStats {
  tasksCompleted: number;
  pointsEarned: number;
  pointsSpent: number;
  screenMinutesUsed: number;
  topTask: string;
  kindnessCardsReceived: number;
  trustLevelChange: number;
  streakDays: number;
}

export interface PointTransaction {
  id: string;
  child_id: string;
  family_id: string;
  type: 
    | 'task_completion' 
    | 'reward_purchase' 
    | 'kindness_bonus' 
    | 'manual_adjustment'
    | 'app_integration';
  amount: number;
  balance_after: number;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface FamilyValue {
  id: string;
  family_id: string;
  value_key: string | null;
  value_text: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}
```

---

## 마이그레이션 순서

1. `001_create_families.sql`
2. `002_create_users.sql`
3. `003_create_children.sql`
4. `004_create_task_templates.sql`
5. `005_create_tasks.sql`
6. `006_create_task_completions.sql`
7. `007_create_reward_templates.sql`
8. `008_create_rewards.sql`
9. `009_create_reward_purchases.sql`
10. `010_create_kindness.sql`
11. `011_create_app_integrations.sql`
12. `012_create_weekly_summaries.sql`
13. `013_create_point_transactions.sql`
14. `014_create_family_values.sql`
15. `015_create_views.sql`
16. `016_create_functions.sql`
17. `017_create_triggers.sql`
18. `018_create_rls_policies.sql`
19. `019_seed_templates.sql`

---

*End of Data Model Document*
