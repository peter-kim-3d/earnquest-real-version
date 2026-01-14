# Locked Files & No-Touch Zones

> 수정 금지 또는 신중하게 다뤄야 할 파일/코드 목록

**Last Updated:** 2026-01-10

---

## 🔒 Critical: DO NOT MODIFY

These files are critical to system stability and should NOT be modified without explicit approval:

### 1. Auto-approval Whitelist

**File:** `lib/validation/task.ts`

**Lines:** ~15-17

```typescript
// 🔒 LOCKED: DO NOT ADD TASKS TO THIS LIST
const AUTO_APPROVAL_WHITELIST = ['backpack', 'get_dressed', 'set_alarm'];
```

**Why Locked:**
- Trust erosion risk (see `.handoff/DECISIONS.md` #001)
- Adding tasks bypasses parent oversight
- Can lead to cheating and app abandonment

**To Modify:**
1. ❌ NO - Don't add other tasks
2. ✅ YES - Only if approved by Peter + documented design decision
3. Process: Propose in `.handoff/DECISIONS.md` first

---

### 2. Database Migrations (Applied)

**Files:**
- `supabase/migrations/020_task_system_v2_enums.sql`
- `supabase/migrations/021_task_system_v2_templates.sql`
- `supabase/migrations/022_task_completions_v2.sql`

**Status:** ✅ Applied to production

**Why Locked:**
- Already run on production database
- Changes will NOT be applied (migrations run once)
- To fix migration errors, create NEW migration (023, 024, etc.)

**To Modify:**
1. ❌ NO - Don't edit applied migrations
2. ✅ YES - Create new migration file
3. Name pattern: `023_fix_whatever.sql`

---

### 3. Task Categories

**Files:**
- `lib/types/task.ts` - TaskCategory type
- `lib/validation/task.ts` - Category validation

**Current Values:**
```typescript
// 🔒 LOCKED: v2 categories
type TaskCategory = 'learning' | 'household' | 'health';
```

**Why Locked:**
- Database constraint enforced
- UI components depend on these 3 categories
- i18n strings mapped to these values
- Changing requires full system migration

**To Modify:**
1. ❌ NO - Don't add/remove categories without design review
2. ✅ YES - Only with full migration plan (see Phase 2)
3. Impacts: DB, API, UI, i18n, analytics

---

### 4. Approval Types

**Files:**
- `lib/types/task.ts` - ApprovalType type
- `lib/validation/task.ts` - Approval validation

**Current Values:**
```typescript
// 🔒 LOCKED: v2 approval types
type ApprovalType = 'parent' | 'auto' | 'timer' | 'checklist';
```

**Why Locked:**
- Core business logic depends on these 4 types
- Each type has specific UI flow (modal, button, etc.)
- API completion logic branched by type

**To Modify:**
1. ❌ NO - Don't add types without design review
2. ✅ YES - Only with full implementation (UI + API + docs)
3. Process: Design → Implement → Test → Deploy

---

### 5. Supabase Configuration

**Files:**
- `.env.local` (not committed, but critical)
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`

**Why Locked:**
- Production credentials
- Breaking changes = app outage
- RLS policies enforced here

**To Modify:**
1. ❌ NO - Don't change Supabase URL/keys
2. ✅ YES - Only if migrating projects
3. Warning: Test on staging first

---

## ⚠️ Caution: Modify with Care

These files can be modified but require extra caution:

### 6. Task Templates

**File:** `supabase/migrations/021_task_system_v2_templates.sql`

**Status:** ✅ Applied (13 templates seeded)

**Current Templates:**
- Base (7): homework, reading, make_bed, clear_dishes, backpack, brush_teeth, exercise
- Conditional (2): feed_pet, practice_instrument
- Age-specific (4): pick_up_toys, get_dressed, laundry, study_session

**Caution:**
- ⚠️ Changing template_key breaks preset mappings
- ⚠️ Deleting templates breaks existing tasks
- ⚠️ Changing points affects expected daily XP

**To Modify:**
1. ✅ Add NEW templates (create migration 023)
2. ⚠️ Update existing templates (check impact on tasks)
3. ❌ Delete templates (will orphan existing tasks)

---

### 7. Onboarding Presets

**File:** `lib/services/onboarding.ts`

**Lines:** ~20-50

```typescript
// ⚠️ CAUTION: Changing task keys breaks onboarding
const PRESET_TASK_KEYS: Record<FamilyStyle, string[]> = {
  busy: ['homework', 'brush_teeth', 'backpack'],
  balanced: ['homework', 'reading', 'make_bed', 'clear_dishes', 'backpack', 'brush_teeth', 'exercise'],
  academic: ['homework', 'reading', 'practice_instrument', 'brush_teeth', 'exercise'],
  screen: ['homework', 'clear_dishes', 'brush_teeth', 'exercise'],
};
```

**Caution:**
- ⚠️ Task keys must match task_templates.template_key
- ⚠️ Point overrides must be documented
- ⚠️ Daily XP estimates in UI must stay accurate

**To Modify:**
1. ✅ Add/remove tasks from preset
2. ⚠️ Verify template exists in DB
3. ⚠️ Update expected XP in PresetSelector UI
4. ✅ Test onboarding flow end-to-end

---

### 8. Timer/Checklist Validation

**File:** `app/api/tasks/complete/route.ts`

**Lines:** ~115-135

```typescript
// ⚠️ CAUTION: Validation affects auto-approval
if (task.approval_type === 'timer') {
  if (!evidence?.timerCompleted) {
    return NextResponse.json({ error: 'Timer must be completed' }, { status: 400 });
  }
}

if (task.approval_type === 'checklist') {
  if (!evidence?.checklistState || evidence.checklistState.some(item => !item)) {
    return NextResponse.json({ error: 'All checklist items must be completed' }, { status: 400 });
  }
}
```

**Caution:**
- ⚠️ Loosening validation = potential cheating
- ⚠️ Tightening validation = tasks won't complete

**To Modify:**
1. ✅ Add logging for debugging
2. ⚠️ Change validation logic (test thoroughly)
3. ❌ Remove validation (defeats purpose)

---

### 9. RLS Policies

**Location:** Supabase Dashboard → Authentication → Policies

**Tables:**
- `tasks` - Family-level access
- `task_completions` - Child + parent access
- `families` - User's own family only

**Caution:**
- ⚠️ Breaking RLS = data leaks between families
- ⚠️ Too strict RLS = app broken
- ⚠️ Changes not in git (manual in dashboard)

**To Modify:**
1. ⚠️ Test on staging database first
2. ⚠️ Verify no data leaks (test with 2 families)
3. ✅ Document changes in migration comments

---

### 10. Point Values

**Files:**
- `supabase/migrations/021_task_system_v2_templates.sql` (template defaults)
- `lib/services/onboarding.ts` (preset overrides)

**Current Range:** 10-100 points (typical)

**Caution:**
- ⚠️ Changing points affects economy (screen time budget)
- ⚠️ Too high = kids get rewards too easily
- ⚠️ Too low = kids lose motivation

**To Modify:**
1. ✅ Adjust within ±20% (e.g., 50 → 40 or 60)
2. ⚠️ Major changes (50 → 100) need design review
3. ⚠️ Update PresetSelector expected XP ranges

---

## 🟢 Safe to Modify

These areas are safe to modify without special approval:

### UI Components (Non-critical)

**Safe:**
- Styling (colors, spacing, fonts)
- Copy/text strings (but use i18n)
- Icons
- Animations
- Layout tweaks

**Files:**
- `components/ui/*` (shadcn components)
- Most `components/parent/*`, `components/tasks/*`
- CSS/Tailwind classes

**Exception:** Don't change component logic that affects validation

---

### Utility Functions

**Safe:**
- `lib/utils/*`
- Helper functions
- Formatting functions
- Date/time utilities

**Caution:** If used in validation, test thoroughly

---

### Documentation

**Safe:**
- `README.md`
- `.handoff/*` files (this one!)
- `docs/*` (except specs)
- Comments in code

---

## 🔧 When You MUST Modify Locked Files

If you absolutely need to modify a locked file:

### Step 1: Document Reasoning

Add entry to `.handoff/DECISIONS.md`:

```markdown
## Decision #009: [Your Change]

**Date:** 2026-01-XX
**Decision Maker:** [Your name]

### Context
Why this change is necessary...

### Options Considered
A, B, C...

### Chosen
What you're doing...

### Rationale
Why this is the best option...

### Consequences
What could break, what are the trade-offs...
```

### Step 2: Get Approval

- ✅ If user (Peter) is available: Ask for approval
- ⚠️ If urgent and user unavailable: Proceed with extreme caution
- 📝 Document decision thoroughly

### Step 3: Test Thoroughly

- Run full test suite
- Test manually (see `TESTING_CHECKLIST.md`)
- Test on staging if possible
- Verify no regressions

### Step 4: Plan Rollback

- Know how to undo your change
- Have rollback SQL ready (for DB changes)
- Git commit separately for easy revert

### Step 5: Update Handoff

- Update `.handoff/IMPLEMENTATION_STATUS.md`
- Update `.handoff/HANDOFF.md` with current status
- Update `.handoff/LOCK.md` if lock status changes

---

## 🚨 Red Flags

**STOP and ask for approval if you're about to:**

- ❌ Add a task to AUTO_APPROVAL_WHITELIST
- ❌ Edit an applied migration file
- ❌ Add/remove a task category
- ❌ Change approval type enum
- ❌ Disable validation in complete route
- ❌ Change Supabase URL/keys
- ❌ Modify RLS policies without testing
- ❌ Change point values by more than 50%
- ❌ Delete task templates
- ❌ Change preset task keys without verifying templates exist

---

## 📋 Lock Status Summary

| Item | Status | Modify Risk | Approval Needed? |
|------|--------|-------------|------------------|
| Auto-approval whitelist | 🔒 Locked | Critical | YES |
| Applied migrations | 🔒 Locked | Critical | NO (create new) |
| Task categories | 🔒 Locked | High | YES |
| Approval types | 🔒 Locked | High | YES |
| Supabase config | 🔒 Locked | Critical | YES |
| Task templates | ⚠️ Caution | Medium | Depends |
| Onboarding presets | ⚠️ Caution | Medium | NO (but test) |
| Timer/checklist validation | ⚠️ Caution | Medium | NO (but test) |
| RLS policies | ⚠️ Caution | High | YES (test first) |
| Point values | ⚠️ Caution | Low | Depends |
| UI components | 🟢 Safe | Low | NO |
| Utilities | 🟢 Safe | Low | NO |
| Documentation | 🟢 Safe | None | NO |

---

## 🆘 Emergency Overrides

**If production is broken and you MUST bypass locks:**

1. **Document in git commit:**
   ```
   EMERGENCY: Fix broken auto-approval validation

   Production bug: timer tasks not completing
   Root cause: Evidence validation too strict
   Fix: Loosen validation temporarily

   TODO: Revert after proper fix deployed
   Ticket: #123
   ```

2. **Add TODO comment:**
   ```typescript
   // EMERGENCY FIX 2026-01-10: Temporarily disabled strict validation
   // TODO: Re-enable after fixing TimerModal evidence submission
   // See: #123
   if (task.approval_type === 'timer') {
     // Temporary: Accept any evidence
     // if (!evidence?.timerCompleted) { ... }
   }
   ```

3. **Create follow-up ticket immediately**

4. **Revert ASAP after proper fix**

---

*Last Updated: 2026-01-10*
*When in doubt, ask before modifying locked files*
