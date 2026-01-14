# OAuth Setup Guide (Google & Apple)

EarnQuest supports social login with Google and Apple. This guide walks you through the setup process.

---

## 🔧 Prerequisites

1. **Supabase Account**: https://supabase.com
2. **Google Cloud Console Access**: https://console.cloud.google.com
3. **Apple Developer Account** (for Apple Sign-In): https://developer.apple.com

---

## 📱 1. Supabase Setup

### Step 1: Access Authentication Settings

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (blstphkvdrrhtdxrllvx)
3. Navigate to **Authentication** → **Providers**

### Step 2: Configure Redirect URLs

In Authentication → **URL Configuration**, add these redirect URLs:

**Site URL:**
```
http://localhost:3001
```

**Redirect URLs (for development):**
```
http://localhost:3001/en-US/callback
http://localhost:3001/*/callback
```

**Redirect URLs (for production - add your domain):**
```
https://yourdomain.com/en-US/callback
https://yourdomain.com/*/callback
```

---

## 🔵 2. Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to **Google Cloud Console**: https://console.cloud.google.com
2. Select or create a project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. If prompted, configure the **OAuth consent screen** first:
   - User Type: **External** (unless you have a Google Workspace)
   - App name: **EarnQuest**
   - User support email: Your email
   - Developer contact: Your email
   - Scopes: Add \`email\` and \`profile\`
   - Save and continue

6. Create **OAuth Client ID**:
   - Application type: **Web application**
   - Name: **EarnQuest**
   - Authorized JavaScript origins:
     ```
     http://localhost:3001
     https://blstphkvdrrhtdxrllvx.supabase.co
     ```
   - Authorized redirect URIs:
     ```
     https://blstphkvdrrhtdxrllvx.supabase.co/auth/v1/callback
     ```

7. Click **CREATE**
8. Copy your **Client ID** and **Client Secret**

### Step 2: Enable Google Provider in Supabase

1. Go back to **Supabase** → **Authentication** → **Providers**
2. Find **Google** in the list
3. Toggle **Enable Sign in with Google**
4. Paste your credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)
5. Click **Save**

---

## 🍎 3. Apple OAuth Setup

### Step 1: Create an App ID

1. Go to **Apple Developer**: https://developer.apple.com/account
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** (to add new)
4. Select **App IDs** → Continue
5. Select **App** → Continue
6. Configure your App ID:
   - Description: **EarnQuest**
   - Bundle ID: **com.earnquest.app** (or your domain reversed)
   - Capabilities: Check **Sign In with Apple**
7. Click **Continue** → **Register**

### Step 2: Create a Services ID

1. In **Identifiers**, click **+** again
2. Select **Services IDs** → Continue
3. Configure:
   - Description: **EarnQuest Web**
   - Identifier: **com.earnquest.web**
   - Check **Sign In with Apple**
4. Click **Configure** next to Sign In with Apple:
   - Primary App ID: Select the App ID you created earlier
   - Web Domain: **blstphkvdrrhtdxrllvx.supabase.co**
   - Return URLs:
     ```
     https://blstphkvdrrhtdxrllvx.supabase.co/auth/v1/callback
     ```
5. Click **Save** → **Continue** → **Register**

### Step 3: Create a Private Key

1. Go to **Keys** → **+**
2. Key Name: **EarnQuest Sign In Key**
3. Check **Sign In with Apple**
4. Click **Configure** → Select your primary App ID
5. Click **Save** → **Continue** → **Register**
6. **Download the .p8 key file** (you can only download this once!)
7. Note the **Key ID** (10-character string)

### Step 4: Get Your Team ID

1. In Apple Developer, go to **Membership**
2. Copy your **Team ID** (10-character string)

### Step 5: Enable Apple Provider in Supabase

1. Go to **Supabase** → **Authentication** → **Providers**
2. Find **Apple** in the list
3. Toggle **Enable Sign in with Apple**
4. Fill in the following:
   - **Services ID**: \`com.earnquest.web\` (from Step 2)
   - **Team ID**: Your 10-character Team ID (from Step 4)
   - **Key ID**: Your 10-character Key ID (from Step 3)
   - **Private Key**: Open your \`.p8\` file in a text editor and paste the entire contents (including \`-----BEGIN PRIVATE KEY-----\` and \`-----END PRIVATE KEY-----\`)
5. Click **Save**

---

## 🧪 4. Testing the Setup

### Test Google Login

1. Start your dev server:
   \`\`\`bash
   npm run dev
   \`\`\`

2. Go to http://localhost:3001/en-US/login

3. Click **Continue with Google**

4. You should be redirected to Google's OAuth screen

5. After authorizing, you should be redirected back to your app and logged in

### Test Apple Login

1. Go to http://localhost:3001/en-US/login

2. Click **Continue with Apple**

3. You should be redirected to Apple's OAuth screen

4. After authorizing, you should be redirected back to your app and logged in

---

## 🚨 Common Issues

### Google OAuth Error: "redirect_uri_mismatch"

**Solution**: Make sure you added the exact Supabase callback URL to Google Cloud Console:
```
https://blstphkvdrrhtdxrllvx.supabase.co/auth/v1/callback
```

### Apple OAuth Error: "invalid_client"

**Solution**:
- Verify your Services ID matches exactly
- Check that the Team ID is correct
- Ensure the Private Key was pasted completely (including BEGIN/END lines)
- Make sure you created the key for Sign In with Apple

### "Email not verified" Error

**Solution**: In Supabase → Authentication → Settings:
- Disable "Confirm email" if you want instant sign-ups
- Or configure your email templates for verification

---

## 🌐 Production Setup

When deploying to production, you'll need to:

### 1. Update Supabase Redirect URLs

Add your production domain:
```
https://yourdomain.com/en-US/callback
https://yourdomain.com/*/callback
```

### 2. Update Google OAuth

In Google Cloud Console, add:
- Authorized JavaScript origins: \`https://yourdomain.com\`
- Keep the Supabase callback URL

### 3. Update Apple OAuth

In Apple Developer → Services ID:
- Add your production domain to Web Domain
- Keep the Supabase callback URL

### 4. Update Environment Variables

In your production environment (Vercel, etc.), set:
```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 📝 Environment Variables Summary

Your \`.env.local\` should have:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://blstphkvdrrhtdxrllvx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001
\`\`\`

**Note**: You do NOT need to add Google/Apple credentials to your \`.env\` file. They are stored securely in Supabase.

---

## ✅ Quick Start Checklist

**당신이 해야 할 일 (순서대로):**

### A. Supabase 설정 (5분)
- [ ] https://supabase.com/dashboard → 프로젝트 선택
- [ ] Authentication → URL Configuration → Redirect URLs 추가:
  - \`http://localhost:3001/en-US/callback\`
  - \`http://localhost:3001/*/callback\`

### B. Google OAuth 설정 (10분)
- [ ] https://console.cloud.google.com → 프로젝트 생성/선택
- [ ] APIs & Services → Credentials → OAuth consent screen 설정
  - App name: EarnQuest
  - Scopes: email, profile
- [ ] OAuth Client ID 생성:
  - Type: Web application
  - Authorized redirect: \`https://blstphkvdrrhtdxrllvx.supabase.co/auth/v1/callback\`
- [ ] Client ID와 Secret 복사
- [ ] Supabase → Authentication → Providers → Google 활성화
- [ ] Client ID, Secret 붙여넣기 → Save

### C. Apple OAuth 설정 (15분) - 선택사항
**Apple Developer 계정 필요 ($99/year)**

- [ ] https://developer.apple.com/account
- [ ] Identifiers → App ID 생성 (Sign In with Apple 체크)
- [ ] Services ID 생성:
  - Identifier: com.earnquest.web
  - Domain: blstphkvdrrhtdxrllvx.supabase.co
  - Return URL: \`https://blstphkvdrrhtdxrllvx.supabase.co/auth/v1/callback\`
- [ ] Keys → Sign In with Apple Key 생성 → .p8 다운로드
- [ ] Team ID, Key ID 메모
- [ ] Supabase → Providers → Apple 활성화
- [ ] Services ID, Team ID, Key ID, Private Key(.p8 내용) 입력 → Save

### D. 테스트 (2분)
- [ ] \`npm run dev\` 실행
- [ ] http://localhost:3001/en-US/login 접속
- [ ] "Continue with Google" 클릭 → 로그인 성공 확인
- [ ] (선택) "Continue with Apple" 클릭 → 로그인 성공 확인

---

## 🆘 문제 해결

**"redirect_uri_mismatch" 에러**
→ Google Cloud Console에서 정확한 Supabase callback URL 확인

**Apple 로그인 안됨**
→ Apple Developer 계정 필요 (연간 $99)
→ 없으면 Google만 사용하세요

**이메일 인증 필요 에러**
→ Supabase → Authentication → Email Auth → "Confirm email" 끄기

---

**Last Updated**: 2026-01-08
