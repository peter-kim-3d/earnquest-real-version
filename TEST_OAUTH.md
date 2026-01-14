# Test Google OAuth Login - Step by Step

## Step 1: Open the Signup Page
Open your browser and go to:
```
http://localhost:3001/en-US/signup
```

You should see the signup page with the "Continue with Google" button.

## Step 2: Click "Continue with Google"
1. Click the **"Continue with Google"** button
2. You'll be redirected to Google's login page

## Step 3: Select Your Google Account
1. Choose your Google account
2. If this is the first time, you might see:
   - "This app isn't verified" warning
   - Click **"Advanced"** → **"Go to EarnQuest (unsafe)"**
   - This is normal for development apps!
3. Grant permissions

## Step 4: Observe the Redirect
After authentication, you should:
1. Be redirected back to: `http://localhost:3001/en-US/callback?code=...`
2. Then automatically redirect to: `http://localhost:3001/en-US/onboarding/add-child`

## Expected Results

✅ **Success**: You land on the onboarding page (add-child)
❌ **Error**: You see an error or get stuck

## Check Authentication in Supabase

1. Go to: https://supabase.com/dashboard/project/blstphkvdrrhtdxrllvx/auth/users
2. You should see your user in the list!
3. The email should match your Google account

## Check the Browser Console

Open DevTools (F12) and check the Console tab for any errors during the flow.

## Common Issues

**"Redirect URI mismatch"**
- The redirect URI in Google Console must be EXACTLY:
  ```
  https://blstphkvdrrhtdxrllvx.supabase.co/auth/v1/callback
  ```
- Check for typos, extra spaces, or trailing slashes

**"This app isn't verified"**
- Normal for development
- Click "Advanced" → "Go to EarnQuest (unsafe)"

**Stuck at callback page**
- Check browser console for errors
- Check that the dev server is running on port 3001

**404 on onboarding page**
- The onboarding page might not be accessible yet
- Check if you see the page or a 404

---

## Ready to Test?

1. Open http://localhost:3001/en-US/signup
2. Click "Continue with Google"
3. Complete the Google login flow
4. Report back what happens!

If you get an error, copy the exact error message from:
- The browser page
- The browser console (F12 → Console tab)
- The terminal where the dev server is running
