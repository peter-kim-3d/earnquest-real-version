# Google OAuth 설정 가이드

EarnQuest에서 Google 로그인을 사용하려면 다음 설정이 필요합니다.

---

## 📋 해야 할 일 요약

1. **Supabase**: Redirect URL 설정 (5분)
2. **Google Cloud Console**: OAuth 클라이언트 생성 (10분)
3. **Supabase**: Google Provider 연결 (2분)
4. **테스트**: 로그인 확인 (1분)

**총 소요 시간: 약 15-20분**

---

## 1️⃣ Supabase 설정

### URL: https://supabase.com/dashboard

1. 프로젝트 선택: `blstphkvdrrhtdxrllvx`
2. 왼쪽 메뉴에서 **Authentication** 클릭
3. **URL Configuration** 탭 클릭
4. **Redirect URLs** 섹션에 다음 추가:
   ```
   http://localhost:3001/en-US/callback
   http://localhost:3001/*/callback
   ```
5. **Save** 버튼 클릭

---

## 2️⃣ Google Cloud Console 설정

### URL: https://console.cloud.google.com

### A. 프로젝트 생성 (이미 있으면 선택)

1. 상단의 프로젝트 드롭다운 클릭
2. **NEW PROJECT** 클릭
3. Project name: `EarnQuest` (또는 원하는 이름)
4. **CREATE** 클릭

### B. OAuth Consent Screen 설정

1. 왼쪽 메뉴: **APIs & Services** → **OAuth consent screen**
2. User Type: **External** 선택 → **CREATE**
3. App information 입력:
   - App name: `EarnQuest`
   - User support email: 본인 이메일 선택
   - Developer contact information: 본인 이메일 입력
4. **SAVE AND CONTINUE** 클릭
5. Scopes 페이지:
   - **ADD OR REMOVE SCOPES** 클릭
   - `.../auth/userinfo.email` 체크
   - `.../auth/userinfo.profile` 체크
   - **UPDATE** 클릭
   - **SAVE AND CONTINUE** 클릭
6. Test users 페이지: 그냥 **SAVE AND CONTINUE** (선택사항)
7. Summary 페이지: **BACK TO DASHBOARD** 클릭

### C. OAuth Client ID 생성

1. 왼쪽 메뉴: **Credentials**
2. 상단의 **+ CREATE CREDENTIALS** 클릭
3. **OAuth client ID** 선택
4. Application type: **Web application** 선택
5. Name: `EarnQuest Web Client`
6. **Authorized JavaScript origins** 섹션:
   - **+ ADD URI** 클릭
   - 입력: `http://localhost:3001`
   - **+ ADD URI** 다시 클릭
   - 입력: `https://blstphkvdrrhtdxrllvx.supabase.co`
7. **Authorized redirect URIs** 섹션:
   - **+ ADD URI** 클릭
   - 입력: `https://blstphkvdrrhtdxrllvx.supabase.co/auth/v1/callback`
   
   ⚠️ **중요**: 정확히 입력하세요. 한 글자라도 틀리면 작동하지 않습니다!
   
8. **CREATE** 버튼 클릭
9. 팝업 창에서 **Client ID**와 **Client Secret** 복사
   - 메모장에 저장해두세요!

---

## 3️⃣ Supabase에 Google 연결

### URL: https://supabase.com/dashboard

1. 프로젝트 선택: `blstphkvdrrhtdxrllvx`
2. **Authentication** → **Providers** 탭
3. Provider 목록에서 **Google** 찾기
4. **Enable Sign in with Google** 토글을 켜기 (초록색)
5. 복사한 값 붙여넣기:
   - **Client ID (for OAuth)**: Google에서 복사한 Client ID
   - **Client Secret (for OAuth)**: Google에서 복사한 Client Secret
6. **Save** 버튼 클릭

---

## 4️⃣ 테스트

1. 터미널에서 dev 서버 실행:
   ```bash
   npm run dev
   ```

2. 브라우저에서 열기:
   ```
   http://localhost:3001/en-US/login
   ```

3. **Continue with Google** 버튼 클릭

4. Google 계정 선택하고 권한 허용

5. 자동으로 온보딩 페이지(`/en-US/onboarding/add-child`)로 이동하면 **성공!** ✅

---

## 🚨 문제 해결

### "redirect_uri_mismatch" 에러

**원인**: Google Cloud Console에 잘못된 redirect URI 입력

**해결**:
1. Google Cloud Console → Credentials로 돌아가기
2. 만든 OAuth Client 클릭
3. Authorized redirect URIs 확인:
   ```
   https://blstphkvdrrhtdxrllvx.supabase.co/auth/v1/callback
   ```
4. 정확히 일치하는지 확인 (앞뒤 공백 없어야 함)

### Google 로그인 버튼 클릭해도 아무 반응 없음

**원인**: Supabase에서 Google Provider 활성화 안 됨

**해결**:
- Supabase → Authentication → Providers
- Google 토글이 초록색(켜진 상태)인지 확인
- Client ID와 Secret이 제대로 입력되었는지 확인

### "Email not verified" 에러

**원인**: Supabase에서 이메일 인증 필수로 설정됨

**해결**:
1. Supabase → Authentication → Providers
2. **Email** provider 찾기
3. **Confirm email** 토글 끄기
4. Save

---

## 🍎 Apple 로그인은요?

Apple 로그인은 **Apple Developer 계정**이 필요합니다 (연간 $99).

**현재 설정**: Apple 버튼은 숨겨져 있습니다.

**나중에 활성화하려면**:
1. Apple Developer 계정 생성
2. `.env.local` 파일 수정:
   ```
   NEXT_PUBLIC_ENABLE_APPLE_LOGIN=true
   ```
3. `OAUTH_SETUP.md` 파일의 Apple 섹션 참고

**지금은**: Google 로그인만으로도 충분히 작동합니다!

---

## ✅ 체크리스트

- [ ] Supabase Redirect URLs 추가
- [ ] Google Cloud Console 프로젝트 생성
- [ ] OAuth Consent Screen 설정
- [ ] OAuth Client ID 생성
- [ ] Client ID와 Secret 복사
- [ ] Supabase에서 Google Provider 활성화
- [ ] Client ID와 Secret 입력
- [ ] 테스트 성공!

---

**작성일**: 2026-01-08
**예상 소요 시간**: 15-20분
