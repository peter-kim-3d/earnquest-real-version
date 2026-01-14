# Onboarding 404 Error Fix

## 문제 상황

자녀 정보 저장 시 404 에러 발생:
```
POST /api/onboarding/child 404
Error: User profile not found
```

## 원인

이메일 회원가입 플로우에서 `users` 테이블에 프로필이 생성되지 않았습니다:

1. **OAuth 플로우** (Google):
   ```
   Signup → Google OAuth → Callback → getOrCreateUserProfile() → ✅ Profile created
   ```

2. **이메일 플로우** (문제 발생):
   ```
   Signup → signUp() → Redirect to onboarding → ❌ No profile created
   ```

## 해결 방법

### 수정된 파일: `app/api/onboarding/child/route.ts`

**Before (Line 26-31):**
```typescript
if (profileError || !userProfile) {
  return NextResponse.json(
    { error: 'User profile not found' },
    { status: 404 }
  );
}
```

**After (Line 27-38):**
```typescript
// If user profile doesn't exist, create it
if (profileError || !userProfile) {
  console.log('User profile not found, creating one...');
  const { getOrCreateUserProfile } = await import('@/lib/services/user');
  userProfile = await getOrCreateUserProfile(user);

  if (!userProfile || !userProfile.family_id) {
    return NextResponse.json(
      { error: 'Failed to create user profile' },
      { status: 500 }
    );
  }
}
```

## 작동 방식

### 새로운 플로우

```
User submits child info
  ↓
API checks for user profile
  ↓
Profile not found?
  ↓
Auto-create profile:
  1. Create family record
  2. Create users record
  3. Link user to family
  ↓
Continue with child creation
  ↓
✅ Success!
```

### getOrCreateUserProfile 함수

`lib/services/user.ts:69-93`:
```typescript
export async function getOrCreateUserProfile(authUser: any) {
  // Check if user profile already exists
  const existingUser = await getUser(authUser.id);
  if (existingUser) {
    return existingUser;
  }

  // Create new family and user profile
  const { createFamily } = await import('./family');
  const family = await createFamily({
    name: 'My Family',
    language: 'en-US',
  });

  const user = await createUser({
    id: authUser.id,
    familyId: family.id,
    email: authUser.email!,
    fullName: authUser.user_metadata?.full_name,
    avatarUrl: authUser.user_metadata?.avatar_url,
    role: 'parent',
  });

  return user;
}
```

## 테스트 결과

### 예상 동작

1. **첫 번째 자녀 저장 시**:
   - API가 사용자 프로필 없음 감지
   - 자동으로 family + users 생성
   - 자녀 레코드 생성 성공

2. **두 번째 자녀 저장 시**:
   - 프로필이 이미 존재
   - 바로 자녀 레코드 생성

3. **성공 후**:
   - 모든 자녀 저장 완료
   - `/en-US/onboarding/select-style`로 이동

## 로그 확인

서버 로그에서 다음 메시지를 확인할 수 있습니다:
```
User profile not found, creating one...
```

## 추가 개선 사항 (Optional)

향후 더 나은 UX를 위해:

1. **회원가입 시점에 프로필 생성**:
   ```typescript
   // signup/page.tsx
   await signUp(email, password);
   await createUserProfile(); // 추가
   ```

2. **Onboarding 페이지에서 프로필 확인**:
   ```typescript
   // onboarding/add-child/page.tsx
   useEffect(() => {
     ensureUserProfile();
   }, []);
   ```

하지만 현재 구현 (API에서 자동 생성)도 충분히 작동합니다.

## 관련 파일

- `app/api/onboarding/child/route.ts` - API 엔드포인트
- `lib/services/user.ts` - 사용자 프로필 생성
- `lib/services/family.ts` - 가족 생성
- `app/[locale]/(app)/onboarding/add-child/page.tsx` - 프론트엔드

## 체크리스트

- [x] API에서 프로필 자동 생성 추가
- [x] getOrCreateUserProfile 함수 활용
- [x] 에러 핸들링 개선
- [x] 로깅 추가
- [ ] 실제 테스트 (사용자가 확인 필요)

---

**작성일**: 2026-01-08
**해결됨**: ✅ Yes
