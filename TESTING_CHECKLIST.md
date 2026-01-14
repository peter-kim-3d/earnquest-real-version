# EarnQuest Task System v2 - Testing Checklist

## 📋 Use this checklist after running migrations

---

## 🗄️ DATABASE TESTS

### Schema Verification
- [ ] Run `scripts/verify-migration.sql` in Supabase SQL Editor
- [ ] Verify 13 task templates exist
- [ ] Check `tasks` table has new columns (metadata, timer_minutes, checklist)
- [ ] Check `task_completions` has new columns (timer_completed, checklist_state, fix_request)
- [ ] Verify constraints allow only v2 values (learning, household, health)

### Data Migration
- [ ] Check old tasks still visible in app
- [ ] Verify category migration: hygiene → health, chores → household
- [ ] Confirm old data preserved in category_old column
- [ ] No tasks with invalid categories

---

## 🎯 ONBOARDING FLOW

### Preset Selection
- [ ] Navigate to `/onboarding/select-style`
- [ ] See 4 preset cards: Busy, Balanced, Academic, Screen
- [ ] "Balanced" shows "RECOMMENDED" badge
- [ ] Each card shows task count and XP range

### Conditional Questions
- [ ] "Do you have a pet?" checkbox appears
- [ ] "Does your child play an instrument?" appears for Academic/Balanced
- [ ] Check "Has Pet" → Feed pet task should be included

### Test Each Preset

**Busy Parent (3 tasks):**
- [ ] Select "Busy" preset
- [ ] Create test family
- [ ] Verify 3 tasks created: homework, brush_teeth, backpack
- [ ] Expected XP: 90-120/day

**Balanced Growth (7 tasks) - RECOMMENDED:**
- [ ] Select "Balanced" preset
- [ ] Check "Has Pet" checkbox
- [ ] Create test family
- [ ] Verify 8 tasks created (7 base + feed_pet)
- [ ] Tasks: homework, reading, make_bed, clear_dishes, backpack, brush_teeth, exercise, feed_pet
- [ ] Expected XP: 200-280/day

**Academic Focus (5 tasks):**
- [ ] Select "Academic" preset
- [ ] Check "Has Instrument" checkbox
- [ ] Verify 6 tasks created (5 base + practice_instrument)
- [ ] Check homework = 60pts (override), reading = 40pts (override)
- [ ] Expected XP: 180-240/day

**Screen Time Manager (4 tasks):**
- [ ] Select "Screen" preset
- [ ] Verify 4 tasks created
- [ ] Check homework = 70pts (highest)
- [ ] Expected XP: 160-200/day

---

## 👨‍👩‍👧 PARENT FEATURES

### Task Creation

**Basic Task (Parent Approval):**
- [ ] Create task: "Clean bedroom"
- [ ] Category: Household
- [ ] Approval Type: Parent Check
- [ ] Points: 50
- [ ] Task saves successfully

**Timer Task:**
- [ ] Create task: "Study session"
- [ ] Category: Learning
- [ ] Approval Type: Timer Based
- [ ] Timer Duration: 25 minutes
- [ ] Verify timer_minutes field is required
- [ ] Task saves with timer settings

**Checklist Task:**
- [ ] Create task: "Morning routine"
- [ ] Category: Health
- [ ] Approval Type: Checklist
- [ ] Add 3 checklist items: "Brush teeth", "Wash face", "Get dressed"
- [ ] Verify checklist is required
- [ ] Task saves with checklist

**Auto-Approval Task:**
- [ ] Try creating task with "Auto Approve" type
- [ ] See orange warning message about rare usage
- [ ] Only use for trust-based tasks

### Fix Request Feature

**Send Fix Request:**
- [ ] Child completes task (pending approval)
- [ ] Parent opens task in Action Center
- [ ] Click "Request Fix" button
- [ ] FixRequestModal appears
- [ ] See task-specific templates (if available) or default templates
- [ ] Select 2-3 fix items (e.g., "Please pick up clothes from floor")
- [ ] Add optional custom message
- [ ] Click "Send Fix Request"
- [ ] Task status changes to "fix_requested"

**Verify Fix Templates:**
- [ ] For "clean_room" task: See room-specific templates
- [ ] For "homework" task: See homework-specific templates
- [ ] For other tasks: See default templates (almost there, retry, need help)

### Batch Approve

**Select Multiple Tasks:**
- [ ] Navigate to Action Center (parent dashboard)
- [ ] See checkboxes next to each pending task
- [ ] Click "Select All" checkbox
- [ ] All tasks get checked
- [ ] Uncheck one task manually

**Batch Approve:**
- [ ] Keep 2-3 tasks selected
- [ ] See button: "Approve 3 Tasks" (or however many selected)
- [ ] Click batch approve button
- [ ] All selected tasks approve at once
- [ ] Points awarded to each child
- [ ] Tasks disappear from Action Center

---

## 👶 CHILD FEATURES

### Timer Task Flow

**Start Timer:**
- [ ] Child sees "Reading" task with timer icon
- [ ] Button says "⏱️ Start Timer"
- [ ] Click button
- [ ] TimerModal opens
- [ ] See circular progress indicator
- [ ] See countdown: 20:00

**Use Timer:**
- [ ] Click "Start Timer" button
- [ ] Timer starts counting down (19:59, 19:58...)
- [ ] Circular progress fills up
- [ ] Click "Pause" button
- [ ] Timer pauses
- [ ] Click "Resume" button
- [ ] Timer continues
- [ ] Click "Reset" button
- [ ] Timer resets to 20:00

**Complete Timer:**
- [ ] Let timer run to 00:00 (or fast-forward time for testing)
- [ ] When timer hits 0:00:
  - [ ] See "🎉 Complete!" message
  - [ ] Green checkmark appears
  - [ ] "Complete Task" button enabled
- [ ] Click "Complete Task"
- [ ] Task auto-approves (no parent review needed)
- [ ] Points awarded immediately
- [ ] Task shows as completed

**Timer Validation:**
- [ ] Try completing timer task before timer finishes
- [ ] "Complete Task" button should be disabled
- [ ] Can't submit without finishing timer

### Checklist Task Flow

**Open Checklist:**
- [ ] Child sees "Morning routine" task with checklist icon
- [ ] Button says "✓ Open Checklist"
- [ ] Click button
- [ ] ChecklistModal opens
- [ ] See 3 unchecked items
- [ ] Progress bar shows 0%
- [ ] "Complete Task" button is disabled

**Use Checklist:**
- [ ] Check first item: "Brush teeth"
  - [ ] Item gets checkmark
  - [ ] Item text strikes through
  - [ ] Progress bar updates to 33%
- [ ] Check second item: "Wash face"
  - [ ] Progress bar updates to 66%
- [ ] Check third item: "Get dressed"
  - [ ] Progress bar shows 100%
  - [ ] Progress bar turns green
  - [ ] "🎉 Great job! All items completed!" message appears
  - [ ] "Complete Task" button becomes enabled

**Complete Checklist:**
- [ ] Click "Complete Task" button
- [ ] Task auto-approves (no parent review)
- [ ] Points awarded immediately
- [ ] Task shows as completed

**Checklist Validation:**
- [ ] Try submitting with only 2/3 items checked
- [ ] "Complete Task" button should stay disabled
- [ ] All items must be checked to submit

### Fix Request Response

**View Fix Request:**
- [ ] Parent sent fix request for "Clean bedroom"
- [ ] Task appears in child's "Needs Work" section
- [ ] Orange border around task card
- [ ] See fix request items listed:
  - [ ] "• Please pick up clothes from floor"
  - [ ] "• Your desk needs organizing"
- [ ] See optional custom message (if parent added one)
- [ ] Button says "Try Again! 💪"

**Resubmit Task:**
- [ ] Child fixes the issues
- [ ] Click "Try Again!" button
- [ ] Task resubmits for approval
- [ ] Fix request cleared
- [ ] Task moves back to pending approval

---

## 🔧 EDGE CASES & ERROR HANDLING

### Validation Tests

**Required Fields:**
- [ ] Try creating timer task without timer_minutes → Should show error
- [ ] Try creating checklist task without checklist items → Should show error
- [ ] Try creating task with points < 10 → Should show error
- [ ] Try creating task with points > 500 → Should show error

**Invalid Data:**
- [ ] Try creating task with invalid category → Should be blocked by UI
- [ ] Try manually sending invalid category via API → Should get validation error
- [ ] Check database constraint prevents invalid categories

**Timer Edge Cases:**
- [ ] Set timer to 1 minute (minimum) → Should work
- [ ] Try setting timer to 181 minutes → Should show error (max 180)
- [ ] Close timer modal mid-countdown → Progress should be lost
- [ ] Cancel timer task → Can restart fresh later

**Checklist Edge Cases:**
- [ ] Create checklist with 1 item (minimum) → Should work
- [ ] Try creating checklist with 11 items → Should show error (max 10)
- [ ] Uncheck all items → "Complete" button should disable
- [ ] Check all, then uncheck one → "Complete" button should disable

### Fix Request Edge Cases

**Multiple Fix Requests:**
- [ ] Parent sends fix request
- [ ] Child resubmits
- [ ] Parent sends another fix request
- [ ] fix_request_count increments
- [ ] Latest fix request shows

**Fix Request Limits:**
- [ ] Try selecting 6 fix items → Should only allow 5
- [ ] Add 200 character custom message → Should work
- [ ] Try 201 characters → Should show error

### Batch Approve Edge Cases

**Selection:**
- [ ] Try batch approving 0 tasks → Button disabled
- [ ] Batch approve with 1 task → Should work
- [ ] Batch approve with 20 tasks (max) → Should work
- [ ] Try approving already-approved task → Should skip it

---

## 📱 UI/UX TESTS

### Responsive Design
- [ ] Test on mobile (375px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1440px width)
- [ ] PresetSelector cards responsive
- [ ] Modals work on all screen sizes

### Dark Mode
- [ ] Toggle dark mode
- [ ] All v2 components readable
- [ ] Timer modal looks good
- [ ] Checklist modal looks good
- [ ] Fix request modal looks good

### Accessibility
- [ ] Timer countdown readable
- [ ] Checklist items have clear contrast
- [ ] Buttons have hover states
- [ ] Can tab through form fields
- [ ] Error messages clear

---

## 🚨 KNOWN ISSUES

Document any issues you find:

**Issue 1:**
- Description:
- Steps to reproduce:
- Expected:
- Actual:
- Severity: (Critical / High / Medium / Low)

**Issue 2:**
- Description:
- Steps to reproduce:
- Expected:
- Actual:
- Severity:

---

## ✅ SIGN-OFF

Once all critical tests pass:

- [ ] All database tests passed
- [ ] All onboarding presets work
- [ ] Timer tasks work end-to-end
- [ ] Checklist tasks work end-to-end
- [ ] Fix requests work
- [ ] Batch approve works
- [ ] No critical bugs found

**Tester Name:** _______________
**Date:** _______________
**Ready for Production:** [ ] YES  [ ] NO

**Notes:**
