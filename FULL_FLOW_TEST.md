# EarnQuest Full Flow Test Guide

Complete end-to-end testing: Child completes task → Parent approves → Points awarded

## Prerequisites

✅ Server running: http://localhost:3001
✅ Logged in with: test.id.peter.k@gmail.com
✅ Onboarding completed
✅ Database has tasks and children

---

## 🎯 Test Flow Overview

1. **Child Dashboard** - Submit task for approval
2. **Parent Dashboard** - Approve task
3. **Verify** - Check points awarded and status updated

---

## Part 1: Child Submits Task

### Step 1: Open Child Dashboard

🔗 **URL:** http://localhost:3001/en-US/child/dashboard

### Expected:
- ✅ Navigation header with "Quests", "Rewards", "Badges"
- ✅ Greeting: "Ready for today's quests, Anna?"
- ✅ Motivational banner
- ✅ Three tabs: "To Do", "Parent Checking", "Completed"
- ✅ Task cards in "To Do" tab
- ✅ Sidebar with stats (0 XP, 0 streak, 0/500 goal)

### Step 2: Submit a Task

1. Find any task in the "To Do" tab
2. **Note the task name** (you'll verify this in parent dashboard)
3. Click the green **"I Did It! 🎉"** button

### Expected Result:
- ✅ Loading state: Button shows "Submitting..."
- ✅ Page refreshes
- ✅ Task moves to **"Parent Checking"** tab
- ✅ Task shows blue border with clock icon
- ✅ Text: "Parent Checking..."
- ✅ "To Do" tab count decreases by 1
- ✅ "Parent Checking" tab count increases to 1

### 📸 Screenshot Checkpoint 1
Take screenshot showing task in "Parent Checking" tab

---

## Part 2: Parent Approves Task

### Step 3: Open Parent Dashboard

🔗 **URL:** http://localhost:3001/en-US/dashboard

### Expected:
- ✅ Welcome message: "Welcome back, [Your Name]! 👋"
- ✅ Family info: "The family has X children..."
- ✅ **Action Center** with orange badge: "🔔 1 New"
- ✅ Approval card showing the task you just submitted
- ✅ Children cards (showing Anna with 0 XP)
- ✅ Activity feed on the right

### Step 4: Review Pending Task

In the **Action Center**, you should see:

**Approval Card contains:**
- ✅ Child avatar (circle with "A")
- ✅ Child name: "by Anna"
- ✅ Task name (matches what you submitted)
- ✅ Task description (if any)
- ✅ Points badge: "+[X] XP"
- ✅ Time: "Submitted Xm ago"
- ✅ Two buttons:
  - Green: **"Confirm Complete"**
  - Gray: **"Again Check"**

### 📸 Screenshot Checkpoint 2
Take screenshot of the approval card

### Step 5: Approve the Task

1. Click the green **"Confirm Complete"** button

### Expected Result:
- ✅ Loading state: Button shows opacity change
- ✅ Page refreshes automatically
- ✅ Action Center now shows: **"All caught up!"** with green checkmark
- ✅ Message: "No tasks waiting for approval..."
- ✅ Child card updates (Anna's XP should increase)
- ✅ **Activity Feed** shows new entry:
  - "Anna completed [Task Name]"
  - "Xm ago"
  - "+[X] XP" in green

### 📸 Screenshot Checkpoint 3
Take screenshot showing "All caught up!" and updated activity feed

---

## Part 3: Verify Points Awarded

### Step 6: Check Child Dashboard Again

🔗 **URL:** http://localhost:3001/en-US/child/dashboard

### Expected:
- ✅ Stats sidebar updated:
  - **Total XP**: Increased by task points
  - **Weekly Goal**: Progress bar moved forward
  - **XP count**: "X / 500 XP"
- ✅ Task moved to **"Completed"** tab
- ✅ "Parent Checking" tab count = 0
- ✅ "Completed" tab count = 1
- ✅ In Completed tab:
  - Task shows with green checkmark
  - Text: "Completed today"
  - Faded appearance (opacity 60%)

### 📸 Screenshot Checkpoint 4
Take screenshot showing updated XP and completed task

---

## Part 4: Test Fix Request Flow

### Step 7: Submit Another Task

Back in **Child Dashboard**:
1. Go to "To Do" tab
2. Click **"I Did It!"** on a different task
3. Verify it moves to "Parent Checking" tab

### Step 8: Parent Requests Fix

Back in **Parent Dashboard** (http://localhost:3001/en-US/dashboard):

1. You should see "🔔 1 New" in Action Center
2. Click the gray **"Again Check"** button

### Expected:
- ✅ Fix request form appears with orange background
- ✅ Header: "What needs attention?"
- ✅ Quick select chips:
  - 🧼 More soap
  - 🍽️ Dry plates
  - 🥄 Check silverware
  - 🧹 Sweep corners
  - 📚 Organize books
- ✅ Text area: "Add a custom message (optional)..."
- ✅ Buttons changed:
  - Orange: "Send Feedback"
  - Gray: "Cancel"

### Step 9: Send Feedback

1. Click chip: **"🧼 More soap"**
2. Click chip: **"🍽️ Dry plates"**
3. Type in text area: "Please make sure everything is completely dry"
4. Click **"Send Feedback"**

### Expected Result:
- ✅ Page refreshes
- ✅ Action Center shows "All caught up!"
- ✅ Task removed from pending list

### 📸 Screenshot Checkpoint 5
Take screenshot of fix request form before sending

### Step 10: Verify Fix Request Received

Back in **Child Dashboard**:

1. Go to "To Do" tab

### Expected:
- ✅ Task appears with **orange border** (2px border-orange-300)
- ✅ Orange feedback box with alert icon
- ✅ Header: "Please check these items:"
- ✅ Bullet list:
  - 🧼 More soap
  - 🍽️ Dry plates
- ✅ Custom message shown:
  - "Please make sure everything is completely dry"
- ✅ Button changed to orange: **"Try Again! 💪"**

### 📸 Screenshot Checkpoint 6
Take screenshot showing task with fix request feedback

### Step 11: Resubmit Fixed Task

1. Click orange **"Try Again! 💪"** button

### Expected:
- ✅ Task moves back to "Parent Checking" tab
- ✅ Orange border removed
- ✅ Shows blue "Parent Checking..." badge again

---

## ✅ Success Criteria Checklist

After completing all steps, verify:

- [ ] Child can submit tasks for approval
- [ ] Tasks appear in parent's Action Center
- [ ] Parent can approve tasks
- [ ] Points are credited to child
- [ ] Completed tasks show in child's "Completed" tab
- [ ] Parent can request fixes
- [ ] Fix requests appear in child's "To Do" tab with feedback
- [ ] Child can resubmit fixed tasks
- [ ] Activity feed updates with completions
- [ ] Child stats update (XP, progress bar)
- [ ] Tab counts update correctly

---

## 🐛 Troubleshooting

### Issue: Task not appearing in parent dashboard
**Check:**
- Browser console for errors
- Server logs: `GET /en-US/dashboard` should return 200
- Database: Check `task_completions` table has `status='pending'`

### Issue: Points not awarded
**Check:**
- Server logs for `add_points` RPC call
- Database: `children.points_balance` should increase
- `task_completions.points_awarded` should be set

### Issue: "All caught up!" shows when task is pending
**Check:**
- Browser: Hard refresh (Cmd+Shift+R)
- Database: Verify `status='pending'` in `task_completions`

### Issue: Fix request not showing in child dashboard
**Check:**
- Database: `task_completions.status='fix_requested'`
- Database: `task_completions.fix_request` JSONB has items/message
- Browser: Hard refresh child dashboard

---

## 📊 Database Verification Commands

After testing, verify data in Supabase SQL Editor:

```sql
-- Check task completions
SELECT
  tc.status,
  tc.points_awarded,
  t.name as task_name,
  c.name as child_name,
  tc.requested_at,
  tc.approved_at
FROM task_completions tc
JOIN tasks t ON tc.task_id = t.id
JOIN children c ON tc.child_id = c.id
ORDER BY tc.requested_at DESC
LIMIT 10;

-- Check child points
SELECT
  name,
  points_balance,
  age_group
FROM children;

-- Check point transactions
SELECT
  pt.amount,
  pt.type,
  pt.description,
  pt.created_at,
  c.name as child_name
FROM point_transactions pt
JOIN children c ON pt.child_id = c.id
ORDER BY pt.created_at DESC
LIMIT 10;
```

---

## 🎉 Test Complete!

If all checkpoints passed, the full approval flow is working correctly!

**Next Steps:**
- Test with multiple children
- Test auto-approval (if you have tasks with approval_type='auto')
- Test 24-hour auto-approval timer
- Test weekly limits and screen budget
