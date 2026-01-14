# Code Conventions - EarnQuest

> 코드 스타일, 네이밍, 패턴 가이드

**Last Updated:** 2026-01-10

---

## 📋 Table of Contents

1. [General Principles](#general-principles)
2. [TypeScript Conventions](#typescript-conventions)
3. [React/Next.js Conventions](#reactnextjs-conventions)
4. [API Route Conventions](#api-route-conventions)
5. [Database Conventions](#database-conventions)
6. [Naming Conventions](#naming-conventions)
7. [File Organization](#file-organization)
8. [Error Handling](#error-handling)
9. [Testing Conventions](#testing-conventions)
10. [Comments & Documentation](#comments--documentation)

---

## General Principles

### Code Style
- **Language:** TypeScript (strict mode)
- **Formatter:** Prettier (default config)
- **Linter:** ESLint (Next.js recommended)
- **Indentation:** 2 spaces (not tabs)
- **Line Length:** 100 characters max (soft limit)
- **Quotes:** Single quotes for strings (except JSX)

### Quality Standards
- ✅ Type-safe: No `any` unless absolutely necessary
- ✅ Validated: All API inputs use Zod validation
- ✅ Tested: Critical paths have test coverage
- ✅ Accessible: UI components follow WCAG AA
- ✅ Performant: Optimize for mobile (target: 3s LCP)

---

## TypeScript Conventions

### Type Definitions

**✅ DO:**
```typescript
// Use descriptive type names (PascalCase)
type TaskCategory = 'learning' | 'household' | 'health';

// Use interfaces for object shapes
interface Task {
  id: string;
  name: string;
  category: TaskCategory;
}

// Use type for unions/primitives
type ApprovalType = 'parent' | 'auto' | 'timer' | 'checklist';

// Export types from centralized location
// lib/types/task.ts
export type { Task, TaskCategory, ApprovalType };
```

**❌ DON'T:**
```typescript
// Don't use any
const data: any = await fetch(...); // ❌

// Don't duplicate type definitions
// In file A:
type Task = { ... };
// In file B:
type Task = { ... }; // ❌ Import from file A instead

// Don't use generic names
type Data = { ... }; // ❌ Too vague
```

### Interfaces vs Types

**Use `interface` for:**
- Object shapes
- Extending existing types
- Classes

**Use `type` for:**
- Unions (`'a' | 'b'`)
- Primitives
- Computed types
- Function signatures

```typescript
// Interface
interface Task {
  id: string;
  name: string;
}

// Type
type TaskStatus = 'pending' | 'approved' | 'rejected';
type TaskWithStatus = Task & { status: TaskStatus };
```

### Strict Mode

**Enable in `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

---

## React/Next.js Conventions

### Component Structure

**✅ DO:**
```typescript
// 1. Imports (grouped)
import { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { useTaskMutation } from '@/hooks/use-tasks';
import type { Task } from '@/lib/types/task';

// 2. Types/Interfaces
interface TimerModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

// 3. Component
export default function TimerModal({
  task,
  isOpen,
  onClose,
  onComplete,
}: TimerModalProps) {
  // 3a. Hooks
  const [timeLeft, setTimeLeft] = useState(task.timer_minutes * 60);
  const { mutate: completeTask } = useTaskMutation();

  // 3b. Event handlers
  const handleComplete = () => {
    completeTask({ taskId: task.id });
    onComplete();
  };

  // 3c. Effects
  useEffect(() => {
    // Timer logic
  }, [timeLeft]);

  // 3d. Render
  return (
    <Dialog open={isOpen} onClose={onClose}>
      {/* JSX */}
    </Dialog>
  );
}
```

### Component Naming

**File names:**
- PascalCase: `TimerModal.tsx`
- Match component name exactly

**Component types:**
- Client components: `'use client'` at top
- Server components: No directive (default)
- Page components: `page.tsx` (Next.js convention)
- Layout components: `layout.tsx` (Next.js convention)

### Props Patterns

**✅ DO:**
```typescript
// Destructure props
function TaskCard({ task, onComplete }: TaskCardProps) {
  // ...
}

// Use interfaces for props
interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
}

// Optional props with ?
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string; // Optional
}
```

**❌ DON'T:**
```typescript
// Don't use props object
function TaskCard(props) { // ❌
  return <div>{props.task.name}</div>;
}

// Don't use inline types
function TaskCard({ task }: { task: any }) { // ❌
  // ...
}
```

### Hooks

**Custom hooks:**
```typescript
// File: hooks/use-tasks.ts
export function useTasks(familyId: string) {
  return useQuery({
    queryKey: ['tasks', familyId],
    queryFn: () => fetchTasks(familyId),
  });
}

// Usage:
const { data: tasks } = useTasks(familyId);
```

**Hook ordering:**
```typescript
function MyComponent() {
  // 1. Context hooks
  const { user } = useAuth();

  // 2. State hooks
  const [count, setCount] = useState(0);

  // 3. Query/mutation hooks
  const { data } = useTasks();
  const { mutate } = useTaskMutation();

  // 4. Ref hooks
  const inputRef = useRef<HTMLInputElement>(null);

  // 5. Effect hooks (last)
  useEffect(() => {
    // ...
  }, []);

  // ...
}
```

---

## API Route Conventions

### File Structure

```typescript
// app/api/tasks/complete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CompleteTaskSchema } from '@/lib/validation/task';

export async function POST(request: NextRequest) {
  // 1. Get Supabase client
  const supabase = await createClient();

  // 2. Get user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3. Parse and validate body
  const body = await request.json();
  const validationResult = CompleteTaskSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validationResult.error.flatten() },
      { status: 400 }
    );
  }

  // 4. Business logic
  const { taskId, evidence } = validationResult.data;
  // ... complete task logic

  // 5. Return response
  return NextResponse.json({ success: true, data: completion });
}
```

### Error Responses

**Standardized format:**
```typescript
// Success
return NextResponse.json({ success: true, data: result });

// Client error (400)
return NextResponse.json(
  { error: 'Validation failed', details: { ... } },
  { status: 400 }
);

// Unauthorized (401)
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// Forbidden (403)
return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

// Not found (404)
return NextResponse.json({ error: 'Task not found' }, { status: 404 });

// Server error (500)
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
```

### Validation

**Always use Zod:**
```typescript
// ✅ DO
const validationResult = CreateTaskSchema.safeParse(body);
if (!validationResult.success) {
  return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
}
const { name, category, points } = validationResult.data;

// ❌ DON'T
const { name, category, points } = body; // No validation!
```

---

## Database Conventions

### Table Naming

- **Tables:** snake_case, plural: `tasks`, `task_completions`, `task_templates`
- **Columns:** snake_case: `family_id`, `created_at`, `timer_minutes`
- **Foreign keys:** `{table}_id`: `task_id`, `child_id`, `family_id`

### Column Types

**Standard types:**
```sql
-- IDs
id UUID PRIMARY KEY DEFAULT gen_random_uuid()

-- Foreign keys
family_id UUID REFERENCES families(id) ON DELETE CASCADE

-- Strings
name TEXT NOT NULL
description TEXT

-- Enums (prefer CHECK constraint over ENUM type for flexibility)
category TEXT NOT NULL CHECK (category IN ('learning', 'household', 'health'))

-- Numbers
points INTEGER NOT NULL CHECK (points >= 10 AND points <= 500)
timer_minutes INTEGER CHECK (timer_minutes > 0 AND timer_minutes <= 180)

-- JSON
metadata JSONB DEFAULT '{}'
checklist JSONB

-- Timestamps
created_at TIMESTAMPTZ DEFAULT NOW()
updated_at TIMESTAMPTZ DEFAULT NOW()

-- Booleans
is_active BOOLEAN DEFAULT true
```

### Indexes

**Naming:**
```sql
-- Pattern: idx_{table}_{column(s)}
CREATE INDEX idx_tasks_category ON tasks(category);
CREATE INDEX idx_tasks_family_id ON tasks(family_id);

-- GIN indexes for JSONB
CREATE INDEX idx_tasks_metadata_gin ON tasks USING gin(metadata);

-- Unique indexes
CREATE UNIQUE INDEX idx_task_templates_template_key ON task_templates(template_key);
```

### Migrations

**File naming:**
```
001_initial_schema.sql
002_add_tasks_metadata.sql
020_task_system_v2_enums.sql
020_rollback_task_system_v2_enums.sql
```

**Migration structure:**
```sql
-- ============================================================================
-- Migration 020: Task System v2 - Category & Approval Type Migration
-- ============================================================================
-- Description: What this migration does
-- Rollback: See 020_rollback_task_system_v2_enums.sql
-- ============================================================================

-- STEP 1: Add columns
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- STEP 2: Migrate data
UPDATE tasks SET category = 'household' WHERE category = 'life';

-- STEP 3: Add constraints
ALTER TABLE tasks ADD CONSTRAINT valid_category_v2
  CHECK (category IN ('learning', 'household', 'health'));

-- ============================================================================
-- Migration complete!
-- ============================================================================
```

---

## Naming Conventions

### Variables

```typescript
// Booleans: is/has/should prefix
const isLoading = true;
const hasPermission = false;
const shouldValidate = true;

// Arrays: plural
const tasks = [];
const children = [];

// Counts: {noun}Count
const taskCount = 10;
const completionCount = 5;

// Handlers: handle{Action}
const handleClick = () => {};
const handleSubmit = () => {};
const handleComplete = () => {};

// State setters: set{Name}
const [count, setCount] = useState(0);
const [isOpen, setIsOpen] = useState(false);
```

### Functions

```typescript
// Actions: verb + noun
function createTask() {}
function deleteTask() {}
function updateTask() {}

// Getters: get{Name}
function getTasks() {}
function getUser() {}

// Checkers: is/has/can/should
function isValidTask() {}
function hasPermission() {}
function canApprove() {}

// Async: add Async suffix (optional but clear)
async function fetchTasksAsync() {}
async function saveTaskAsync() {}
```

### Constants

```typescript
// SCREAMING_SNAKE_CASE for true constants
const MAX_POINTS = 500;
const AUTO_APPROVAL_WHITELIST = ['backpack', 'get_dressed'];
const DEFAULT_TIMER_MINUTES = 20;

// PascalCase for enum-like objects
const TaskCategory = {
  LEARNING: 'learning',
  HOUSEHOLD: 'household',
  HEALTH: 'health',
} as const;

// camelCase for configuration
const apiConfig = {
  baseUrl: 'https://api.example.com',
  timeout: 5000,
};
```

---

## File Organization

### Directory Structure

```
project/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── tasks/
│   │       ├── create/route.ts
│   │       └── complete/route.ts
│   └── [locale]/          # i18n pages
│       └── (app)/         # App routes
│           ├── parent/
│           └── child/
│
├── components/            # React components
│   ├── ui/               # Reusable UI (shadcn)
│   ├── parent/           # Parent-specific
│   ├── tasks/            # Task-related
│   └── onboarding/       # Onboarding flow
│
├── lib/                   # Utilities
│   ├── types/            # TypeScript types
│   ├── validation/       # Zod schemas
│   ├── utils/            # Helper functions
│   ├── services/         # Business logic
│   └── supabase/         # Supabase client
│
├── hooks/                 # Custom React hooks
├── locales/              # i18n translations
├── public/               # Static assets
└── supabase/             # Database
    ├── migrations/
    └── seed/
```

### Import Order

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. External libraries
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';

// 3. Internal components
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

// 4. Internal utilities
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

// 5. Types
import type { Task } from '@/lib/types/task';
import type { User } from '@supabase/supabase-js';

// 6. Styles (if any)
import './styles.css';
```

---

## Error Handling

### Client-side

```typescript
// ✅ DO: Use try-catch for async operations
async function handleComplete() {
  try {
    const response = await fetch('/api/tasks/complete', {
      method: 'POST',
      body: JSON.stringify({ taskId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete task');
    }

    const data = await response.json();
    toast.success('Task completed!');
  } catch (error) {
    console.error('Error completing task:', error);
    toast.error(error instanceof Error ? error.message : 'Something went wrong');
  }
}
```

### Server-side

```typescript
// ✅ DO: Return structured errors
export async function POST(request: NextRequest) {
  try {
    // ... logic
  } catch (error) {
    console.error('Error in POST /api/tasks:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

### Validation Errors

```typescript
// ✅ DO: Use Zod for detailed errors
const validationResult = CreateTaskSchema.safeParse(body);
if (!validationResult.success) {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: validationResult.error.flatten().fieldErrors,
    },
    { status: 400 }
  );
}
```

---

## Testing Conventions

### Test File Naming

```
// Pattern: {file}.test.ts or {file}.spec.ts
lib/utils/task.ts        → lib/utils/task.test.ts
components/TaskCard.tsx  → components/TaskCard.test.tsx
```

### Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TaskCard from './TaskCard';

describe('TaskCard', () => {
  it('renders task name', () => {
    const task = { id: '1', name: 'Homework', points: 50 };
    render(<TaskCard task={task} />);
    expect(screen.getByText('Homework')).toBeInTheDocument();
  });

  it('shows points badge', () => {
    const task = { id: '1', name: 'Homework', points: 50 };
    render(<TaskCard task={task} />);
    expect(screen.getByText('50 pts')).toBeInTheDocument();
  });

  it('calls onComplete when clicked', async () => {
    const mockComplete = vi.fn();
    const task = { id: '1', name: 'Homework', points: 50 };
    render(<TaskCard task={task} onComplete={mockComplete} />);

    const button = screen.getByRole('button', { name: /complete/i });
    await userEvent.click(button);

    expect(mockComplete).toHaveBeenCalledWith('1');
  });
});
```

---

## Comments & Documentation

### When to Comment

**✅ DO comment:**
- Complex algorithms
- Business logic decisions
- Workarounds for bugs
- Non-obvious code

**❌ DON'T comment:**
- Self-explanatory code
- What code does (code should be self-documenting)

### Comment Style

```typescript
// ✅ GOOD: Explains WHY
// Auto-approval restricted to whitelist to prevent trust erosion
const AUTO_APPROVAL_WHITELIST = ['backpack', 'get_dressed'];

// ❌ BAD: Explains WHAT (obvious from code)
// Create a constant with whitelist tasks
const AUTO_APPROVAL_WHITELIST = ['backpack', 'get_dressed'];

// ✅ GOOD: Complex logic explained
// Timer tasks auto-approve because completion is objective (timer elapsed)
// vs parent tasks which need quality check
if (['auto', 'timer', 'checklist'].includes(task.approval_type)) {
  status = 'auto_approved';
}
```

### JSDoc for Functions

```typescript
/**
 * Creates a task for a family with validation
 *
 * @param familyId - The family's UUID
 * @param taskData - Task creation data (validated via Zod)
 * @returns The created task with generated ID
 * @throws {Error} If validation fails or user unauthorized
 */
export async function createTask(familyId: string, taskData: CreateTaskInput): Promise<Task> {
  // ...
}
```

### TODOs

```typescript
// TODO: Add support for multi-child assignment (Phase 2)
// FIXME: Timer doesn't pause correctly on mobile Safari
// HACK: Temporary workaround for Supabase RLS bug (remove when fixed)
```

---

## Accessibility

### Semantic HTML

```tsx
// ✅ DO: Use semantic elements
<button onClick={handleClick}>Complete</button>
<nav>...</nav>
<main>...</main>
<article>...</article>

// ❌ DON'T: Use divs for interactive elements
<div onClick={handleClick}>Complete</div> // ❌
```

### ARIA Labels

```tsx
// ✅ DO: Add ARIA labels for screen readers
<button aria-label="Complete homework task">
  <CheckIcon />
</button>

<input
  type="text"
  id="task-name"
  aria-required="true"
  aria-describedby="task-name-error"
/>
```

### Keyboard Navigation

```tsx
// ✅ DO: Support keyboard navigation
<Dialog
  open={isOpen}
  onClose={onClose}
  // Trap focus inside dialog
  // ESC to close
  // Tab to navigate
>
  {/* ... */}
</Dialog>
```

---

## Performance

### Optimization Patterns

```typescript
// ✅ DO: Memoize expensive computations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// ✅ DO: Debounce search inputs
const debouncedSearch = useDebouncedCallback((query) => {
  fetchResults(query);
}, 300);

// ✅ DO: Use React.lazy for code splitting
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

---

## Security

### Validation

```typescript
// ✅ ALWAYS validate on server
// Client validation is for UX only
export async function POST(request: NextRequest) {
  // Server-side validation (REQUIRED)
  const validationResult = CreateTaskSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }
  // ...
}
```

### SQL Injection Prevention

```typescript
// ✅ DO: Use parameterized queries (Supabase does this automatically)
await supabase.from('tasks').select('*').eq('id', taskId);

// ❌ DON'T: Use string concatenation
await supabase.rpc('raw_sql', { query: `SELECT * FROM tasks WHERE id = '${taskId}'` }); // ❌
```

---

*Last Updated: 2026-01-10*
*Follow these conventions for consistency across the codebase*
