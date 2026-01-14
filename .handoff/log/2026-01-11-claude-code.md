# Claude Code Work Log - 2026-01-11

## Summary
Fixed child dashboard task visibility issues, resolved task completion API errors, and ensured timer/checklist approval types work correctly.

---

## Issues Fixed

### 1. Child Dashboard Shows No Tasks
**Problem**: Child dashboard (Anna, Irene) displayed no tasks despite tasks existing in database.

**Root Cause**:
- `v_child_today_tasks` view lacked permission grants
- View didn't filter based on `child_task_overrides` table

**Solution**:
```sql
-- Migration: 026_fix_child_today_tasks_view.sql
DROP VIEW IF EXISTS v_child_today_tasks;

CREATE VIEW v_child_today_tasks AS
SELECT
  t.id,
  t.family_id,
  c.id AS child_id,
  t.child_id AS task_child_id,
  t.name,
  t.description,
  t.category,
  t.points,
  t.icon,
  t.frequency,
  t.approval_type,
  t.requires_photo,
  -- v2 fields for timer and checklist
  t.timer_minutes,
  t.checklist,
  t.metadata,
  c.name AS child_name,
  (SELECT tc.id FROM task_completions tc WHERE tc.task_id = t.id AND tc.child_id = c.id AND tc.requested_at >= date_trunc('day', NOW()) ORDER BY tc.requested_at DESC LIMIT 1) AS today_completion_id,
  (SELECT tc.status FROM task_completions tc WHERE tc.task_id = t.id AND tc.child_id = c.id AND tc.requested_at >= date_trunc('day', NOW()) ORDER BY tc.requested_at DESC LIMIT 1) AS today_status
FROM tasks t
CROSS JOIN children c
LEFT JOIN child_task_overrides cto ON cto.task_id = t.id AND cto.child_id = c.id
WHERE t.is_active = TRUE
  AND t.deleted_at IS NULL
  AND c.family_id = t.family_id
  AND c.deleted_at IS NULL
  AND (t.child_id IS NULL OR t.child_id = c.id)
  -- CRITICAL: Check that the task is not disabled for this specific child
  AND (cto.is_enabled IS NULL OR cto.is_enabled = TRUE)
  AND (
    t.frequency = 'daily'
    OR (t.frequency = 'weekly' AND (t.days_of_week IS NULL OR EXTRACT(DOW FROM NOW())::INTEGER = ANY(t.days_of_week)))
    OR t.frequency = 'one_time'
  );

-- Grant SELECT permission
GRANT SELECT ON v_child_today_tasks TO authenticated;
GRANT SELECT ON v_child_today_tasks TO anon;
```

**Files Modified**:
- `supabase/migrations/026_fix_child_today_tasks_view.sql` (created)
- `app/[locale]/(child)/child/dashboard/page.tsx` (added debug logging)

---

### 2. Irene Has No Tasks (Anna Has 9)
**Problem**: Parent dashboard showed Anna with 9 tasks, Irene with 0 tasks.

**Root Cause**: All tasks had `child_id` set to Anna's ID instead of `NULL` (shared).

**Solution**:
```sql
-- Set all tasks to be shared (child_id = NULL)
UPDATE tasks
SET child_id = NULL
WHERE child_id = '82577dc9-b073-4c3a-b725-1f52e270785d'
  AND is_active = true
  AND deleted_at IS NULL;
```

**Result**: Both children now see all tasks.

---

### 3. TaskFormDialog Infinite Loop
**Problem**: Browser error "React limits the number of nested updates to prevent infinite loops" when opening task form dialog.

**Root Cause**: `useEffect` dependency array included `children` array, which gets a new reference on every render.

**Solution**:
```typescript
// components/parent/TaskFormDialog.tsx:130
useEffect(() => {
  if (isOpen) {
    if (initialChildId) {
      setSelectedChildIds(new Set([initialChildId]));
    } else if (children.length > 0) {
      if (task?.id) {
        fetchTaskOverrides(task.id);
      } else {
        setSelectedChildIds(new Set(children.map(c => c.id)));
      }
    } else {
      setSelectedChildIds(new Set());
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isOpen, initialChildId, task?.id]); // Removed 'children' from dependencies
```

**Files Modified**:
- `components/parent/TaskFormDialog.tsx`

---

### 4. Task Completion Errors
**Problem**: All task completion attempts failed with various errors:
- `{"error":"Instance ID required for auto-assigned tasks"}`
- `{"error":"All checklist items must be completed"}`
- `{"error":"Timer must be completed for timer-based tasks"}`

**Root Cause**:
- Tasks had `auto_assign = true` but no task instances created
- Evidence data (timer/checklist) not passed from UI to API

**Solutions**:

#### 4.1. Database: Set auto_assign to false
```sql
UPDATE tasks
SET auto_assign = false
WHERE is_active = true
  AND deleted_at IS NULL;
```

#### 4.2. Validation Schema: Change default
```typescript
// lib/validation/task.ts:122
auto_assign: z.boolean().default(false), // Changed from true
```

#### 4.3. TaskFormDialog: Set default to false
```typescript
// components/parent/TaskFormDialog.tsx:51, 76, 97
auto_assign: false, // Changed from true
```

#### 4.4. TaskList: Pass evidence to API
```typescript
// components/child/TaskList.tsx:89-113
const handleTaskComplete = async (
  taskId: string,
  evidence?: {
    timerCompleted?: boolean;
    checklistState?: boolean[];
  }
) => {
  const response = await fetch('/api/tasks/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskId,
      childId,
      ...(evidence && { evidence }), // Include evidence
    }),
  });
  // ...
};

// Pass handleTaskComplete directly to TaskCard
<TaskCard
  key={task.id}
  task={task}
  onComplete={handleTaskComplete} // Changed from inline function
/>
```

**Files Modified**:
- `lib/validation/task.ts`
- `components/parent/TaskFormDialog.tsx`
- `components/child/TaskList.tsx`

---

### 5. Timer and Checklist UI Not Working
**Problem**: Timer and checklist buttons appeared but clicking them resulted in errors.

**Root Cause**: `v_child_today_tasks` view didn't include `timer_minutes`, `checklist`, and `metadata` fields.

**Solution**: Added fields to view (see Issue #1 solution above).

**Result**:
- Timer tasks show timer modal
- Checklist tasks show checklist modal
- Both complete successfully

---

### 6. Timer Input Step Validation Error
**Problem**: Browser validation error when entering 1 or 2 minutes: "Please enter a valid value. The nearest values are 1 and 6."

**Root Cause**: Timer input had `step={5}`, allowing only multiples of 5.

**Solution**:
```typescript
// components/parent/TaskFormDialog.tsx:478
<Input
  type="number"
  value={formData.timer_minutes}
  onChange={(e) => setFormData({ ...formData, timer_minutes: parseInt(e.target.value) || 1 })}
  min={1}
  max={180}
  step={1} // Changed from 5
  className="w-24 text-center text-lg font-bold"
  required
/>
```

**Files Modified**:
- `components/parent/TaskFormDialog.tsx`

---

### 7. Points Validation Error for 1-Minute Timer
**Problem**: Creating 1-minute timer task failed with `{"error":"Points must be at least 10"}`.

**Root Cause**:
- Auto-calculated points for 1 minute = 5 XP (1 * 1.5 = 1.5, rounded to 5)
- Validation required minimum 10 points

**Solution**:

#### 7.1. Reduce minimum points in validation
```typescript
// lib/validation/task.ts:91, 234
points: z
  .number()
  .int('Points must be a whole number')
  .min(5, 'Points must be at least 5') // Changed from 10
  .max(500, 'Points cannot exceed 500')
```

#### 7.2. Update UI slider and buttons
```typescript
// components/parent/TaskFormDialog.tsx:371, 379-381, 387, 393
// Min button: Math.max(5, ...) instead of Math.max(10, ...)
// Slider: min="5" instead of min="10"
// Slider: step="5" instead of step="10"
// Label: "5 XP" instead of "10 XP"
// Plus button: +5 instead of +10
```

**Files Modified**:
- `lib/validation/task.ts`
- `components/parent/TaskFormDialog.tsx`

---

## Testing Results

### ✅ Timer Tasks (1 minute)
- Created successfully
- Timer modal opens
- Countdown works
- Completion successful
- 5 XP awarded

### ✅ Checklist Tasks
- Modal opens
- All items can be checked
- Completion successful
- Points awarded

### ✅ Parent Approval Tasks
- "I did it" button works
- Moves to "Parent Checking" tab
- 24-hour auto-approval set

### ✅ Auto Approval Tasks
- Instant approval
- Points awarded immediately
- Moves to "Completed" tab

---

## Files Changed

### Created
1. `supabase/migrations/026_fix_child_today_tasks_view.sql`
2. `app/api/debug/tasks/route.ts` (debug endpoint)
3. `app/api/debug/task-fields/route.ts` (debug endpoint)

### Modified
1. `components/parent/TaskFormDialog.tsx`
   - Fixed infinite loop
   - Set auto_assign default to false
   - Changed timer step to 1
   - Adjusted points minimum to 5

2. `components/child/TaskList.tsx`
   - Added evidence parameter to handleTaskComplete
   - Pass handleTaskComplete directly to TaskCard

3. `lib/validation/task.ts`
   - Changed auto_assign default to false
   - Reduced minimum points from 10 to 5

4. `app/[locale]/(child)/child/dashboard/page.tsx`
   - Added debug logging

---

## Database Changes

### SQL Executed
```sql
-- 1. Fix view and add permissions
DROP VIEW IF EXISTS v_child_today_tasks;
CREATE VIEW v_child_today_tasks AS ...
GRANT SELECT ON v_child_today_tasks TO authenticated;
GRANT SELECT ON v_child_today_tasks TO anon;

-- 2. Share tasks (remove Anna-only assignment)
UPDATE tasks SET child_id = NULL WHERE child_id = '82577dc9-b073-4c3a-b725-1f52e270785d';

-- 3. Disable auto_assign
UPDATE tasks SET auto_assign = false WHERE is_active = true AND deleted_at IS NULL;
```

---

## Key Learnings

1. **Always check view permissions** when creating/updating database views
2. **Avoid array dependencies in useEffect** - use primitive values or memoized references
3. **Task instances are not needed** for this app - set auto_assign to false everywhere
4. **Evidence must flow through** UI → TaskList → API for timer/checklist tasks
5. **View must include all required fields** for child dashboard to function properly
6. **HTML5 input validation** can block valid inputs if step/min/max are misconfigured

---

## Next Steps (If Needed)

1. Remove debug API endpoints (`/api/debug/*`)
2. Consider removing `auto_assign` field entirely if never used
3. Add tests for timer/checklist completion flow
4. Consider adding task preview in parent dashboard

---

## Timeline

- **Issue 1**: Child dashboard permission denied → Fixed with view recreation + GRANT
- **Issue 2**: Irene no tasks → Fixed with UPDATE tasks SET child_id = NULL
- **Issue 3**: Infinite loop → Fixed by removing array from useEffect deps
- **Issue 4**: Completion errors → Fixed by setting auto_assign = false everywhere
- **Issue 5**: Timer/checklist UI broken → Fixed by adding fields to view
- **Issue 6**: Timer step validation → Fixed by changing step to 1
- **Issue 7**: Points validation → Fixed by reducing minimum to 5

All issues resolved successfully. System now fully functional.
