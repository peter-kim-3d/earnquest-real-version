# EarnQuest - Complete Flow Testing Guide

## Testing the Full Task → Reward Cycle

This guide will walk you through testing the complete EarnQuest flow from onboarding to reward fulfillment.

---

## Test Flow Overview

1. **Parent Onboarding** - Create account and add child
2. **Setup** - Create custom tasks and rewards
3. **Child Task Completion** - Kid completes tasks and earns points
4. **Parent Approval** - Parent approves completed tasks
5. **Reward Purchase** - Child spends points on rewards
6. **Reward Fulfillment** - Parent grants purchased rewards

---

## Detailed Testing Steps

### 1. Parent Onboarding (5 minutes)

**URL:** `http://localhost:3001/en-US/signup`

**Steps:**
1. Click "Sign up with Google" or use email/password
2. Complete OAuth flow or email verification
3. **Add Child:**
   - Name: "Alex"
   - Age Group: 8-11
   - Avatar: Pick any
   - Click "[+ Add another child]" to test multiple children (optional)
4. **Select Style:**
   - Choose "Balanced" (6 tasks, 7 rewards)
5. **Family Values:**
   - Check 2-3 values (optional)
   - Click "Continue"
6. **Ready to Start:**
   - Click "Start Now"

**Expected Result:**
- Redirected to parent dashboard (`/en-US/dashboard`)
- See welcome message with your name
- See child card(s)
- Action Center shows "No pending approvals"

---

### 2. Create Custom Task (2 minutes)

**URL:** `http://localhost:3001/en-US/tasks`

**Steps:**
1. Click "Tasks" in navigation
2. Click "New Task" button
3. **Fill form:**
   - Name: "Make Your Bed"
   - Description: "Make your bed neatly before breakfast"
   - Category: Chores (🏠)
   - Points: 50
   - Frequency: Daily
   - Approval Type: Manual
4. Click "Create Task"

**Expected Result:**
- New task appears in "🏠 Chores" section
- Task card shows:
  - Points: 50 QP
  - Frequency: Daily
  - Approval: Manual
  - Completion count: 0×

**Test Actions:**
- Click "..." menu → Edit task (verify form opens with data)
- Click "..." menu → Deactivate (verify task grays out)
- Click "..." menu → Activate (verify task becomes active again)

---

### 3. Create Custom Reward (2 minutes)

**URL:** `http://localhost:3001/en-US/rewards`

**Steps:**
1. Click "Rewards" in navigation
2. Click "New Reward" button
3. **Fill form:**
   - Name: "30 Minutes Gaming Time"
   - Description: "Play your favorite game for 30 minutes"
   - Category: Screen Time (📺)
   - Points Cost: 100
   - Screen Minutes: 30
   - Weekly Limit: 3
4. Click "Create Reward"

**Expected Result:**
- New reward appears in "📺 Screen Time" section
- Reward card shows:
  - Cost: 100 QP
  - Screen Time: 30 min
  - Weekly Limit: 3×
  - Purchase count: 0×

---

### 4. Child Completes Task (1 minute)

**Switch to Child View:**
1. Open new browser tab/window
2. Navigate to: `http://localhost:3001/en-US/child/dashboard`
3. You should see child's dashboard with points balance

**Steps:**
1. Find "Make Your Bed" task in "To Do" section
2. Click "I Did It!" button

**Expected Result:**
- Task moves to "Parent Checking..." section
- Card shows blue badge with hourglass icon
- Points not added yet (pending approval)

**Test Multiple Completions:**
- Complete 2-3 more default tasks (Brush Teeth, etc.)
- Verify all show "Parent Checking..." status

---

### 5. Parent Approves Tasks (2 minutes)

**Back to Parent View:**
Navigate to: `http://localhost:3001/en-US/dashboard`

**Expected State:**
- Action Center shows pending approvals
- Each pending task shows:
  - Task name
  - Child who completed it
  - Points to be awarded
  - Time submitted
  - Three action buttons

**Test Approval:**
1. Click "Confirm Complete" on "Make Your Bed"
   - Task disappears from Action Center
   - Activity Feed shows approval
2. Click "Again Check" on another task
   - Form appears to select fix requests
   - Choose fix items (e.g., "More soap")
   - Add custom message (optional)
   - Click "Send Feedback"

**Expected Results:**
- **Approved Task:**
  - Removed from Action Center
  - Shows in Activity Feed (green dot)
  - Child's points updated (+50 QP for "Make Your Bed")

- **Fix Requested Task:**
  - Removed from Action Center
  - Child will see orange "Try Again!" card

---

### 6. Child Sees Points & Fix Request (1 minute)

**Switch to Child View:**
`http://localhost:3001/en-US/child/dashboard`

**Expected State:**
1. **Points Updated:**
   - XP badge in header shows new balance
   - Stats card shows earned points

2. **Fix Request Visible:**
   - Task shows in "To Do" with orange "Try Again!" badge
   - Shows parent's feedback items
   - Shows custom message

**Test Re-submission:**
- Click "I Did It!" on the fix-requested task
- Verify it moves back to "Parent Checking..."

---

### 7. Child Purchases Reward (2 minutes)

**Child View:**
Navigate to: `http://localhost:3001/en-US/child/store`

**Expected State:**
- My Wallet shows current balance
- Screen Time This Week shows 0 min (or current usage)
- Category filters: All, Screen Time, Power Ups, Fun Stuff, Saving
- Reward cards with prices

**Test Purchase:**
1. Find "30 Minutes Gaming Time" reward
2. **If Sufficient Points:**
   - "Buy Now" button is enabled (green)
   - Click "Buy Now"
   - Confirm purchase
3. **If Insufficient Points:**
   - "Buy Now" button is disabled (gray)
   - Shows "Need X QP"

**Expected After Purchase:**
- Points deducted from wallet
- Success toast shown
- Redirected to tickets page

**Test Budget Limits:**
1. Purchase same screen reward 3 times (weekly limit)
2. Try to purchase 4th time
3. Should show error: "Weekly limit reached"

---

### 8. View Purchased Tickets (1 minute)

**Child View:**
Navigate to: `http://localhost:3001/en-US/child/tickets`

**Expected State:**
- **"Waiting for Parent" section:**
  - Shows purchased rewards with orange pending badge
  - Displays: reward name, points spent, purchase time
  - Shows "💡 Ask your parent to grant this reward!"

- **"Fulfilled" section:**
  - Empty initially
  - Will show granted rewards later

---

### 9. Parent Grants Reward (1 minute)

**Parent View:**
Navigate to: `http://localhost:3001/en-US/dashboard`

**Expected State:**
- **"Pending Rewards" section appears:**
  - Shows purchased rewards waiting to be granted
  - Badge shows count (e.g., "2")
  - Each card shows:
    - Reward name & icon
    - Requested by: Child name
    - Time ago (e.g., "5m ago")
    - Points spent
    - Screen minutes (if applicable)

**Test Fulfillment:**
1. Click "Grant Reward" on "30 Minutes Gaming Time"
2. Wait for success feedback
3. Card disappears from Pending Rewards

**Expected Result:**
- Reward removed from parent dashboard
- Activity Feed shows grant action

---

### 10. Child Sees Fulfilled Reward (1 minute)

**Child View:**
Navigate to: `http://localhost:3001/en-US/child/tickets`

**Expected State:**
- Reward moved from "Waiting for Parent" to "Fulfilled" section
- Shows green checkmark badge
- Card grayed out slightly
- Fulfilled timestamp visible

---

## Edge Cases to Test

### Points & Limits

1. **Insufficient Points:**
   - Child with 50 QP tries to buy 100 QP reward
   - Verify "Buy Now" button is disabled
   - Shows "Need 50 QP"

2. **Weekly Limit Enforcement:**
   - Purchase same reward up to limit (e.g., 3×)
   - 4th purchase should fail with error

3. **Screen Budget:**
   - Set child's weekly screen budget to 60 min
   - Purchase 30 min reward twice (60 min total)
   - Try to purchase again
   - Should fail: "Screen budget exceeded"

### Task Approvals

1. **Auto-Approval (24h):**
   - Change task approval type to "Auto"
   - Complete task
   - Wait 24 hours (or modify DB for testing)
   - Task should auto-approve and credit points

2. **Multiple Fix Requests:**
   - Request fix on same task 2-3 times
   - Verify child sees incremented fix count
   - Verify parent can still approve eventually

### Multi-Child Scenarios

1. **Multiple Children:**
   - Add 2nd child during onboarding
   - Both children complete tasks
   - Verify Action Center shows both
   - Approve tasks for different children
   - Verify points go to correct child

2. **Same Reward Purchase:**
   - Child A buys "Gaming Time"
   - Child B also buys "Gaming Time"
   - Both should appear in parent's Pending Rewards
   - Grant to different children
   - Verify each child sees their own ticket

---

## Performance Checks

1. **Page Load Times:**
   - Dashboard should load < 2 seconds
   - Task/Reward list should load < 1 second
   - Form submissions should respond < 500ms

2. **Real-time Updates:**
   - After parent approves task, refresh child dashboard
   - Points should update immediately
   - After child purchases reward, refresh parent dashboard
   - Pending reward should appear immediately

---

## Data Validation

### Check Database State

After completing full flow, verify in Supabase:

1. **task_completions table:**
   - Has records for all completed tasks
   - Status values: 'pending', 'approved', 'fix_requested'
   - Points_awarded matches task.points
   - Approved_by contains parent user_id

2. **points_transactions table:**
   - Has "earn" entries for approved tasks
   - Has "spend" entries for purchased rewards
   - Running balance is correct

3. **reward_purchases table:**
   - Has records for all purchases
   - Status: 'purchased' or 'fulfilled'
   - Fulfilled_by contains parent user_id
   - Fulfilled_at timestamp when granted

4. **children table:**
   - points_balance reflects all transactions
   - Matches sum of points_transactions

---

## Success Criteria

All tests pass if:

✅ Parent can create tasks and rewards
✅ Child can complete tasks and see pending status
✅ Parent receives task approval notifications
✅ Parent can approve, reject, or request fixes
✅ Points are correctly credited on approval
✅ Child can purchase rewards with sufficient points
✅ Limits are enforced (weekly, screen budget)
✅ Parent sees pending reward purchases
✅ Parent can grant rewards
✅ Child sees fulfilled rewards in tickets
✅ All data persists across page refreshes
✅ Navigation works smoothly
✅ No console errors
✅ Mobile responsive design works

---

## Common Issues & Solutions

**Issue:** Points not updating after approval
**Solution:** Check browser console for errors, verify RPC function permissions

**Issue:** "Buy Now" button always disabled
**Solution:** Verify child.points_balance in database, check reward.points_cost

**Issue:** Reward purchase fails silently
**Solution:** Check API response in Network tab, verify RPC function exists

**Issue:** Parent can't see pending approvals
**Solution:** Verify family_id matches between parent, child, and tasks

**Issue:** Navigation not highlighting active page
**Solution:** Clear browser cache, verify pathname matching

---

## Next Steps After Testing

Once all tests pass:

1. **Add Sample Data:**
   - Create 10-15 tasks across all categories
   - Create 15-20 rewards across all categories
   - Set realistic point values

2. **Performance Optimization:**
   - Add database indexes on frequently queried fields
   - Implement caching for static data
   - Optimize image loading

3. **User Experience:**
   - Add loading skeletons
   - Improve error messages
   - Add success animations
   - Implement toast notifications throughout

4. **Security Audit:**
   - Review all RLS policies
   - Test unauthorized access attempts
   - Verify data isolation between families
   - Check for SQL injection vulnerabilities

5. **Mobile Testing:**
   - Test on actual mobile devices
   - Verify touch interactions
   - Check responsive breakpoints
   - Test PWA installation

---

**Happy Testing! 🎮**
