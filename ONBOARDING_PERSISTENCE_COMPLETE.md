# ✅ Onboarding Data Persistence - Complete!

## What We Implemented

### 1. Database Service Layer
Created reusable services in `lib/services/`:

**`family.ts`** - Family operations
- `createFamily()` - Creates family with default settings
- `getFamily()` - Fetches family by ID
- `updateFamilySettings()` - Updates family settings

**`user.ts`** - User operations
- `createUser()` - Creates user profile in users table
- `getOrCreateUserProfile()` - Auto-creates family + user after OAuth
- `getUser()` - Fetches user by ID
- `updateUser()` - Updates user profile

**`child.ts`** - Child operations
- `createChild()` - Creates child profile
- `getChildren()` - Fetches all children for a family
- `getChild()` - Fetches single child
- `updateChild()` - Updates child profile

**`onboarding.ts`** - Onboarding operations
- `populateTasksAndRewards()` - Creates tasks/rewards from templates based on style + age
- `saveFamilyValues()` - Saves family values (no-point zone behaviors)
- `getOnboardingStatus()` - Checks onboarding completion status

### 2. API Routes
Created in `app/api/onboarding/`:

**`POST /api/onboarding/child`** - Creates child profile
- Requires: name, ageGroup
- Returns: created child object

**`POST /api/onboarding/populate`** - Populates tasks/rewards
- Requires: style, childId, ageGroup
- Filters templates by style (`easy`/`balanced`/`learning`) and ageGroup
- Creates ~3-17 tasks and ~15 rewards
- Returns: count of created tasks and rewards

**`POST /api/onboarding/values`** - Saves family values
- Requires: values array (title, description)
- Returns: count of saved values

### 3. Updated OAuth Callback
**`app/[locale]/(auth)/callback/route.ts`**
- After successful OAuth login:
  1. Exchanges code for session
  2. Creates family record (if new user)
  3. Creates user profile in `users` table
  4. Redirects to onboarding

### 4. Updated Onboarding Pages

**Add Child Page** (`onboarding/add-child/page.tsx`)
- Calls `/api/onboarding/child` to save child
- Stores `child_id` and `age_group` in sessionStorage
- Navigates to select-style

**Select Style Page** (`onboarding/select-style/page.tsx`)
- Retrieves child data from sessionStorage
- Calls `/api/onboarding/populate` with selected style
- Populates tasks/rewards from templates
- Navigates to family-values

**Family Values Page** (`onboarding/family-values/page.tsx`)
- Calls `/api/onboarding/values` to save selected values
- Navigates to complete

---

## Data Flow

```
1. OAuth Login
   ↓
2. Create Family + User Profile (automatic)
   ↓
3. Add Child → Save to `children` table
   ↓
4. Select Style → Populate `tasks` and `rewards` from templates
   ↓
5. Family Values → Save to `family_values` table
   ↓
6. Complete!
```

---

## Testing the Flow

### Step 1: Clear Previous Data (Optional)
If you want to test with fresh data, run in Supabase SQL Editor:

```sql
-- Clear test data (ONLY for testing!)
DELETE FROM family_values WHERE family_id IN (SELECT family_id FROM users WHERE email = 'test.id.peter.k@gmail.com');
DELETE FROM rewards WHERE family_id IN (SELECT family_id FROM users WHERE email = 'test.id.peter.k@gmail.com');
DELETE FROM tasks WHERE family_id IN (SELECT family_id FROM users WHERE email = 'test.id.peter.k@gmail.com');
DELETE FROM children WHERE family_id IN (SELECT family_id FROM users WHERE email = 'test.id.peter.k@gmail.com');
DELETE FROM users WHERE email = 'test.id.peter.k@gmail.com';
DELETE FROM families WHERE id IN (SELECT family_id FROM users WHERE email = 'test.id.peter.k@gmail.com');

-- Note: Run DELETE FROM users before families due to foreign key
```

### Step 2: Test OAuth + Onboarding Flow

1. **Open**: http://localhost:3001/en-US/signup
2. **Click**: "Continue with Google"
3. **Login** with Google account
4. **Redirected to**: `/en-US/onboarding/add-child`

### Step 3: Add Child
1. **Enter** child's name (e.g., "Leo")
2. **Select** age group (e.g., "8-11")
3. **Click** "Save & Continue"
4. **Check console** for "Child created: {...}"

### Step 4: Select Style
1. **Choose** a style:
   - Easy Start (3 tasks, 3 rewards)
   - Balanced (6 tasks, 7 rewards) ← Recommended
   - Learning Focus (8 tasks, higher learning rewards)
2. **Click** "Save & Continue"
3. **Check console** for "Populated: {...tasksCount, rewardsCount}"

### Step 5: Family Values
1. **Toggle** values on/off (optional)
2. **Click** "Complete Setup" or "Skip"
3. **Check console** for "Saved values: {...}"
4. **Redirected to**: `/en-US/onboarding/complete`

---

## Verify in Supabase Dashboard

### Check Families Table
```sql
SELECT * FROM families ORDER BY created_at DESC LIMIT 1;
```
Should show 1 family with your settings.

### Check Users Table
```sql
SELECT * FROM users WHERE email = 'test.id.peter.k@gmail.com';
```
Should show your user profile linked to the family.

### Check Children Table
```sql
SELECT * FROM children ORDER BY created_at DESC LIMIT 1;
```
Should show the child you created (Leo, age 8-11, etc.).

### Check Tasks Table
```sql
SELECT COUNT(*), category FROM tasks
WHERE family_id = (SELECT family_id FROM users WHERE email = 'test.id.peter.k@gmail.com')
GROUP BY category;
```
Should show tasks grouped by category (hygiene, chores, learning, etc.).

**Expected counts by style:**
- Easy: 3 tasks
- Balanced: 6 tasks
- Learning: 8 tasks

### Check Rewards Table
```sql
SELECT COUNT(*), category FROM rewards
WHERE family_id = (SELECT family_id FROM users WHERE email = 'test.id.peter.k@gmail.com')
GROUP BY category;
```
Should show rewards grouped by category (screen, autonomy, experience, savings).

**Expected counts:**
- All styles: ~15 rewards (filtered by age_group)

### Check Family Values Table
```sql
SELECT * FROM family_values
WHERE family_id = (SELECT family_id FROM users WHERE email = 'test.id.peter.k@gmail.com');
```
Should show the values you selected (e.g., "Express Gratitude", "Family Greetings", etc.).

---

## Expected Results

✅ **Family created** with default settings
✅ **User profile created** with OAuth email/name
✅ **Child profile created** with name and age group
✅ **Tasks populated** from templates (filtered by style + age)
✅ **Rewards populated** from templates (filtered by style + age)
✅ **Family values saved** (if not skipped)

---

## Common Issues & Solutions

### "Unauthorized" error
- **Problem**: User session not found
- **Solution**: Make sure you're logged in via OAuth first

### "User profile not found" error
- **Problem**: User profile wasn't created after OAuth
- **Solution**: Check callback route, ensure `getOrCreateUserProfile()` ran successfully

### "Please add a child first" alert
- **Problem**: Session storage empty
- **Solution**: Go back to add-child page, complete that step first

### Tasks/rewards not populating
- **Problem**: No matching templates for style+ageGroup
- **Solution**: Check `task_templates` and `reward_templates` tables have seed data

### Permission denied errors
- **Problem**: RLS policies blocking access
- **Solution**: Re-run permissions fix SQL (from earlier)

---

## What's Next?

Now that onboarding persistence is complete, you can:

1. **Build Parent Dashboard** - View children, approve tasks, manage family
2. **Build Child Dashboard** - View tasks, submit completions, earn points
3. **Implement Task Completion Flow** - Submit → Approve → Award points
4. **Implement Reward Purchase Flow** - Spend points → Get tickets
5. **Add Profile Management** - Edit child/family settings

---

## Testing Commands

Run these in your terminal to verify:

```bash
# Check if user exists
node scripts/check-auth-user.js

# Check tables
node scripts/check-tables.js

# View server logs
# (Check the terminal where npm run dev is running)
```

---

## Success Checklist

Before moving to next phase, verify:

- [ ] OAuth login creates family + user profile
- [ ] Add child form saves to database
- [ ] Select style populates tasks/rewards from templates
- [ ] Family values saves to database
- [ ] All data visible in Supabase dashboard
- [ ] No errors in browser console
- [ ] No errors in server logs

**Ready to test!** 🚀

Follow the steps above and let me know if you encounter any issues!
