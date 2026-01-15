# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server on port 3001
npm run build        # Production build
npm run lint         # Run ESLint
npm run seed         # Seed sample data (tsx scripts/seed-sample-data.ts)
```

Database scripts:
```bash
npm run check-db           # Check database connection
npm run test-goals         # Test goals system
npm run test-screen-time   # Test screen time budget
npm run test-auto-refund   # Test auto-refund system
```

## Architecture

### Dual Authentication System

EarnQuest has two separate authentication flows:

1. **Parent Auth (Supabase OAuth)**: Parents authenticate via Google/Apple OAuth through Supabase. Session is managed by Supabase middleware.

2. **Child Auth (Cookie-based)**: Children login with family join code + optional PIN. Session stored in `child_session` cookie containing `{ childId, familyId }`.

### Route Groups

The app uses Next.js route groups under `app/[locale]/`:

- `(app)/` - Parent dashboard (requires Supabase auth)
- `(child)/` - Child dashboard (requires `child_session` cookie)
- `(auth)/` - Login/signup pages (public)

### Key Data Models

**Task System**:
- `tasks` - Parent-created tasks with `frequency` (daily/weekly/one_time)
- `task_completions` - Child submissions, status: pending → approved/rejected
- `child_task_overrides` - Per-child task enable/disable

**Reward/Store System**:
- `rewards` - Family rewards with `category` (screen/instant/approval_required)
- `reward_purchases` - Tickets purchased by children
- `screen_time_budgets` - Weekly screen time allocation (separate from points)
- `goals` - Savings goals with deposit tracking

**Points Flow**:
- Child completes task → `task_completions` (pending)
- Parent approves → `point_transactions` created, `children.points_balance` updated
- Child purchases reward → Points deducted, `reward_purchases` created

### Component Organization

- `components/parent/` - Parent dashboard components (TaskCard, RewardCard, ActionCenter)
- `components/child/` - Child dashboard components (TaskList, ScreenTimeTimer)
- `components/store/` - Reward store (RewardCard, TicketCard, WalletCard)
- `components/goals/` - Goals system (GoalCard, DepositModal)
- `components/ui/` - shadcn/ui primitives + custom (ClientIcons, EffortBadge)

### Icon System

Icons are wrapped in `components/ui/ClientIcons.tsx` for client-side rendering. Uses both Lucide and Phosphor icons. Task and reward icons are defined in:
- `lib/task-icons.ts` - Task icon pool
- `lib/reward-icons.ts` - Reward icon pool

### Internationalization

Uses next-intl with locale prefix always enabled. Locales: `en-US`, `ko-KR`.
- Translation files in `locales/{locale}/common.json`
- Navigation helpers in `lib/i18n/navigation.ts`

## Database

Supabase PostgreSQL with RLS policies. Migrations in `supabase/migrations/` (numbered 001-042+).

Key tables: `families`, `users`, `children`, `tasks`, `task_completions`, `rewards`, `reward_purchases`, `goals`, `goal_deposits`, `screen_time_budgets`, `point_transactions`.

Family settings stored as JSONB in `families.settings` (e.g., `requireChildPin`, `timezone`).

## API Routes

All under `app/api/`:
- `/auth/` - Auth flows (child-login, logout, impersonate)
- `/tasks/` - CRUD, approve, complete, toggle
- `/rewards/` - CRUD, purchase, fulfill
- `/tickets/` - Ticket lifecycle (request-use, approve, complete)
- `/goals/` - Goals CRUD and deposits
- `/screen-time/` - Budget queries and session management
- `/family/` - Settings, join codes, invites
