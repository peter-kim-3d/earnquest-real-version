# Design Decisions Log - EarnQuest Task System v2

> 중요한 설계 및 정책 결정 기록 (Why we did what we did)

**Last Updated:** 2026-01-10

---

## 📜 Decision Format

Each decision follows this structure:
- **Date:** When decision was made
- **Decision:** What was decided
- **Context:** Why we needed to decide
- **Options Considered:** Alternatives we evaluated
- **Chosen:** What we picked
- **Rationale:** Why we picked it
- **Consequences:** Trade-offs and implications
- **Status:** Active | Deprecated | Revisiting

---

## Decision #001: Auto-approval Restriction

**Date:** 2025-01-09
**Decision Maker:** Peter + AI consensus (Perplexity, Grok, Gemini)

### Context
v1.0 had 4 tasks with auto-approval:
- Make bed (15 pts)
- Clear dishes (20 pts)
- Brush teeth (10 pts)
- Put away backpack (15 pts)

Perplexity identified trust erosion scenario:
- Day 1: Child honest → auto ✓ (parent watching)
- Day 5: Child cheats → auto ✗ (parent not watching)
- Day 12: Parent loses trust → manually checks everything → friction → app abandonment

### Options Considered

**Option A:** Keep all 4 auto-approval tasks
- Pros: Simplest, no migration needed
- Cons: Trust erosion risk remains

**Option B:** Remove auto-approval completely
- Pros: No trust issues
- Cons: Parent friction too high, defeats "trust over verification"

**Option C:** Restrict to 2 "binary" tasks only
- Pros: Balance trust and verification
- Cons: Need migration, some tasks change approval type

### Chosen: Option C - Whitelist Only 2 Tasks

**Auto-approval allowed:**
- `backpack` - Put away backpack & shoes (binary: there or not)
- `get_dressed` - Get dressed by yourself (binary: dressed or not, 5-7yo)

**Changed to other approval types:**
- Make bed → `checklist` (3 items: sheets, pillows, comforter)
- Clear dishes → `parent` (quality varies)
- Brush teeth → `checklist` (2 items: AM, PM)

### Rationale

1. **Binary clarity:** Backpack is either put away or not. No subjective quality.
2. **Age-appropriate:** Get dressed is self-evident for 5-7yo learning independence.
3. **Subjective quality:** Make bed and clear dishes have quality variations → need feedback.
4. **Brush teeth:** Changed to checklist to track AM/PM explicitly (2x per day).

### Implementation

```typescript
// Whitelist enforcement in API layer
const AUTO_APPROVAL_WHITELIST = ['backpack', 'get_dressed', 'set_alarm'];

// In Zod validation
CreateTaskSchema.refine((data) => {
  if (data.approval_type === 'auto' && !WHITELIST.includes(data.name)) {
    return false; // Reject
  }
  return true;
}, 'Auto-approval only allowed for whitelist tasks');
```

### Consequences

**Positive:**
- ✅ Trust erosion risk minimized
- ✅ Parents still get friction reduction for truly binary tasks
- ✅ Checklist type provides clear completion criteria

**Negative:**
- ⚠️ Parents lose convenience for make bed, clear dishes
- ⚠️ Migration complexity (change approval_type for existing tasks)

**Mitigation:**
- Checklist and timer types provide clear criteria → reduce subjectivity
- Fix request templates help parents give constructive feedback quickly

### Status: ✅ Active

---

## Decision #002: Category Rename (life → household)

**Date:** 2025-01-09
**Decision Maker:** Peter + Gemini feedback

### Context
v1.0 had category "life" which was ambiguous:
- Does "clean room" belong in life or health?
- Does "help with dinner" belong in life or learning?
- US parents struggled to categorize tasks

### Options Considered

**Option A:** Keep "life" and add subcategories
- Pros: No migration
- Cons: Still ambiguous root category

**Option B:** Rename to "household"
- Pros: Clear meaning (가사, 책임)
- Cons: Requires migration

**Option C:** Add 4th category "social"
- Pros: Separate social skills
- Cons: Overlaps with existing Kindness System

### Chosen: Option B - Rename to "household"

```diff
- type TaskCategory = 'learning' | 'life' | 'health';
+ type TaskCategory = 'learning' | 'household' | 'health';
```

### Rationale

1. **Cultural clarity:** US parents think "household responsibilities" not "life skills"
2. **Concrete definition:** household = chores, cleaning, organization, family duties
3. **No overlap:** Kindness System already handles social/kindness (Proposal §5)

### Implementation

```sql
-- Migration 020
UPDATE tasks SET category = 'household'
WHERE category IN ('life', 'chores', 'other');

-- Preserve old value for rollback
ALTER TABLE tasks RENAME COLUMN category TO category_old;
ALTER TABLE tasks RENAME COLUMN category_v2 TO category;
```

### Consequences

**Positive:**
- ✅ Clear category boundaries
- ✅ Better UI labels (🏠 Household vs 🌱 Life)
- ✅ Easier for parents to categorize new tasks

**Negative:**
- ⚠️ Migration required
- ⚠️ UI strings need i18n update

### Status: ✅ Active

---

## Decision #003: Timer/Checklist Auto-approval

**Date:** 2025-01-09
**Decision Maker:** Peter + GPT feedback

### Context
New approval types (timer, checklist) needed approval logic.
- Timer: Child runs 20min timer for reading
- Checklist: Child checks off "brush teeth AM/PM"

Should these require parent approval?

### Options Considered

**Option A:** Require parent approval for all
- Pros: Maximum oversight
- Cons: Defeats purpose of objective criteria

**Option B:** Auto-approve timer/checklist
- Pros: Objective completion, reduces parent friction
- Cons: Child could still cheat (not actually read for 20min)

**Option C:** Trust level unlocks auto-approval
- Pros: Earned trust
- Cons: Complex, not MVP

### Chosen: Option B - Auto-approve on Objective Completion

**Timer tasks:**
```typescript
if (approval_type === 'timer' && evidence.timerCompleted) {
  status = 'auto_approved';
  pointsAwarded = task.points;
  await awardPoints(childId, points);
}
```

**Checklist tasks:**
```typescript
if (approval_type === 'checklist' && evidence.checklistState.every(item => item)) {
  status = 'auto_approved';
  pointsAwarded = task.points;
  await awardPoints(childId, points);
}
```

### Rationale

1. **Objective criteria:** Timer elapsed = objective. Checklist complete = self-reported but structured.
2. **Parent friction:** If parents had to approve every timer task, they'd just use manual approval.
3. **Self-verification:** Checklist teaches self-assessment ("Did I do both AM and PM?")
4. **Trust pedagogy:** Part of learning responsibility is self-accountability.

### Implementation

```typescript
// In tasks/complete route
const AUTO_APPROVE_TYPES = ['auto', 'timer', 'checklist'];

if (AUTO_APPROVE_TYPES.includes(task.approval_type)) {
  // Validate evidence
  if (task.approval_type === 'timer' && !evidence?.timerCompleted) {
    return error('Timer must complete');
  }
  if (task.approval_type === 'checklist' && !evidence?.checklistState?.every(Boolean)) {
    return error('All checklist items required');
  }

  // Auto-approve
  initialStatus = 'auto_approved';
  await awardPoints(...);
}
```

### Consequences

**Positive:**
- ✅ Reduces parent workload significantly
- ✅ Teaches self-accountability
- ✅ Objective completion criteria

**Negative:**
- ⚠️ Child could still game the system (leave timer running, don't actually read)
- ⚠️ No quality check on task execution

**Mitigation:**
- Phase 2: Trust level system → demote to manual approval if patterns detected
- Parents can always spot-check completed tasks
- Point value reflects trust (reading = 30pts, not 100pts)

### Status: ✅ Active

---

## Decision #004: Metadata JSONB Column

**Date:** 2025-01-09
**Decision Maker:** Peter + Grok feedback

### Context
Need to store extensible task metadata for:
- AI photo task generation (Phase 3)
- App integrations (Duolingo, Artales) (Phase 3)
- Learning analytics (subject, difficulty) (Phase 2)
- Source tracking (manual, template, AI)

### Options Considered

**Option A:** Add nullable columns for each field
```sql
ALTER TABLE tasks ADD COLUMN ai_extracted BOOLEAN;
ALTER TABLE tasks ADD COLUMN original_image TEXT;
ALTER TABLE tasks ADD COLUMN integration_app TEXT;
ALTER TABLE tasks ADD COLUMN subject TEXT;
ALTER TABLE tasks ADD COLUMN difficulty INTEGER;
-- ... 10+ columns
```
- Pros: Type-safe, indexed
- Cons: Schema bloat, migration hell

**Option B:** Single JSONB column
```sql
ALTER TABLE tasks ADD COLUMN metadata JSONB DEFAULT '{}';
```
- Pros: Flexible, no migrations for new fields
- Cons: Less type-safe, requires validation

**Option C:** Separate metadata table
- Pros: Normalized, clean schema
- Cons: JOIN overhead, complexity

### Chosen: Option B - Single JSONB Column

```typescript
interface TaskMetadata {
  subcategory?: string;
  tags?: string[];
  source?: {
    type: 'manual' | 'template' | 'ai_photo' | 'ai_text' | 'integration';
    templateKey?: string;
    originalImage?: string;
  };
  learning?: {
    subject?: string;
    difficulty?: number; // 1-5
  };
  integration?: {
    app?: string;
    externalId?: string;
  };
}
```

### Rationale

1. **Future-proof:** Add fields without migrations
2. **PostgreSQL JSONB:** Powerful, GIN indexable, fast
3. **Phase flexibility:** MVP doesn't need all fields, add as we grow
4. **Clean schema:** 1 metadata column vs 10+ nullable columns

### Implementation

```sql
-- Migration 020
ALTER TABLE tasks ADD COLUMN metadata JSONB DEFAULT '{}';
CREATE INDEX idx_tasks_metadata_gin ON tasks USING gin(metadata);

-- Query by metadata
SELECT * FROM tasks WHERE metadata @> '{"source": {"type": "ai_photo"}}';
```

### Consequences

**Positive:**
- ✅ No schema changes for Phase 2, 3, 4
- ✅ PostgreSQL JSONB is battle-tested
- ✅ GIN index supports complex queries

**Negative:**
- ⚠️ TypeScript can't enforce JSONB structure at DB level
- ⚠️ Need Zod validation at API layer
- ⚠️ Debugging metadata errors harder (not schema error, runtime error)

**Mitigation:**
- Zod schema for TaskMetadata in validation layer
- Document metadata structure in types/task.ts
- Use TypeScript strict mode to catch issues early

### Status: ✅ Active

---

## Decision #005: Four Onboarding Presets

**Date:** 2025-01-09
**Decision Maker:** Peter + Perplexity feedback

### Context
v1.0 had 3 presets:
- Quick Start (3 tasks)
- Balanced (6 tasks)
- Learning Focus (5 tasks)

Perplexity identified: Screen time conflict = #1 US parent pain point.

### Options Considered

**Option A:** Keep 3 presets
- Pros: Simple
- Cons: Doesn't address screen time pain point

**Option B:** Add "Screen Time Peace" preset
- Pros: Addresses major pain point
- Cons: More complexity in onboarding

**Option C:** Make screen budget configurable per preset
- Pros: Most flexible
- Cons: Too complex for MVP

### Chosen: Option B - Add 4th Preset

**v2 Presets:**
| Preset | Tasks | XP/day | Key Feature |
|--------|-------|--------|-------------|
| **Busy Parent** | 3 | 90-120 | Minimal management |
| **Balanced Growth** ⭐ | 7 | 200-280 | Recommended |
| **Academic First** | 5 | 180-240 | Point overrides (homework=60) |
| **Screen Time Peace** | 4 | 160-200 | Tight screen budget |

### Rationale

1. **Market research:** Perplexity cited screen time as top conflict
2. **Differentiation:** Screen preset has STRICT screen budget (180min/week = 3hrs)
3. **Motivation:** Low daily points → forces task completion for any screen time
4. **Minimal tasks:** Only 4 tasks → reduces excuse of "too many chores"

### Implementation

```typescript
// lib/services/onboarding.ts
const PRESET_TASK_KEYS = {
  busy: ['homework', 'brush_teeth', 'backpack'],
  balanced: ['homework', 'reading', 'make_bed', 'clear_dishes', 'backpack', 'brush_teeth', 'exercise'],
  academic: ['homework', 'reading', 'practice_instrument', 'brush_teeth', 'exercise'],
  screen: ['homework', 'clear_dishes', 'brush_teeth', 'exercise'], // NEW
};

const SCREEN_BUDGETS = {
  busy: 300,     // 5 hrs
  balanced: 240, // 4 hrs
  academic: 210, // 3.5 hrs
  screen: 180,   // 3 hrs (STRICT)
};
```

### Consequences

**Positive:**
- ✅ Addresses #1 parent pain point
- ✅ Clear positioning: "If screen time is your battle, choose this"
- ✅ Differentiated from other presets

**Negative:**
- ⚠️ 4 presets = more onboarding decision paralysis
- ⚠️ "Screen" name may feel judgmental to some parents

**Mitigation:**
- "Balanced" marked as RECOMMENDED (most will choose this)
- Onboarding question: "What's your main goal?" → guides preset selection
- Can always change preset later

### Status: ✅ Active

---

## Decision #006: Conditional Task Questions

**Date:** 2025-01-09
**Decision Maker:** Peter + Gemini feedback

### Context
Gemini: 66% of US households have pets, but 34% don't.
Default "Feed your pet" task → 34% feel excluded or annoyed.

### Options Considered

**Option A:** Include pet tasks by default
- Pros: Simple
- Cons: 34% annoyed

**Option B:** No pet tasks at all
- Pros: No exclusion
- Cons: 66% miss relevant task

**Option C:** Conditional questions during onboarding
- Pros: Personalized
- Cons: Adds onboarding steps

### Chosen: Option C - Conditional Questions

**Questions:**
1. "Do you have a pet?" → Add `feed_pet` task (20pts, parent approval)
2. "Play an instrument?" → Add `practice_instrument` task (30pts, 20min timer)

**Preset logic:**
```typescript
// Only show instrument question for Academic/Balanced
if (['academic', 'balanced'].includes(preset)) {
  showInstrumentQuestion = true;
}

// Always show pet question
showPetQuestion = true;
```

### Rationale

1. **Personalization:** Family-specific tasks without overwhelming onboarding
2. **Inclusivity:** No assumptions about family composition
3. **Simplicity:** Only 2 questions (not 10)

### Implementation

```typescript
// app/[locale]/(app)/onboarding/select-style/page.tsx
const [hasPet, setHasPet] = useState(false);
const [hasInstrument, setHasInstrument] = useState(false);

// Pass to API
await fetch('/api/onboarding/populate', {
  body: JSON.stringify({
    style: preset,
    conditionalAnswers: { hasPet, hasInstrument }
  })
});
```

### Consequences

**Positive:**
- ✅ No exclusion feeling
- ✅ Relevant tasks only
- ✅ Minimal onboarding friction (2 questions)

**Negative:**
- ⚠️ Adds 10-15 seconds to onboarding
- ⚠️ Edge case: family gets pet later → must manually add task

**Mitigation:**
- Keep questions optional (can skip)
- Phase 2: Allow adding conditional tasks post-onboarding

### Status: ✅ Active

---

## Decision #007: Hybrid Task System (task_instances)

**Date:** 2024-12-XX (Pre-v2, carried forward)
**Decision Maker:** Peter

### Context
Need to track:
- Recurring tasks (homework every day)
- Daily completion (did homework today?)
- Historical completions (did homework yesterday?)

### Options Considered

**Option A:** Single `tasks` table with completion status
- Pros: Simple
- Cons: Can't track history, recurring hard

**Option B:** tasks + task_completions (standard pattern)
- Pros: Clean separation
- Cons: Recurring tasks need daily creation

**Option C:** tasks + task_instances + task_completions
- Pros: Handles recurring, tracks history
- Cons: Complex

**Option D:** tasks + task_instances (combined)
- Pros: Simpler than C, handles recurring
- Cons: Hybrid approach, less standard

### Chosen: Option D - Hybrid (tasks + task_instances)

**Structure:**
- `tasks`: Master template (name, points, approval_type, frequency)
- `task_instances`: Daily assignment (references task, specific to date + child)
- Completion status stored in `task_instances` (no separate completions table)

### Rationale

1. **Recurring tasks:** task auto-generates instance every day (if frequency=daily)
2. **History:** Each instance tracks completion for that specific day
3. **Simplicity:** Fewer tables than full 3-table system

### Implementation

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  name TEXT,
  frequency TEXT DEFAULT 'daily',
  -- ...master template fields
);

CREATE TABLE task_instances (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  child_id UUID,
  date DATE,
  status TEXT, -- pending, completed, approved
  -- ...completion fields
);
```

### Consequences

**Positive:**
- ✅ Handles daily recurring tasks well
- ✅ Historical tracking built-in
- ✅ Simpler than 3-table system

**Negative:**
- ⚠️ Less standard pattern (some confusion)
- ⚠️ task_instances is large table (grows daily)

**Status:** ✅ Active (Pre-v2 decision, maintained in v2)

---

## Decision #008: Fix Request Templates

**Date:** 2025-01-09
**Decision Maker:** Peter + GPT feedback

### Context
Parents need to give feedback when tasks aren't done properly.
Typing custom message every time = friction.

### Options Considered

**Option A:** Free-form text only
- Pros: Maximum flexibility
- Cons: High friction, parents skip feedback

**Option B:** Predefined templates only
- Pros: Fast selection
- Cons: May not cover all cases

**Option C:** Templates + optional custom message
- Pros: Fast default, flexible override
- Cons: More UI complexity

### Chosen: Option C - Templates with Optional Custom Message

**Structure:**
```typescript
const FIX_TEMPLATES = {
  clean_room: [
    { key: 'floor', icon: '👕', text: 'Please pick up clothes from the floor' },
    { key: 'desk', icon: '📚', text: 'Your desk needs organizing' },
    { key: 'bed', icon: '🛏️', text: "Don't forget to make your bed" },
  ],
  default: [
    { key: 'almost', icon: '💪', text: 'Almost there! Just a bit more' },
    { key: 'retry', icon: '🔄', text: 'Give it another try' },
  ]
};
```

**Usage:**
1. Parent clicks "Request Fix"
2. See 3-5 task-specific templates
3. Select 2-3 items (checkboxes)
4. Optionally add custom message (200 char)
5. Send to child

### Rationale

1. **Speed:** 95% of cases covered by templates (1 click)
2. **Specificity:** Task-specific templates more actionable
3. **Flexibility:** Custom message for edge cases
4. **Tone:** Templates are constructive, positive tone

### Implementation

```typescript
// components/parent/FixRequestModal.tsx
const [selectedItems, setSelectedItems] = useState<string[]>([]);
const [customMessage, setCustomMessage] = useState('');

const templates = FIX_TEMPLATES[task.templateKey] || FIX_TEMPLATES.default;

// Send fix request
await fetch('/api/tasks/fix-request', {
  body: JSON.stringify({
    completionId,
    items: selectedItems.map(key => templates.find(t => t.key === key).text),
    message: customMessage || null
  })
});
```

### Consequences

**Positive:**
- ✅ 2-3 clicks vs typing paragraph
- ✅ Consistent, constructive tone
- ✅ Child gets actionable feedback

**Negative:**
- ⚠️ Need to maintain templates per task type
- ⚠️ May not cover all edge cases

**Mitigation:**
- Default fallback templates always available
- Phase 2: Learn from custom messages, add popular ones to templates

### Status: ✅ Active

---

## Deprecated Decisions

### DEP-001: Auto-approval for make_bed

**Date:** 2025-01-05 (v1.0)
**Deprecated:** 2025-01-09 (v2.0)

**Original Decision:** make_bed task auto-approves

**Why Deprecated:** Changed to checklist approval type in v2.0
- Reason: Quality varies (sheets vs full hotel-style bed)
- Replacement: 3-item checklist (sheets, pillows, comforter)

**Status:** ❌ Deprecated

---

## Decisions Under Review

### REV-001: Multi-child Task Assignment

**Date:** TBD (Phase 2)
**Status:** 🔄 Deferred to Phase 2

**Current State:** child_id nullable (null = all children)

**Problem:** 3+ children need individual assignment

**Options:**
- Keep nullable (workaround: duplicate task)
- Add task_assignments many-to-many table

**Timeline:** Phase 2 (after MVP launch)

---

*Last Updated: 2026-01-10*
*Total Active Decisions: 8*
*Total Deprecated: 1*
*Under Review: 1*
