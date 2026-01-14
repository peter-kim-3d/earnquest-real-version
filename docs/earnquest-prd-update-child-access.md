# PRD Update: Child Device Access (Section 6.1.2)

> 이 내용으로 `earnquest-prd-final.md`의 Section 6.1.2 Child Access를 교체/확장

---

## 6.1.2 Child Device Access

### Overview

아이가 **자신의 디바이스(폰/태블릿)**에서 부모 OAuth 계정 없이 EarnQuest에 접근할 수 있는 시스템.

### Design Decisions

| 결정 사항 | 선택 | 근거 |
|----------|------|------|
| 코드 방식 | 고정 Family Code (재발급 가능) | UX 우선, 보안은 알림+재발급으로 보완 |
| 아이 PIN | 불필요 (생략) | 실질적 보안 효과 없음, UX만 해침 |
| 부모 대시보드 접근 | 부모 OAuth 로그인 필요 | 어깨너머 훔쳐보기 방지 |
| 형제 공유 디바이스 | 지원 (Child 선택 화면) | 핵심 타깃(8-11) 형제 공유 흔함 |

### Family Code Specifications

| 속성 | 값 |
|------|-----|
| 길이 | 6자리 |
| 문자셋 | `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (혼동 문자 제외) |
| 생성 시점 | Family 생성 시 자동 |
| 유효 기간 | 무기한 (재발급 시 이전 코드 무효화) |
| 재발급 | 부모 설정에서 가능 |

### Access Flows

#### Flow A: 아이 디바이스 최초 연결

```
1. 아이가 자기 폰에 앱 설치
2. 로그인 화면 → "아이로 시작하기" 탭 선택
3. 가족 코드 입력 (6자리)
   - 유효하지 않은 코드: "코드를 다시 확인해주세요"
   - 5회 실패 시: 15분 대기
4. 자녀 선택 화면: "누구예요?" → 본인 선택
5. 아이 홈 진입
6. 디바이스에 세션 저장 (다음부터 바로 진입)
```

#### Flow B: 재방문 (세션 있음)

```
1. 앱 실행
2. 저장된 세션 확인 → 아이 홈 바로 진입
```

#### Flow C: 형제 전환 (공유 디바이스)

```
1. 아이 홈 상단 프로필 영역 탭
2. "프로필 전환" 선택
3. 같은 가족의 다른 자녀 목록 표시
4. 선택 → 해당 자녀의 아이 홈 진입
```

#### Flow D: 부모 대시보드 접근 (아이 디바이스에서)

```
1. 아이 홈 → 설정 → "부모 모드"
2. 부모 OAuth 로그인 필요 (Google/Apple)
3. 로그인 성공 → 부모 대시보드 진입
4. 세션: 앱 종료 시 만료 (자동 로그아웃)
```

### Security Measures

| 위험 | 대응 |
|-----|------|
| 가족 코드 유출 | 새 기기 연결 시 부모에게 알림 + 재발급 기능 |
| Brute-force | 5회 실패 시 15분 잠금 |
| 다른 가족 접근 | 코드-가족 매핑 검증 |

### UI Components

#### Login Screen (Tabs)

```
┌─────────────────────────────────────────┐
│              EarnQuest                  │
│                                         │
│   ┌──────────┐  ┌──────────┐           │
│   │  부모    │  │   아이   │  ← 탭     │
│   └──────────┘  └──────────┘           │
│                                         │
│   [아이 탭 선택 시]                      │
│                                         │
│   가족 코드를 입력하세요                 │
│   (부모님께 물어보세요!)                │
│                                         │
│   ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐ ┌─┐             │
│   │ │ │ │ │ │ │ │ │ │ │ │             │
│   └─┘ └─┘ └─┘ └─┘ └─┘ └─┘             │
│                                         │
│   [다음]                                │
└─────────────────────────────────────────┘
```

#### Child Picker Screen

```
┌─────────────────────────────────────────┐
│   ← 뒤로          환영합니다!           │
│                                         │
│           누가 사용하나요?              │
│                                         │
│   ┌─────────┐     ┌─────────┐          │
│   │  👧    │     │  👦    │          │
│   │  Anna   │     │  Lucas  │          │
│   └─────────┘     └─────────┘          │
│                                         │
└─────────────────────────────────────────┘
```

#### Parent Settings - Device Connection

```
┌─────────────────────────────────────────┐
│   가족 설정                             │
│                                         │
│   📱 아이 디바이스 연결                  │
│                                         │
│   가족 코드: ABC123                      │
│   [복사]  [새로 생성]                    │
│                                         │
│   아이가 자기 폰/태블릿에서 앱을 열고   │
│   이 코드를 입력하면 연결됩니다.        │
│                                         │
└─────────────────────────────────────────┘
```

### Data Model Changes

```sql
-- families 테이블에 추가
ALTER TABLE families ADD COLUMN 
  join_code VARCHAR(6) UNIQUE;

-- 코드 생성 함수
CREATE OR REPLACE FUNCTION generate_family_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code VARCHAR(6) := '';
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/child/join` | 가족 코드로 연결, 자녀 목록 반환 |
| POST | `/api/child/select` | 자녀 선택, 세션 토큰 발급 |
| GET | `/api/child/me` | 현재 자녀 정보 |
| POST | `/api/family/regenerate-code` | 가족 코드 재발급 (부모 전용) |

### Phase Roadmap

| Phase | 기능 |
|-------|------|
| MVP | 가족 코드 + 자녀 선택 + 세션 저장 |
| Phase 2 | 새 기기 알림, 연결된 기기 목록/관리 |
| Phase 3 | QR 코드 연결 옵션 |

---

*End of Update*