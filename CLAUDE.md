# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

EarnQuest is a gamified task and reward system for families to help children develop good habits through motivation, trust, and positive reinforcement. Built with Next.js 15, Supabase, and Tailwind CSS.

## Commands

### Development
```bash
npm run dev          # Start dev server on port 3001
npm run build        # Production build
npm run lint         # Run ESLint
npm start            # Start production server
```

### Database & Testing Scripts
```bash
npm run seed                # Seed sample data (tsx scripts/seed-sample-data.ts)
npm run check-db            # Check database connection
npm run test-goals          # Test goals system
npm run test-screen-time    # Test screen time budget
npm run test-auto-refund    # Test auto-refund system
npm run test-kindness       # Test kindness feature
npm run migrate:birthdate   # Apply birthdate migration
npm run migrate:auth        # Apply auth migrations
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3 + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **State**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod
- **i18n**: next-intl (en-US, ko-KR)
- **Icons**: Lucide React + Phosphor Icons

### Dual Authentication System

EarnQuest has two separate authentication flows:

1. **Parent Auth (Supabase OAuth)**: Parents authenticate via Google/Apple OAuth through Supabase. Session is managed by Supabase middleware in `lib/supabase/middleware.ts`.

2. **Child Auth (Cookie-based)**: Children login with family join code + optional PIN. Session stored in `child_session` cookie containing `{ childId, familyId }`. Handled via `/api/auth/child-login`.

### Route Groups

The app uses Next.js route groups under `app/[locale]/`:

- `(app)/` - Parent dashboard (requires Supabase auth)
  - `/dashboard` - Main parent view with pending approvals
  - `/tasks` - Task management
  - `/rewards` - Reward management
  - `/goals` - Goal tracking
  - `/children/[childId]` - Individual child views
  - `/settings` - Family and child settings
  - `/onboarding/*` - New user onboarding flow
  - `/kindness` - Kindness notes feature

- `(child)/` - Child dashboard (requires `child_session` cookie)
  - `/child/dashboard` - Child's main view
  - `/child/store` - Reward store
  - `/child/goals` - Child's savings goals
  - `/child/tickets` - Purchased reward tickets
  - `/child/badges` - Badge collection
  - `/child/profile` - Child profile

- `(auth)/` - Login/signup pages (public)
  - `/login` - Parent login
  - `/signup` - Parent registration
  - `/child-login` - Child login with join code
  - `/callback` - OAuth callback
  - `/invite/[token]` - Family invitation acceptance

### Key Data Models

**Task System**:
- `tasks` - Parent-created tasks with `frequency` (daily/weekly/one_time)
- `task_completions` - Child submissions, status: pending → approved/rejected
- `child_task_overrides` - Per-child task enable/disable
- `task_templates` - Pre-defined task templates for onboarding
- Approval types: `auto`, `parent`, `timer`, `checklist`
- Time contexts: `morning`, `after_school`, `evening`, `anytime`

**Reward/Store System**:
- `rewards` - Family rewards with `category` (screen/instant/approval_required/other)
- `reward_purchases` - Tickets purchased by children (status: active/requested/approved/fulfilled)
- `screen_time_budgets` - Weekly screen time allocation (separate from points)
- `screen_time_sessions` - Active screen time tracking

**Goals System**:
- `goals` - Savings goals with target amounts
- `goal_deposits` - Point deposits toward goals

**Kindness System**:
- `kindness_notes` - Gratitude/kindness messages between family members
- Badge collection and themes

**Points Flow**:
1. Child completes task → `task_completions` created (pending)
2. Parent approves → `point_transactions` created, `children.points_balance` updated
3. Child purchases reward → Points deducted, `reward_purchases` created
4. Child requests to use ticket → Status changes, parent approves → Fulfilled

### Component Organization

```
components/
├── parent/              # Parent dashboard components
│   ├── TaskCard.tsx, TaskList.tsx, TaskFormDialog.tsx
│   ├── RewardCard.tsx, RewardList.tsx, RewardFormDialog.tsx
│   ├── ActionCenter.tsx, ApprovalCard.tsx
│   ├── ChildCard.tsx, ChildStats.tsx
│   └── GoalList.tsx, GoalFormDialog.tsx
├── child/               # Child dashboard components
│   ├── TaskList.tsx
│   ├── ScreenTimeTimer.tsx
│   ├── MotivationalBanner.tsx
│   └── TicketsClientPage.tsx
├── store/               # Reward store (child-facing)
│   ├── RewardCard.tsx, TicketCard.tsx
│   ├── WalletCard.tsx
│   └── ScreenTimeBudgetCard.tsx
├── goals/               # Goals system
│   ├── GoalCard.tsx
│   └── DepositModal.tsx
├── kindness/            # Kindness notes feature
│   ├── SendGratitudeForm.tsx
│   ├── BadgeCollection.tsx
│   └── ThemePicker.tsx
├── onboarding/          # Onboarding flow
│   ├── ModuleSelector.tsx
│   └── PresetSelector.tsx
├── settings/            # Settings pages
├── ui/                  # shadcn/ui primitives + custom
│   ├── ClientIcons.tsx  # Client-side icon wrapper
│   ├── EffortBadge.tsx  # Task difficulty indicator
│   ├── button.tsx, card.tsx, dialog.tsx, etc.
│   └── confirm-dialog.tsx
└── theme-provider.tsx
```

### Icon System

Icons are wrapped in `components/ui/ClientIcons.tsx` for client-side rendering. Uses both Lucide and Phosphor icons.
- Task icons: `lib/task-icons.ts`
- Reward icons: `lib/reward-icons.ts`
- Default task images: `lib/default-task-images.ts`
- Default reward images: `lib/default-reward-images.ts`

### Lib Structure

```
lib/
├── supabase/
│   ├── client.ts        # Browser Supabase client
│   ├── server.ts        # Server Supabase client
│   ├── middleware.ts    # Auth session handling
│   └── types.ts         # Database TypeScript types
├── services/
│   ├── auth.ts          # OAuth and email auth helpers
│   ├── child.ts         # Child data operations
│   ├── family.ts        # Family operations
│   ├── onboarding.ts    # Onboarding flow logic
│   └── user.ts          # User profile operations
├── config/
│   ├── task-templates.ts    # 19 pre-defined task templates
│   ├── modules.ts           # Onboarding module definitions
│   └── presets.ts           # Onboarding style presets
├── i18n/
│   ├── config.ts        # Locale configuration (en-US, ko-KR)
│   ├── request.ts       # next-intl request config
│   └── navigation.ts    # i18n-aware Link/redirect
├── types/
│   └── task.ts          # Task-related TypeScript types
├── utils/
│   ├── onboarding.ts    # Onboarding state utilities
│   └── tiers.ts         # Subscription tier logic
├── validation/
│   ├── task.ts          # Task Zod schemas
│   └── family.ts        # Family Zod schemas
├── security/
│   └── rate-limiter.ts  # API rate limiting
├── avatars.ts           # Avatar preset definitions
├── format.ts            # Formatting utilities
└── utils.ts             # cn() utility for classnames
```

## API Routes

All under `app/api/`:

### Auth
- `POST /auth/child-login` - Child login with join code + PIN
- `POST /auth/child-logout` - Child logout
- `POST /auth/logout` - Parent logout
- `POST /auth/impersonate` - Parent impersonate child view
- `GET /auth/check` - Check auth status

### Tasks
- `GET/POST /tasks` - List/create tasks
- `GET/PUT/DELETE /tasks/[taskId]` - Single task CRUD
- `POST /tasks/[taskId]/overrides` - Per-child task overrides
- `POST /tasks/complete` - Mark task complete (child)
- `POST /tasks/approve` - Approve task completion (parent)
- `POST /tasks/batch-approve` - Batch approve completions
- `POST /tasks/toggle` - Toggle task active status
- `POST /tasks/archive` - Archive task
- `POST /tasks/fix-request` - Request fix from child

### Rewards
- `GET/POST /rewards` - List/create rewards
- `POST /rewards/create` - Create reward
- `POST /rewards/update` - Update reward
- `POST /rewards/delete` - Delete reward
- `POST /rewards/purchase` - Purchase reward (child)
- `POST /rewards/fulfill` - Fulfill reward purchase
- `POST /rewards/cancel` - Cancel reward purchase

### Tickets (Purchased Rewards)
- `GET /tickets` - List tickets
- `GET /tickets/[id]` - Get ticket details
- `POST /tickets/[id]/request-use` - Request to use ticket
- `POST /tickets/[id]/approve` - Approve use request
- `POST /tickets/[id]/fulfill` - Mark as used
- `POST /tickets/[id]/complete` - Complete ticket

### Goals
- `GET/POST /goals` - List/create goals
- `POST /goals/deposit` - Deposit points to goal

### Screen Time
- `GET /screen-time` - Get screen time budget
- `POST /screen-time/session` - Start/end screen time session

### Family
- `GET/POST /family/settings` - Family settings
- `GET/POST /family/join-code` - Manage join code
- `POST /family/validate-code` - Validate join code
- `POST /family/invite` - Create invitation
- `GET /family/invite/[token]` - Get invitation details

### Children
- `GET /children` - List children
- `POST /children/create` - Create child
- `POST /children/update` - Update child
- `GET /children/[id]` - Get child details
- `GET /children/[id]/tickets` - Get child's tickets
- `POST /children/update-passcode` - Update child PIN
- `GET /children/by-family-code` - Get children by join code
- `GET /children/public` - Public child info

### Kindness
- `GET /kindness` - List kindness notes
- `POST /kindness/send` - Send kindness note

### Onboarding
- `POST /onboarding/child` - Add child during onboarding
- `POST /onboarding/values` - Save family values
- `POST /onboarding/populate` - Populate default tasks/rewards

### Profile & Avatars
- `POST /profile/avatar/upload` - Upload parent avatar
- `POST /profile/avatar/preset` - Set parent preset avatar
- `POST /profile/child-avatar/upload` - Upload child avatar
- `POST /profile/child-avatar/preset` - Set child preset avatar

### Other
- `POST /cron/auto-refunds` - Process auto-refunds (Vercel cron)
- `GET /transactions` - Get point transactions

## Database

### Supabase PostgreSQL with RLS

Migrations in `supabase/migrations/` (numbered 001-051+).

**Key Tables**:
- `families` - Family accounts with settings (JSONB)
- `users` - Parent accounts (linked to Supabase auth)
- `children` - Child profiles with points balance
- `tasks` - Task definitions
- `task_completions` - Task completion records
- `task_templates` - Pre-defined task templates
- `child_task_overrides` - Per-child task settings
- `rewards` - Reward definitions
- `reward_purchases` - Purchased rewards (tickets)
- `goals` - Savings goals
- `goal_deposits` - Goal deposits
- `screen_time_budgets` - Weekly screen time allocation
- `screen_time_sessions` - Active screen time tracking
- `point_transactions` - Point history
- `kindness_notes` - Kindness messages
- `family_invitations` - Parent invitation tokens

**Key Views**:
- `v_child_today_tasks` - Child's tasks for today with completion status

**Key Functions**:
- `add_points(p_child_id, p_amount, p_type, ...)` - Add/deduct points atomically
- `generate_join_code()` - Generate unique family join code

**Family Settings (JSONB)**:
```typescript
{
  requireChildPin: boolean,  // Default: false
  timezone: string,
  weekStartsOn: 0 | 1       // 0 = Sunday, 1 = Monday
}
```

## Internationalization (i18n)

Uses next-intl with locale prefix always enabled.

**Supported Locales**: `en-US`, `ko-KR`

**Files**:
- `locales/en-US/common.json` - English translations
- `locales/ko-KR/common.json` - Korean translations
- `lib/i18n/config.ts` - Locale configuration with currency, date format, etc.

**Usage**:
```tsx
import { useTranslations } from 'next-intl';

function Component() {
  const t = useTranslations();
  return <h1>{t('dashboard.title')}</h1>;
}
```

**Navigation**:
```tsx
import { Link, redirect } from '@/lib/i18n/navigation';

// Use these instead of next/link and next/navigation
<Link href="/dashboard">Dashboard</Link>
redirect('/login');
```

## Design System

### Colors (Tailwind config)
- `primary`: #2bb800 (bright green)
- `primary-kindness`: #0ea5e9 (cyan for kindness features)
- `background-light`: #f6f8f6
- `background-dark`: #132210
- `card-light`: #ffffff
- `card-dark`: #1c3018
- `text-main`: #121811
- `text-muted`: #688961

### Typography
- Display font: Lexend (headings)
- Body font: Noto Sans
- Kindness font: Plus Jakarta Sans

### Spacing & Radius
- Border radius: lg (1rem), xl (1.5rem), 2xl (2rem)
- Card shadow: `shadow-card`, `shadow-card-hover`

### Dark Mode
Uses `next-themes` with class-based switching. Theme provider in `components/theme-provider.tsx`.

## Environment Variables

Required in `.env.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_DEFAULT_LOCALE=en-US
NEXT_PUBLIC_SHOW_BETA=true

# OAuth (optional)
NEXT_PUBLIC_ENABLE_APPLE_LOGIN=false

# Cron (Vercel)
CRON_SECRET=your-cron-secret
```

## Code Conventions

### File Naming
- Components: PascalCase (`TaskCard.tsx`)
- Utilities: camelCase (`formatDate.ts`)
- API routes: kebab-case folders (`child-login/route.ts`)

### Component Patterns
- Use `'use client'` directive only when necessary (hooks, browser APIs)
- Server components by default
- Colocate client islands in same file or `*.client.tsx`

### API Route Pattern
```typescript
export async function POST(request: Request) {
  // 1. Parse request body
  const body = await request.json();

  // 2. Validate with Zod
  const result = schema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: 'Validation failed' }, { status: 400 });
  }

  // 3. Create Supabase client
  const supabase = await createClient();

  // 4. Check auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 5. Perform operation
  const { data, error } = await supabase.from('table').insert(...);

  // 6. Return response
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ data });
}
```

### State Management
- **Server state**: TanStack Query for data fetching/caching
- **Client state**: Zustand for UI state
- **Form state**: React Hook Form with Zod validation

### Error Handling
- API routes return `{ error: string }` with appropriate status codes
- Client components use try/catch with toast notifications (sonner)
- Log errors to console in development

### Bug Fix Logging (자동)

버그를 수정하고 커밋할 때, `/log-issue` 스킬을 실행하거나 `qa/ISSUES.md`에 직접 기록하세요.

## Common Tasks

### Adding a New Task Template
1. Add template to `lib/config/task-templates.ts`
2. Add translations to `locales/*/common.json` if needed
3. Template will be available in onboarding preset selection

### Adding a New API Route
1. Create folder under `app/api/` with `route.ts`
2. Implement HTTP method handlers (GET, POST, etc.)
3. Use Supabase server client from `lib/supabase/server.ts`
4. Validate input with Zod schemas

### Adding New Translations
1. Add keys to `locales/en-US/common.json`
2. Add corresponding translations to `locales/ko-KR/common.json`
3. Use `useTranslations()` hook in components

### Creating Database Migrations
1. Create numbered SQL file in `supabase/migrations/` (e.g., `052_new_feature.sql`)
2. Include RLS policies for new tables
3. Run via Supabase SQL Editor or CLI

## Testing

### Manual Testing Flow
1. Start dev server: `npm run dev`
2. Parent signup: `/en-US/signup`
3. Complete onboarding flow
4. Add children via settings
5. Child login: `/en-US/child-login` with join code
6. Test task completion and approval flow

### Database Scripts
```bash
npm run check-db           # Verify database connection
npm run test-goals         # Test goal deposit system
npm run test-screen-time   # Test screen time budgets
npm run test-auto-refund   # Test auto-refund cron job
```

## Deployment

### Vercel
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Configure cron job for auto-refunds in `vercel.json`

### Cron Jobs
Auto-refund cron configured in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/auto-refunds",
    "schedule": "0 0 * * *"
  }]
}
```

