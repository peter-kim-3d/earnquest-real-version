# Onboarding Flow Test Results

## Test Steps Completed

- [ ] Step 1: OAuth login with Google
- [ ] Step 2: Add child form (name + age group)
- [ ] Step 3: Select family style (easy/balanced/learning)
- [ ] Step 4: Select family values (optional)
- [ ] Step 5: Complete page reached

## Expected Console Logs

After each step, check browser console (F12 → Console):

### After Step 2 (Add Child):
```javascript
Child created: {
  id: "uuid-here",
  name: "Emma",
  age_group: "8-11",
  family_id: "uuid-here",
  points_balance: 0
}
```

### After Step 3 (Select Style):
```javascript
Populated: {
  success: true,
  tasksCount: 6,  // For "balanced" style
  rewardsCount: 15
}
```

### After Step 4 (Family Values):
```javascript
Saved values: {
  success: true,
  count: 3  // Number of values you selected
}
```

## Verification Command

Run this after completing onboarding:
```bash
node scripts/verify-onboarding.js test.id.peter.k@gmail.com
```

## Expected Database State

Should show:
- ✅ 1 family record
- ✅ 1 user profile
- ✅ 1 child (Emma, age 8-11)
- ✅ 6 tasks (if you chose "balanced")
- ✅ 15 rewards
- ✅ 3+ family values (if not skipped)

## Common Issues

### 404 on API routes
- **Problem**: API routes not compiling
- **Check**: Look for compilation errors in terminal

### "Unauthorized" error
- **Problem**: OAuth session not created
- **Check**: Make sure you completed OAuth login

### No data in console
- **Problem**: Fetch failed silently
- **Check**: Network tab in DevTools for error responses

### Empty database after onboarding
- **Problem**: RLS policies blocking writes
- **Check**: Run `node scripts/test-rls-policies.js` again
