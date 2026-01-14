# Google OAuth Testing Guide

## Current Implementation Status

### ✅ Code Implementation: COMPLETE

All technical code for Google OAuth is implemented and ready:

**Auth Service** (`lib/services/auth.ts`):
```typescript
export async function signInWithGoogle() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/en-US/callback`,
    },
  });
  // ...
}
```

**Callback Handler** (`app/[locale]/(auth)/callback/route.ts`):
- ✅ Exchanges OAuth code for session
- ✅ Creates user profile automatically
- ✅ Redirects to onboarding

**UI Components**:
- ✅ Login page: Google button implemented
- ✅ Signup page: Google button implemented
- ✅ Apple button: Hidden (controlled by environment variable)

### ✅ Environment Variables: CONFIGURED

```bash
NEXT_PUBLIC_SUPABASE_URL=https://blstphkvdrrhtdxrllvx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (configured)
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### ⚠️ Supabase Configuration: REQUIRED

The following configuration must be done manually in Supabase Dashboard:

1. **Enable Google Provider**
   - Go to Supabase Dashboard → Authentication → Providers
   - Find "Google" in the provider list
   - Toggle it ON (green)

2. **Add Redirect URLs**
   - Go to Authentication → URL Configuration
   - Add these redirect URLs:
     ```
     http://localhost:3001/en-US/callback
     http://localhost:3001/*/callback
     https://blstphkvdrrhtdxrllvx.supabase.co/auth/v1/callback
     ```

3. **Configure Google OAuth Client**
   - Create OAuth Client in Google Cloud Console
   - Get Client ID and Client Secret
   - Add them to Supabase → Authentication → Providers → Google

## OAuth Flow Diagram

```
User                 App                  Supabase            Google
  |                   |                      |                  |
  |-- Click Button -->|                      |                  |
  |                   |-- signInWithOAuth -->|                  |
  |                   |                      |-- Redirect ----> |
  |                   |                      |                  |
  |<----------------------- Google Login Screen ---------------|
  |                   |                      |                  |
  |-- Allow Access -->|                      |                  |
  |                   |<-------- Redirect with code ------------|
  |                   |                      |                  |
  |                   |-- /callback route -->|                  |
  |                   |<- Exchange code ----|                  |
  |                   |<- Session created --|                  |
  |                   |                      |                  |
  |                   |-- Create user profile                   |
  |                   |                      |                  |
  |<- /onboarding/add-child                 |                  |
```

## How to Test

### Before Supabase Configuration

If you click "Continue with Google" **before** configuring Supabase:

```
Expected behavior:
- Button click triggers signInWithGoogle()
- Supabase attempts OAuth redirect
- ERROR: Provider not enabled
- User sees error message or stuck loading
```

### After Supabase Configuration

Once you complete the setup in `GOOGLE_OAUTH_SETUP.md`:

```
Expected behavior:
1. User clicks "Continue with Google"
2. Redirects to Google login page
3. User selects Google account
4. Google redirects back to app
5. Callback creates user profile
6. Redirects to /en-US/onboarding/add-child
7. ✅ SUCCESS - User is logged in
```

## Quick Test Checklist

- [ ] Dev server running on http://localhost:3001
- [ ] Visit http://localhost:3001/en-US/login
- [ ] "Continue with Google" button visible
- [ ] "Continue with Apple" button hidden
- [ ] Click Google button
- [ ] If error: Complete Supabase configuration
- [ ] If redirect: OAuth is working!

## Troubleshooting

### Button does nothing when clicked
- Check browser console for errors
- Verify environment variables are loaded (restart server)
- Check Supabase Provider is enabled

### "Provider not enabled" error
- Go to Supabase → Authentication → Providers
- Enable Google provider
- Add Client ID and Secret

### "Redirect URI mismatch" error
- Verify redirect URL in Google Cloud Console matches:
  `https://blstphkvdrrhtdxrllvx.supabase.co/auth/v1/callback`
- Check for trailing spaces or typos

### Session not created after redirect
- Check browser Network tab for callback request
- Verify callback route is handling code exchange
- Check Supabase logs for errors

## Technical Notes

**Current Status:**
- Code: ✅ 100% Complete
- Environment: ✅ 100% Complete
- Supabase Config: ⚠️ Requires manual setup (15-20 min)

**Files Involved:**
- `lib/services/auth.ts` - OAuth functions
- `app/[locale]/(auth)/login/page.tsx` - Login UI
- `app/[locale]/(auth)/signup/page.tsx` - Signup UI
- `app/[locale]/(auth)/callback/route.ts` - OAuth callback
- `lib/supabase/middleware.ts` - Session management

**Next Step:**
Follow step-by-step instructions in `GOOGLE_OAUTH_SETUP.md` to complete the Supabase configuration.
