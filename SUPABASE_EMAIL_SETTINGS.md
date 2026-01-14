# Supabase 이메일 확인 설정 가이드

## 문제 상황

이메일로 회원가입 후 "Invalid login credentials" 에러가 발생하는 경우:
- **원인**: Supabase에서 이메일 확인이 필수로 설정되어 있음
- **증상**: 회원가입 후 확인 이메일을 받았지만, 확인 후에도 로그인 안 됨

---

## 해결 방법 1: 이메일 확인 비활성화 (개발 환경 권장)

### Supabase Dashboard 설정

1. **Supabase Dashboard 접속**
   - URL: https://supabase.com/dashboard
   - 프로젝트 선택: `blstphkvdrrhtdxrllvx`

2. **Authentication 메뉴로 이동**
   - 왼쪽 메뉴에서 **Authentication** 클릭
   - **Providers** 탭 클릭

3. **Email Provider 설정**
   - Provider 목록에서 **Email** 찾기
   - 클릭해서 설정 열기

4. **Confirm email 옵션 끄기**
   - **"Confirm email"** 토글 찾기
   - 토글을 **OFF (회색)** 으로 변경
   - **Save** 버튼 클릭

5. **결과**
   - 이제 회원가입 후 바로 로그인 가능
   - 이메일 확인 필요 없음
   - 개발/테스트 환경에 적합

---

## 해결 방법 2: 이메일 확인 유지 (프로덕션 권장)

이메일 확인을 유지하고 사용자 경험을 개선:

### 현재 구현된 기능 (이미 적용됨)

1. **회원가입 시**
   - ✅ 회원가입 성공 메시지 표시
   - ✅ "이메일을 확인해주세요" 안내 표시
   - ✅ 초록색 박스로 명확한 피드백

2. **로그인 시도 시**
   - ✅ "Invalid login credentials" 대신 명확한 메시지:
     - "Invalid email or password. If you just signed up, please check your email to verify your account first."
   - ✅ 이메일 미확인 상태 감지
   - ✅ 사용자에게 명확한 안내

### 사용자 플로우

```
회원가입 (signup)
  ↓
✅ "Account created! Please check your email..."
  ↓
사용자가 이메일 확인
  ↓
확인 링크 클릭
  ↓
이메일 확인 완료
  ↓
로그인 페이지로 이동
  ↓
이메일/비밀번호 입력
  ↓
✅ 로그인 성공 → 대시보드
```

---

## 이메일 확인 이슈 해결

### 문제: 이메일 확인 후에도 로그인 안 됨

**가능한 원인:**

1. **이메일 확인 링크를 잘못 클릭**
   - 확인 링크가 올바른 URL로 리디렉트되었는지 확인
   - 예상 URL: `http://localhost:3001/en-US/callback?code=...`

2. **Supabase 확인 링크 설정 확인**
   ```
   Supabase Dashboard → Authentication → URL Configuration → Redirect URLs

   확인할 URL:
   - http://localhost:3001/en-US/callback
   - http://localhost:3001/*/callback
   ```

3. **이메일 템플릿 확인**
   ```
   Supabase Dashboard → Authentication → Email Templates → Confirm signup

   확인할 내용:
   - Redirect URL이 올바른지 확인
   - {{ .ConfirmationURL }} 사용하는지 확인
   ```

4. **브라우저 캐시/쿠키**
   - 브라우저 캐시 삭제
   - 시크릿 모드에서 다시 시도

5. **비밀번호 확인**
   - 정확한 비밀번호 입력했는지 재확인
   - 회원가입 시 입력한 비밀번호와 동일한지 확인

---

## 테스트 방법

### 테스트 1: 이메일 확인 비활성화 (빠른 테스트용)

```bash
# 1. Supabase에서 "Confirm email" OFF
# 2. 새 이메일로 회원가입
# 3. 바로 로그인 시도
# 4. ✅ 성공 → 대시보드로 이동
```

### 테스트 2: 이메일 확인 활성화 (실제 플로우)

```bash
# 1. Supabase에서 "Confirm email" ON
# 2. 새 이메일로 회원가입
# 3. ✅ "Account created! Please check your email..." 메시지 표시
# 4. 이메일 받기
# 5. 확인 링크 클릭
# 6. 로그인 페이지로 이동
# 7. 로그인 시도
# 8. ✅ 성공 → 대시보드로 이동
```

---

## 현재 코드 개선 사항

### 1. `lib/services/auth.ts:35-60`

**개선된 에러 메시지:**
```typescript
// 이메일 미확인 감지
if (error.message.includes('Email not confirmed')) {
  throw new Error('Please verify your email address before logging in...');
}

// 일반 로그인 실패 시 친절한 안내
if (error.message.includes('Invalid login credentials')) {
  throw new Error('Invalid email or password. If you just signed up, please check your email to verify your account first.');
}
```

### 2. `app/[locale]/(auth)/signup/page.tsx:66-94`

**회원가입 성공 처리:**
```typescript
// 이메일 확인 필요 시 안내 메시지
if (result.user && !result.user.email_confirmed_at) {
  setSuccess('Account created! Please check your email to verify your account before logging in.');
  return;
}
```

---

## 권장 설정

### 개발 환경 (localhost)
- **이메일 확인: OFF**
- 빠른 테스트 가능
- 이메일 확인 플로우 건너뛰기

### 프로덕션 환경 (배포 후)
- **이메일 확인: ON**
- 보안 강화
- 스팸 계정 방지
- 실제 이메일 확인

---

## 요약

| 설정 | 장점 | 단점 | 권장 환경 |
|------|------|------|-----------|
| **이메일 확인 OFF** | • 빠른 테스트<br>• 바로 로그인 가능<br>• 개발 편의성 | • 보안 취약<br>• 가짜 이메일 가능 | 개발/테스트 |
| **이메일 확인 ON** | • 보안 강화<br>• 실제 이메일 확인<br>• 스팸 방지 | • 추가 단계 필요<br>• 이메일 전송 필요 | 프로덕션 |

---

## 문제 해결 체크리스트

- [ ] Supabase에서 "Confirm email" 설정 확인
- [ ] Redirect URLs 올바르게 설정되었는지 확인
- [ ] 이메일 템플릿 확인
- [ ] 회원가입 후 이메일 수신 확인
- [ ] 확인 링크 클릭 후 올바른 페이지로 이동하는지 확인
- [ ] 정확한 비밀번호 입력 확인
- [ ] 브라우저 캐시 삭제 후 재시도

---

**작성일**: 2026-01-08
**버전**: 1.0
