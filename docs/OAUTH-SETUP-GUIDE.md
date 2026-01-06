# OAuth Setup Guide for EarnQuest

This guide walks you through setting up Google and Apple OAuth for EarnQuest authentication.

---

## Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name: **EarnQuest**
4. Click "Create"

### Step 2: Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Click "Create"

**App Information:**
- App name: `EarnQuest`
- User support email: Your email
- App logo: (optional for now)

**App domain:**
- Application home page: `https://earnquest2.vercel.app`
- Privacy policy: `https://earnquest2.vercel.app/privacy` (create later)
- Terms of service: `https://earnquest2.vercel.app/terms` (create later)

**Authorized domains:**
- `vercel.app`
- `earnquest2.vercel.app` (if using custom domain)

**Developer contact information:**
- Your email

Click **Save and Continue**

**Scopes:**
- Add these scopes:
  - `userinfo.email`
  - `userinfo.profile`
  - `openid`

Click **Save and Continue** → **Back to Dashboard**

### Step 3: Create OAuth Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `EarnQuest Web`

**Authorized JavaScript origins:**
```
http://localhost:3000
https://earnquest2.vercel.app
```

**Authorized redirect URIs:**
```
http://localhost:3000/en-US/auth/callback
http://localhost:3000/ko-KR/auth/callback
https://blstphkvdrrhtdxrllvx.supabase.co/auth/v1/callback
https://earnquest2.vercel.app/en-US/auth/callback
https://earnquest2.vercel.app/ko-KR/auth/callback
```

5. Click **Create**
6. **Copy** the Client ID and Client Secret

### Step 4: Configure in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/blstphkvdrrhtdxrllvx/auth/providers)
2. Click **Authentication** → **Providers**
3. Find **Google** and toggle it **Enabled**
4. Paste your **Client ID** and **Client Secret**
5. Click **Save**

---

## Apple OAuth Setup

### Step 1: Apple Developer Account

You need an **Apple Developer Account** ($99/year).

**For MVP Testing:** You can skip Apple OAuth for now and just use Google. Add Apple later before production launch.

### Step 2: Create App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** (plus button)
4. Select **App IDs** → Continue
5. Select **App** → Continue

**App ID Configuration:**
- Description: `EarnQuest`
- Bundle ID: `com.earnquest.webapp` (Explicit)
- Capabilities: Check **Sign in with Apple**

Click **Continue** → **Register**

### Step 3: Create Services ID

1. Click **Identifiers** → **+** (plus button)
2. Select **Services IDs** → Continue

**Services ID Configuration:**
- Description: `EarnQuest Web`
- Identifier: `com.earnquest.webapp.service`
- Check **Sign in with Apple**

Click **Continue** → **Register**

### Step 4: Configure Services ID

1. Click on the Services ID you just created
2. Check **Sign in with Apple** → Click **Configure**

**Web Authentication Configuration:**
- Primary App ID: Select `EarnQuest` (the App ID from Step 2)
- Domains and Subdomains:
  ```
  earnquest2.vercel.app
  blstphkvdrrhtdxrllvx.supabase.co
  ```
- Return URLs:
  ```
  https://blstphkvdrrhtdxrllvx.supabase.co/auth/v1/callback
  ```

Click **Save** → **Continue** → **Register**

### Step 5: Create Private Key

1. Navigate to **Keys** → **+** (plus button)
2. Key Name: `EarnQuest Sign in with Apple Key`
3. Check **Sign in with Apple**
4. Click **Configure** → Select your App ID
5. Click **Save** → **Continue** → **Register**
6. **Download** the `.p8` key file
7. **Copy** the Key ID (you'll need this)

### Step 6: Get Team ID

1. Go to **Membership** in the sidebar
2. Copy your **Team ID** (10-character string)

### Step 7: Configure in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/blstphkvdrrhtdxrllvx/auth/providers)
2. Click **Authentication** → **Providers**
3. Find **Apple** and toggle it **Enabled**
4. Fill in:
   - **Services ID**: `com.earnquest.webapp.service`
   - **Team ID**: Your Team ID from Step 6
   - **Key ID**: The Key ID from Step 5
   - **Private Key**: Open the `.p8` file and paste the contents
5. Click **Save**

---

## Configure Supabase Auth Settings

### Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. **Site URL**: `https://earnquest2.vercel.app/en-US`
3. **Redirect URLs** (add all of these):
   ```
   http://localhost:3000/en-US/auth/callback
   http://localhost:3000/ko-KR/auth/callback
   https://earnquest2.vercel.app/en-US/auth/callback
   https://earnquest2.vercel.app/ko-KR/auth/callback
   ```

### Email Templates (Optional for OAuth)

You can customize these later when adding email auth:
- **Authentication** → **Email Templates**

---

## Testing OAuth Locally

### Step 1: Update .env.local

Your `.env.local` should already have:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://blstphkvdrrhtdxrllvx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### Step 2: Start Development Server

```bash
npm run dev
```

### Step 3: Test Login Flow

1. Go to `http://localhost:3000/en-US/login`
2. Click "Continue with Google"
3. Sign in with your Google account
4. Should redirect to `/en-US/auth/callback`
5. Then redirect to dashboard (once implemented)

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Google OAuth credentials include production URLs
- [ ] Apple OAuth Services ID includes production domains
- [ ] Supabase redirect URLs include production URLs
- [ ] Update Google OAuth consent screen to "Published" status
- [ ] Test OAuth flow on production domain
- [ ] Set up custom domain (optional)
- [ ] Update Site URL in Supabase to production domain

---

## Troubleshooting

### "redirect_uri_mismatch" Error (Google)

- Check that redirect URI in Google Console exactly matches Supabase callback URL
- Must include `https://[project-ref].supabase.co/auth/v1/callback`

### Apple OAuth Not Working

- Verify Services ID is configured with correct domains
- Check that `.p8` key file contents are copied correctly
- Ensure Team ID and Key ID are correct
- Apple requires HTTPS (won't work on localhost)

### "Invalid OAuth State" Error

- Clear browser cookies and try again
- Check that Supabase project URL is correct in `.env.local`

---

## Quick Start (Development)

**Minimum setup for development:**

1. ✅ Set up Google OAuth (10 minutes)
2. ⏭️ Skip Apple OAuth for now (add before production)
3. ✅ Configure Supabase redirect URLs
4. ✅ Test with Google login

You can add Apple OAuth later when you're ready to deploy to production!
