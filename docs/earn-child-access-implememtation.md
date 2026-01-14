# 구현 지시서: Child Device Access (Family Code 기반)

## 📋 개요

아이가 자신의 디바이스(폰/태블릿)에서 **부모 OAuth 계정 없이** EarnQuest에 접근할 수 있는 시스템을 구현한다.

### 핵심 플로우
```
아이 폰 → 앱 설치 → "아이로 시작" → 가족 코드 입력 → 자녀 선택 → 아이 홈
```

### 설계 결정 (확정)
- **코드 방식**: 고정 Family Code (6자리, 재발급 가능)
- **아이 PIN**: 불필요 (생략)
- **부모 대시보드**: 아이 디바이스에서는 부모 OAuth 로그인 필요
- **형제 공유**: 지원 (자녀 선택 화면)

---

## 🗄️ 1. Database Migration

### 파일: `supabase/migrations/0XX_add_family_join_code.sql`

```sql
-- 1. families 테이블에 join_code 컬럼 추가
ALTER TABLE families ADD COLUMN IF NOT EXISTS
  join_code VARCHAR(6) UNIQUE;

-- 2. 가족 코드 생성 함수 (혼동 문자 제외: 0, O, I, L, 1)
CREATE OR REPLACE FUNCTION generate_family_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code VARCHAR(6) := '';
  attempts INT := 0;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    
    -- 중복 체크
    EXIT WHEN NOT EXISTS (SELECT 1 FROM families WHERE join_code = code);
    
    attempts := attempts + 1;
    IF attempts > 100 THEN
      RAISE EXCEPTION 'Failed to generate unique code';
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 3. 가족 생성 시 자동으로 코드 생성하는 트리거
CREATE OR REPLACE FUNCTION set_family_join_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := generate_family_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_family_join_code ON families;
CREATE TRIGGER trigger_set_family_join_code
  BEFORE INSERT ON families
  FOR EACH ROW
  EXECUTE FUNCTION set_family_join_code();

-- 4. 기존 가족들에 코드 생성
UPDATE families 
SET join_code = generate_family_code() 
WHERE join_code IS NULL;

-- 5. join_code 인덱스 (이미 UNIQUE로 생성됨)
```

---

## 🎨 2. UI Components

### 2.1 로그인 페이지 수정

**파일**: `app/[locale]/(auth)/login/page.tsx`

```typescript
// 기존 부모 로그인 + 새로운 아이 탭 추가
// Tabs 컴포넌트 사용 (shadcn/ui)

interface LoginPageProps {
  // ...
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<'parent' | 'child'>('parent');
  
  return (
    <div className="...">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="parent">부모</TabsTrigger>
          <TabsTrigger value="child">아이</TabsTrigger>
        </TabsList>
        
        <TabsContent value="parent">
          {/* 기존 부모 OAuth/Email 로그인 */}
          <ParentLoginForm />
        </TabsContent>
        
        <TabsContent value="child">
          <ChildJoinFlow />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 2.2 아이 연결 플로우 컴포넌트

**파일**: `components/auth/ChildJoinFlow.tsx`

```typescript
// Step 1: 가족 코드 입력
// Step 2: 자녀 선택
// Step 3: 완료 → 아이 홈으로 리다이렉트

interface ChildJoinFlowProps {}

export function ChildJoinFlow() {
  const [step, setStep] = useState<'code' | 'select'>('code');
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  
  // Step 1: 코드 입력 완료 시
  const handleCodeSubmit = async (code: string) => {
    const result = await joinByFamilyCode(code);
    if (result.success) {
      setFamilyId(result.familyId);
      setChildren(result.children);
      setStep('select');
    }
  };
  
  // Step 2: 자녀 선택 시
  const handleChildSelect = async (childId: string) => {
    await selectChild(childId);
    // 세션 저장 후 아이 홈으로 이동
    router.push(`/${locale}/child`);
  };
  
  return (
    <>
      {step === 'code' && <FamilyCodeInput onSubmit={handleCodeSubmit} />}
      {step === 'select' && <ChildPicker children={children} onSelect={handleChildSelect} />}
    </>
  );
}
```

### 2.3 가족 코드 입력 컴포넌트

**파일**: `components/auth/FamilyCodeInput.tsx`

```typescript
// 6자리 코드 입력 UI
// - 자동 대문자 변환
// - 각 자리별 분리된 입력 필드 (OTP 스타일)
// - 5회 실패 시 15분 잠금 표시

interface FamilyCodeInputProps {
  onSubmit: (code: string) => Promise<void>;
}

export function FamilyCodeInput({ onSubmit }: FamilyCodeInputProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockUntil, setLockUntil] = useState<Date | null>(null);
  
  // OTP 스타일 입력 또는 단일 텍스트 필드
  // 실패 횟수 localStorage로 관리
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">가족 코드를 입력하세요</h2>
        <p className="text-muted-foreground mt-2">부모님께 물어보세요!</p>
      </div>
      
      {/* 6자리 입력 필드 */}
      <CodeInput 
        value={code} 
        onChange={setCode} 
        disabled={isLocked}
      />
      
      {error && <p className="text-destructive text-sm">{error}</p>}
      {isLocked && <p className="text-destructive text-sm">너무 많이 틀렸어요. {formatTimeRemaining(lockUntil)}후에 다시 시도해주세요.</p>}
      
      <Button onClick={() => onSubmit(code)} disabled={code.length !== 6 || isLocked}>
        다음
      </Button>
    </div>
  );
}
```

### 2.4 자녀 선택 컴포넌트

**파일**: `components/auth/ChildPicker.tsx`

```typescript
// 가족의 자녀 목록을 카드로 표시
// 아바타 + 이름

interface ChildPickerProps {
  children: Child[];
  onSelect: (childId: string) => void;
}

export function ChildPicker({ children, onSelect }: ChildPickerProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold">누가 사용하나요?</h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {children.map((child) => (
          <button
            key={child.id}
            onClick={() => onSelect(child.id)}
            className="flex flex-col items-center p-6 rounded-xl border-2 hover:border-primary transition-colors"
          >
            <Avatar className="w-16 h-16 mb-3">
              <AvatarImage src={child.avatar_url} />
              <AvatarFallback>{child.name[0]}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{child.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 2.5 부모 설정 - 기기 연결 섹션

**파일**: `components/settings/DeviceConnectionSection.tsx`

```typescript
// 부모 설정 페이지에 추가
// - 현재 가족 코드 표시
// - 복사 버튼
// - 재발급 버튼 (확인 다이얼로그 포함)

export function DeviceConnectionSection() {
  const { family, regenerateCode } = useFamily();
  const [isCopied, setIsCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(family.join_code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleRegenerate = async () => {
    // 확인 다이얼로그 후 재발급
    await regenerateCode();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          아이 디바이스 연결
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>가족 코드</Label>
          <div className="flex items-center gap-2 mt-1">
            <code className="text-2xl font-mono tracking-wider bg-muted px-4 py-2 rounded">
              {family.join_code}
            </code>
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {isCopied ? <Check /> : <Copy />}
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          아이가 자기 폰/태블릿에서 앱을 열고 이 코드를 입력하면 연결됩니다.
        </p>
        
        <Button variant="outline" onClick={handleRegenerate}>
          새 코드 생성
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## 🔌 3. API Routes

### 3.1 가족 코드로 연결

**파일**: `app/api/child/join/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const JoinSchema = z.object({
  joinCode: z.string().length(6).toUpperCase(),
});

// Rate limiting: IP 기반 5회/15분
const failureMap = new Map<string, { count: number; lockedUntil: Date | null }>();

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  // Rate limit 체크
  const failure = failureMap.get(ip);
  if (failure?.lockedUntil && failure.lockedUntil > new Date()) {
    return NextResponse.json(
      { error: 'TOO_MANY_ATTEMPTS', lockedUntil: failure.lockedUntil },
      { status: 429 }
    );
  }
  
  const body = await request.json();
  const parsed = JoinSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_CODE_FORMAT' }, { status: 400 });
  }
  
  const supabase = await createClient();
  
  // 가족 조회
  const { data: family, error } = await supabase
    .from('families')
    .select('id, name')
    .eq('join_code', parsed.data.joinCode)
    .single();
  
  if (error || !family) {
    // 실패 횟수 증가
    const current = failureMap.get(ip) || { count: 0, lockedUntil: null };
    current.count += 1;
    if (current.count >= 5) {
      current.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    failureMap.set(ip, current);
    
    return NextResponse.json({ error: 'INVALID_CODE' }, { status: 404 });
  }
  
  // 성공 시 실패 횟수 리셋
  failureMap.delete(ip);
  
  // 자녀 목록 조회
  const { data: children } = await supabase
    .from('children')
    .select('id, name, avatar_url')
    .eq('family_id', family.id)
    .is('deleted_at', null)
    .order('created_at');
  
  return NextResponse.json({
    success: true,
    familyId: family.id,
    familyName: family.name,
    children: children || [],
  });
}
```

### 3.2 자녀 선택

**파일**: `app/api/child/select/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SignJWT } from 'jose';

const SelectSchema = z.object({
  familyId: z.string().uuid(),
  childId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = SelectSchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 });
  }
  
  const supabase = await createClient();
  
  // 자녀가 해당 가족에 속하는지 확인
  const { data: child, error } = await supabase
    .from('children')
    .select('id, name, family_id')
    .eq('id', parsed.data.childId)
    .eq('family_id', parsed.data.familyId)
    .is('deleted_at', null)
    .single();
  
  if (error || !child) {
    return NextResponse.json({ error: 'CHILD_NOT_FOUND' }, { status: 404 });
  }
  
  // Child 세션 토큰 생성 (제한된 권한)
  const secret = new TextEncoder().encode(process.env.CHILD_SESSION_SECRET);
  const token = await new SignJWT({
    sub: child.id,
    familyId: child.family_id,
    role: 'child',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
  
  return NextResponse.json({
    success: true,
    token,
    child: {
      id: child.id,
      name: child.name,
    },
  });
}
```

### 3.3 가족 코드 재발급

**파일**: `app/api/family/regenerate-code/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createClient();
  
  // 현재 사용자 확인 (부모만)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  
  // 사용자의 가족 조회
  const { data: userData } = await supabase
    .from('users')
    .select('family_id')
    .eq('id', user.id)
    .single();
  
  if (!userData?.family_id) {
    return NextResponse.json({ error: 'NO_FAMILY' }, { status: 400 });
  }
  
  // 새 코드 생성 (함수 호출)
  const { data, error } = await supabase.rpc('regenerate_family_code', {
    p_family_id: userData.family_id,
  });
  
  if (error) {
    return NextResponse.json({ error: 'REGENERATE_FAILED' }, { status: 500 });
  }
  
  return NextResponse.json({
    success: true,
    newCode: data,
  });
}
```

---

## 📦 4. State Management

### 4.1 Child Session Store

**파일**: `lib/stores/childSession.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChildSession {
  token: string;
  childId: string;
  childName: string;
  familyId: string;
}

interface ChildSessionStore {
  session: ChildSession | null;
  
  setSession: (session: ChildSession) => void;
  clearSession: () => void;
  
  // 형제 전환용
  switchChild: (newSession: ChildSession) => void;
}

export const useChildSession = create<ChildSessionStore>()(
  persist(
    (set) => ({
      session: null,
      
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
      switchChild: (newSession) => set({ session: newSession }),
    }),
    {
      name: 'earnquest-child-session',
    }
  )
);
```

---

## 🛡️ 5. Child Route Protection

### 5.1 Child Layout

**파일**: `app/[locale]/(child)/layout.tsx`

```typescript
'use client';

import { useChildSession } from '@/lib/stores/childSession';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ChildLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = useChildSession();
  const router = useRouter();
  
  useEffect(() => {
    if (!session) {
      router.push('/login?tab=child');
    }
  }, [session, router]);
  
  if (!session) {
    return <LoadingScreen />;
  }
  
  return (
    <ChildSessionProvider value={session}>
      <ChildNavigation />
      <main>{children}</main>
    </ChildSessionProvider>
  );
}
```

---

## ✅ 6. TODO Checklist

### Database
- [ ] `0XX_add_family_join_code.sql` 마이그레이션 작성
- [ ] `generate_family_code()` 함수 생성
- [ ] 가족 생성 트리거 추가
- [ ] `regenerate_family_code()` RPC 함수 생성
- [ ] 기존 가족들에 코드 생성

### API
- [ ] `POST /api/child/join` - 가족 코드 검증 + 자녀 목록 반환
- [ ] `POST /api/child/select` - 자녀 선택 + 세션 토큰 발급
- [ ] `POST /api/family/regenerate-code` - 코드 재발급 (부모 전용)
- [ ] Rate limiting 구현 (5회/15분)

### UI
- [ ] 로그인 페이지에 Parent/Child 탭 추가
- [ ] `FamilyCodeInput` 컴포넌트 (6자리 입력)
- [ ] `ChildPicker` 컴포넌트 (자녀 선택)
- [ ] `ChildJoinFlow` 컴포넌트 (전체 플로우)
- [ ] 부모 설정에 `DeviceConnectionSection` 추가

### State
- [ ] `useChildSession` Zustand store (persist)
- [ ] Child route protection (layout.tsx)

### Security
- [ ] `CHILD_SESSION_SECRET` 환경변수 추가
- [ ] Child 토큰 검증 미들웨어/유틸
- [ ] 부모 대시보드 접근 시 OAuth 요구 (아이 세션으로 불가)

---

## 🧪 7. 검증 체크리스트

- [ ] 새로운 가족 생성 시 `join_code`가 자동 생성되는가
- [ ] 부모 설정에서 가족 코드가 표시되고 복사가 작동하는가
- [ ] 가족 코드 재발급이 작동하고 이전 코드가 무효화되는가
- [ ] 잘못된 코드 입력 시 에러 메시지가 표시되는가
- [ ] 5회 실패 시 15분 잠금이 작동하는가
- [ ] 올바른 코드로 자녀 목록이 표시되는가
- [ ] 자녀 선택 후 아이 홈으로 이동하는가
- [ ] 앱 재실행 시 세션이 유지되어 바로 아이 홈이 열리는가
- [ ] 형제 전환이 작동하는가
- [ ] 아이 세션으로 부모 API 호출 시 거부되는가
- [ ] 아이 디바이스에서 "부모 모드" 접근 시 OAuth 로그인이 요구되는가

---

## ⚠️ 주의사항

1. **Core Loop 방해 금지**: Tasks → Points → Store 핵심 플로우에 영향 주지 않기
2. **COPPA 준수**: Child API는 최소 데이터만 반환 (이름, 아바타, 오늘 할 일, 포인트)
3. **권한 분리**: Child 세션 토큰으로는 Parent API 절대 호출 불가
4. **UX 언어**: 에러 메시지는 비난 대신 "다시 확인" 톤 유지

---

## 📁 파일 변경 요약

```
신규 파일:
├── supabase/migrations/0XX_add_family_join_code.sql
├── app/api/child/join/route.ts
├── app/api/child/select/route.ts
├── app/api/family/regenerate-code/route.ts
├── components/auth/ChildJoinFlow.tsx
├── components/auth/FamilyCodeInput.tsx
├── components/auth/ChildPicker.tsx
├── components/settings/DeviceConnectionSection.tsx
├── lib/stores/childSession.ts
└── app/[locale]/(child)/layout.tsx (수정 또는 신규)

수정 파일:
├── app/[locale]/(auth)/login/page.tsx (탭 추가)
├── app/[locale]/(app)/settings/page.tsx (DeviceConnectionSection 추가)
└── .env.local (CHILD_SESSION_SECRET 추가)
```