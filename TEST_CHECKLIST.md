# 🧪 Complete Flow Testing Checklist

**Test Date:** _________
**Tester:** _________
**Server:** http://localhost:3001

---

## ✅ Setup Verification

- [ ] Dev server running at http://localhost:3001
- [ ] Sample data seeded (35 tasks, 70 rewards)
- [ ] Browser ready (Chrome/Firefox recommended)
- [ ] Two browser tabs/windows prepared

---

## 📋 Step-by-Step Testing

### **STEP 1: Parent Dashboard** (2 min)

**URL:** http://localhost:3001/en-US/dashboard

**Actions:**
- [ ] Login with existing account
- [ ] See welcome message with your name
- [ ] See navigation: Dashboard, Tasks, Rewards
- [ ] See child card(s) displayed
- [ ] See Action Center (should show pending approvals from previous tests or be empty)
- [ ] See Activity Feed on the right

**✅ Pass Criteria:**
- Navigation works
- All sections visible
- No console errors

---

### **STEP 2: View Tasks** (2 min)

**URL:** http://localhost:3001/en-US/tasks

**Actions:**
- [ ] Click "Tasks" in navigation
- [ ] See task stats: Total, Active, Completions (30d)
- [ ] See tasks grouped by category (Hygiene, Chores, Learning, Other)
- [ ] See task cards with: name, points, frequency, approval type
- [ ] Click "..." menu on a task
- [ ] Try "Edit" - form opens with task data
- [ ] Close form without saving
- [ ] Click "..." → "Deactivate" on a task
- [ ] Verify task grays out
- [ ] Click "..." → "Activate" to reactivate

**✅ Pass Criteria:**
- 35 total tasks visible
- Task cards display correctly
- Edit/activate/deactivate work
- Categories organized properly

**Sample Tasks to Look For:**
- 🧼 Hygiene: "Brush Teeth (Morning)" - 30 QP, Daily, Auto
- 🏠 Chores: "Make Your Bed" - 40 QP, Daily, Manual
- 📚 Learning: "Complete Homework" - 100 QP, Daily, Manual
- 📋 Other: "Morning Exercise" - 70 QP, Daily, Manual

---

### **STEP 3: View Rewards** (2 min)

**URL:** http://localhost:3001/en-US/rewards

**Actions:**
- [ ] Click "Rewards" in navigation
- [ ] See reward stats: Total, Active, Purchases (30d)
- [ ] See rewards grouped by category (Screen, Autonomy, Experience, Savings)
- [ ] See reward cards with: name, cost, screen time, weekly limit
- [ ] Click "..." menu on a reward
- [ ] Try "Edit" - form opens with reward data
- [ ] Close form without saving

**✅ Pass Criteria:**
- 70 total rewards visible
- Reward cards display correctly
- Edit/activate/deactivate work
- Categories organized properly

**Sample Rewards to Look For:**
- 📺 Screen: "30 Minutes Gaming" - 100 QP, 30 min, 4× weekly
- 🔓 Autonomy: "Stay Up 30 Min Late" - 120 QP, 2× weekly
- 🎉 Experience: "Ice Cream Trip" - 150 QP
- 💰 Savings: "Save $5" - 250 QP

---

### **STEP 4: Child Completes Tasks** (3 min)

**Open NEW Tab:** http://localhost:3001/en-US/child/dashboard

**Actions:**
- [ ] See child navigation: Quests, Rewards, Badges
- [ ] See XP badge in header (should show current points)
- [ ] See "To Do" tab (active)
- [ ] Find "Brush Teeth (Morning)" task
- [ ] Click "I Did It!" button
- [ ] Task moves to "Parent Checking..." section (blue badge)
- [ ] Complete 3 more tasks:
  - [ ] "Make Your Bed" - 40 QP
  - [ ] "Do the Dishes" - 80 QP
  - [ ] "Complete Homework" - 100 QP
- [ ] Check "Parent Checking..." tab
- [ ] See all 4 tasks pending approval

**✅ Pass Criteria:**
- Tasks move to "Parent Checking..." after completion
- Blue hourglass badge shows
- Points NOT added yet
- No errors in console

**Expected Pending Points:** 30 + 40 + 80 + 100 = **250 QP**

---

### **STEP 5: Parent Approves Tasks** (3 min)

**Switch to Parent Tab:** http://localhost:3001/en-US/dashboard

**Actions:**
- [ ] See Action Center with 4 pending approvals
- [ ] Each card shows: task name, child name, points, time
- [ ] Approve "Brush Teeth (Morning)":
  - [ ] Click "Confirm Complete"
  - [ ] Card disappears
  - [ ] Activity Feed updates (green dot)
- [ ] Approve "Make Your Bed":
  - [ ] Click "Confirm Complete"
- [ ] Test "Fix Request" on "Do the Dishes":
  - [ ] Click "Again Check"
  - [ ] Form appears with quick select chips
  - [ ] Choose "🧼 More soap"
  - [ ] Add message: "Please use more soap next time"
  - [ ] Click "Send Feedback"
  - [ ] Card disappears
- [ ] Approve "Complete Homework":
  - [ ] Click "Confirm Complete"

**✅ Pass Criteria:**
- Approved tasks disappear from Action Center
- Activity Feed shows approvals
- Fix request sends successfully
- Page responsive

**Points Approved:** 30 + 40 + 100 = **170 QP**
**Fix Requested:** Do the Dishes (80 QP)

---

### **STEP 6: Child Sees Results** (2 min)

**Switch to Child Tab:** http://localhost:3001/en-US/child/dashboard

**Actions:**
- [ ] Refresh page
- [ ] XP badge shows +170 QP
- [ ] Stats card shows earned points
- [ ] Check "To Do" tab
- [ ] Find "Do the Dishes" with orange "Try Again!" badge
- [ ] See parent's feedback: "More soap" chip
- [ ] See message: "Please use more soap next time"
- [ ] Check "Completed" tab
- [ ] See 3 approved tasks (green checkmarks)

**✅ Pass Criteria:**
- Points updated correctly (+170 QP)
- Fix requested task shows feedback
- Completed tasks visible

**Current Balance:** Should be **170 QP** (or more if there were previous points)

---

### **STEP 7: Child Buys Rewards** (3 min)

**Child Tab:** http://localhost:3001/en-US/child/store

**Actions:**
- [ ] Click "Rewards" in navigation
- [ ] See "My Wallet" card with current balance
- [ ] See "Screen Time This Week" card (0 min or current usage)
- [ ] See category filters: All, Screen Time, Power Ups, Fun Stuff, Saving
- [ ] Click "Screen Time" filter
- [ ] See only screen rewards
- [ ] Click "All Rewards" to reset
- [ ] Find "30 Minutes Gaming" (100 QP)
- [ ] Verify "Buy Now" button is enabled (green)
- [ ] Click "Buy Now"
- [ ] See success message
- [ ] Redirected to tickets page
- [ ] Return to store
- [ ] Find "Ice Cream Trip" (150 QP)
- [ ] If balance < 150: button should be disabled, shows "Need X QP"
- [ ] If balance >= 150: Buy it

**✅ Pass Criteria:**
- Wallet shows correct balance
- Buy button enabled/disabled based on balance
- Purchase succeeds
- Redirect to tickets works
- Balance updates after purchase

**Spent:** 100 QP (or 250 QP if both purchased)

---

### **STEP 8: View Tickets** (1 min)

**Child Tab:** http://localhost:3001/en-US/child/tickets

**Actions:**
- [ ] See "Waiting for Parent" section
- [ ] See purchased reward(s) with orange "Pending" badge
- [ ] Card shows: reward name, points spent, purchase time
- [ ] See message: "💡 Ask your parent to grant this reward!"
- [ ] "Fulfilled" section should be empty (or show previous grants)

**✅ Pass Criteria:**
- Purchased tickets display correctly
- Status badge shows "Pending"
- Details accurate

---

### **STEP 9: Parent Grants Reward** (2 min)

**Switch to Parent Tab:** http://localhost:3001/en-US/dashboard

**Actions:**
- [ ] Refresh page
- [ ] See "Pending Rewards" section (purple header)
- [ ] Badge shows count (e.g., "1" or "2")
- [ ] Each card shows:
  - [ ] Reward name & icon
  - [ ] "Requested by [Child Name]"
  - [ ] Time ago (e.g., "2m ago")
  - [ ] Points spent
  - [ ] Screen minutes (if applicable)
- [ ] Click "Grant Reward" on "30 Minutes Gaming"
- [ ] Button shows "Granting..."
- [ ] Card disappears
- [ ] Count badge updates
- [ ] If you bought "Ice Cream Trip", grant that too

**✅ Pass Criteria:**
- Pending rewards section visible
- Grant button works
- Cards disappear after granting
- No errors

---

### **STEP 10: Child Sees Fulfilled Rewards** (1 min)

**Switch to Child Tab:** http://localhost:3001/en-US/child/tickets

**Actions:**
- [ ] Refresh page
- [ ] "Waiting for Parent" section now empty (or fewer tickets)
- [ ] "Fulfilled" section shows granted reward(s)
- [ ] Reward card has green "Fulfilled" badge
- [ ] Card slightly grayed out
- [ ] Shows fulfilled timestamp

**✅ Pass Criteria:**
- Rewards moved to "Fulfilled" section
- Green checkmark visible
- Correct status

---

## 🧪 Edge Case Testing

### **Test 1: Insufficient Points** (1 min)

**Child Store:**
- [ ] Find expensive reward (e.g., "Trampoline Park" - 800 QP)
- [ ] If balance < 800: "Buy Now" button disabled (gray)
- [ ] Shows "Need X QP" message
- [ ] Click button does nothing

**✅ Pass:** Button disabled, message shown

---

### **Test 2: Weekly Limit** (2 min)

**Child Store:**
- [ ] Find "30 Minutes Gaming" (limit: 4× weekly)
- [ ] Purchase it 4 times (if enough points)
- [ ] Try to purchase 5th time
- [ ] Should see error: "Weekly limit reached"
- [ ] Purchase fails, points not deducted

**✅ Pass:** Limit enforced, error shown

---

### **Test 3: Screen Budget** (2 min)

**Parent Dashboard:**
- [ ] Note child's weekly screen budget (default: 300 min)

**Child Store:**
- [ ] Purchase multiple screen rewards totaling > budget
- [ ] E.g., "1 Hour Movie" (60 min) + "Weekend Gaming" (120 min) + "45 Min Tablet" (45 min) = 225 min
- [ ] Try to purchase another 120 min reward
- [ ] Should fail with "Screen budget exceeded"

**✅ Pass:** Budget enforced, can't exceed weekly limit

---

### **Test 4: Re-submit Fix Request** (1 min)

**Child Dashboard:**
- [ ] Find task with "Try Again!" badge ("Do the Dishes")
- [ ] Click "I Did It!" again
- [ ] Task moves back to "Parent Checking..."
- [ ] Parent can approve or request fix again

**✅ Pass:** Re-submission works, task moves to pending

---

## 📊 Final Verification

### **Database Consistency Check**

Open Supabase Dashboard → Table Editor:

**task_completions table:**
- [ ] Has records for all completed tasks
- [ ] Status: 'pending', 'approved', or 'fix_requested'
- [ ] Approved tasks have points_awarded value
- [ ] Approved_by contains parent user_id

**points_transactions table:**
- [ ] Has "earn" entries for approved tasks
- [ ] Has "spend" entries for purchased rewards
- [ ] Running balance matches child.points_balance

**reward_purchases table:**
- [ ] Has records for purchased rewards
- [ ] Status: 'purchased' or 'fulfilled'
- [ ] Fulfilled rewards have fulfilled_at timestamp
- [ ] Fulfilled_by contains parent user_id

**children table:**
- [ ] points_balance reflects all transactions
- [ ] Equals sum of points earned - points spent

---

## ✅ Success Criteria Summary

All tests pass if:

- [x] Parent can view and manage tasks ✅
- [x] Parent can view and manage rewards ✅
- [x] Child can complete tasks ✅
- [x] Parent receives task approvals ✅
- [x] Parent can approve/reject/request fixes ✅
- [x] Points credited correctly on approval ✅
- [x] Child can purchase rewards ✅
- [x] Limits enforced (weekly, screen budget) ✅
- [x] Parent sees pending reward purchases ✅
- [x] Parent can grant rewards ✅
- [x] Child sees fulfilled rewards ✅
- [x] All data persists across refreshes ✅
- [x] Navigation works smoothly ✅
- [x] No console errors ✅
- [x] Mobile responsive ✅

---

## 📝 Notes & Issues Found

**Issues Found:**
1. _______________________________________
2. _______________________________________
3. _______________________________________

**Things That Worked Well:**
1. _______________________________________
2. _______________________________________
3. _______________________________________

**Suggestions for Improvement:**
1. _______________________________________
2. _______________________________________
3. _______________________________________

---

## 🎉 Testing Complete!

**Overall Result:** ⬜ PASS  /  ⬜ FAIL

**Date Completed:** _________
**Time Spent:** _________ minutes
**Signature:** _________________

