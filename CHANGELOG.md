# Changelog

All notable changes to the EarnQuest project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned for Week 5-6
- Task management system
- Points calculation
- Task templates
- Auto-approval system

### Planned for Week 7-8
- Rewards store
- Purchase history
- Weekly summaries
- Analytics dashboard

---

## [0.2.0] - Phase 2: OAuth & Family Creation - 2026-01-06

### Added

#### Database Schema
- **17 migration files** covering complete EarnQuest data model
- Executed `migration-ordered.sql` (832 lines) to Supabase
- Created 16 tables: families, users, children, tasks, task_completions, rewards, reward_purchases, kindness_cards, kindness_badges, app_integrations, app_integration_events, weekly_summaries, point_transactions, family_values, task_templates, reward_templates
- Created 4 database views: v_child_today_tasks, v_pending_approvals, v_weekly_screen_usage, v_child_dashboard
- Created 6 database functions: add_points(), auto_approve_tasks(), get_weekly_screen_usage(), can_purchase_reward(), update_updated_at_column(), set_auto_approve_at()
- Created 17 triggers for auto-timestamps and business logic
- Implemented Row Level Security (RLS) policies on all tables
- Seeded task and reward templates (12 tasks, 9 rewards)

#### OAuth Authentication
- Google OAuth integration (login button with icon)
- Apple OAuth integration (login button with icon)
- OAuth callback handler with session management
- Auto-redirect for new users → onboarding
- Auto-redirect for existing users → dashboard
- Error handling with user feedback
- Loading states during auth flow

#### Protected Routes Middleware
- Enhanced middleware.ts with Supabase auth
- Protected routes: /dashboard, /tasks, /store, /settings
- Public routes: /login, /signup, /auth/callback
- Semi-protected routes: /onboarding (requires auth)
- Auto-redirect unauthenticated users to login
- Auto-redirect authenticated users away from public pages
- Session refresh on each request

#### Family Creation Wizard
- **3-step wizard component** with progress indicator
- **Step 1: Family Info**
  - Family name input (required)
  - Timezone selection (6 US timezones)
  - Auto-approval hours (1-168)
  - Weekly screen time budget
  - Real-time validation
- **Step 2: Add Children**
  - Add up to 6 children
  - Avatar picker (12 emoji options)
  - Name and age group
  - Starting points (optional)
  - Remove children
  - Validation for required fields
- **Step 3: Select Tasks & Rewards**
  - Tabbed interface (Tasks / Rewards)
  - Load templates from database
  - Visual selection with checkboxes
  - Category grouping (Learning, Life, Health, Creativity, Screen, Experience, Autonomy, Items)
  - Pre-select popular options
  - Selection counter
- Server action to create complete family setup
- Atomic database operations with error handling

#### Server Actions
- `createFamily()` action in lib/actions/family.ts
- Creates family, user, children, tasks, rewards in single transaction
- Point transaction records for starting balances
- Comprehensive error handling and logging

#### Documentation
- `docs/OAUTH-SETUP-GUIDE.md` - Complete OAuth configuration guide
- `PHASE2-AUTH-COMPLETE.md` - OAuth implementation summary
- `FAMILY-CREATION-COMPLETE.md` - Family creation flow summary
- `supabase/MIGRATION_INSTRUCTIONS.md` - Database migration guide
- `supabase/QUICK-START-MIGRATION.md` - Quick migration reference

### Changed
- Updated `app/[locale]/(auth)/login/page.tsx` to functional OAuth
- Updated `app/[locale]/auth/callback/page.tsx` with onboarding logic
- Updated `app/[locale]/onboarding/page.tsx` to use wizard
- Enhanced middleware.ts with authentication layer
- Integrated Supabase auth with next-intl routing

### Fixed
- Resolved migration dependency order (families → users → RLS policies)
- Fixed ESLint useEffect warning in SelectTasksRewardsStep
- Combined all migrations into single ordered file

### Technical Details

#### Components Created
- `components/onboarding/FamilyCreationWizard.tsx` - Main wizard (13.4 kB)
- `components/onboarding/steps/FamilyInfoStep.tsx` - Step 1
- `components/onboarding/steps/AddChildrenStep.tsx` - Step 2
- `components/onboarding/steps/SelectTasksRewardsStep.tsx` - Step 3

#### Build Status
- ✅ Build successful (3.0s compile time)
- ✅ All TypeScript checks passing
- ✅ No ESLint errors
- ✅ Onboarding page: 13.4 kB (reasonable for wizard)

#### Database Tables
- **Core**: families, users, children
- **Tasks**: tasks, task_completions, task_templates
- **Rewards**: rewards, reward_purchases, reward_templates
- **Social**: kindness_cards, kindness_badges
- **System**: point_transactions, weekly_summaries, app_integrations, family_values

#### Authentication Flow
1. User clicks OAuth button (Google/Apple)
2. Redirects to provider authentication
3. Returns to /auth/callback with code
4. Exchange code for session
5. Check if user has family
6. Redirect to /onboarding (new) or /dashboard (existing)

#### Family Creation Flow
1. Step 1: Enter family name and settings
2. Step 2: Add children with avatars
3. Step 3: Select tasks and rewards
4. Submit: Create all records in database
5. Redirect to dashboard

### Security
- Row Level Security enabled on all tables
- RLS policies for family-based data isolation
- Server-side validation in createFamily action
- OAuth state verification
- CSRF protection via Supabase

### Performance
- Migration file optimized for single execution
- Database indexes on foreign keys and common queries
- Lazy loading of task/reward templates
- Efficient batch inserts for children and tasks

---

## [0.1.0] - Phase 1 Week 1-2: Foundation - 2026-01-06

### Added

#### Project Infrastructure
- Next.js 15 project with App Router and TypeScript
- Tailwind CSS 3.4+ configuration
- ESLint and PostCSS setup
- Git repository initialization

#### Dependencies
- **Backend**: @supabase/supabase-js, @supabase/ssr
- **I18n**: next-intl 4.7+
- **State**: zustand, @tanstack/react-query
- **UI**: shadcn/ui (10 components), @radix-ui primitives
- **Forms**: react-hook-form, @hookform/resolvers, zod
- **Icons**: @phosphor-icons/react, lucide-react
- **Analytics**: posthog-js
- **Styling**: tailwindcss, tailwindcss-animate, class-variance-authority, clsx, tailwind-merge

#### Brand Design System
- Quest Purple (#6C5CE7) as primary color
- Star Gold (#FDCB6E) for points/rewards
- Growth Green (#00B894) for success states
- Additional brand colors: Sky Blue, Coral Pink, Mint
- Inter font family from Google Fonts
- Custom border radius values (8px, 12px, 16px, 24px)
- Custom box shadows including purple and gold glows

#### Internationalization (i18n)
- next-intl configuration with locale routing
- Middleware for automatic locale detection
- English (en-US) as primary locale
- Korean (ko-KR) structure prepared for Phase 2
- Translation files:
  - `common.json` - App-wide strings
  - `tasks.json` - Task-related strings
  - `rewards.json` - Reward-related strings
  - `onboarding.json` - Onboarding flow strings
- Locale-specific configurations (currency, date format, timezone)
- Typed navigation helpers

#### Supabase Integration
- Browser client (`lib/supabase/client.ts`)
- Server client with cookie handling (`lib/supabase/server.ts`)
- Middleware helper for auth refresh (`lib/supabase/middleware.ts`)
- Environment variable configuration
- OAuth provider preparation (Google, Apple)

#### UI Components (shadcn/ui)
- Button (with variants)
- Card (with header, title, content)
- Input
- Label
- Dialog (modal system)
- Dropdown Menu
- Avatar
- Badge
- Tabs
- Toast (notifications)

#### Layouts and Pages
- Root locale layout with i18n provider
- Auth layout with centered gradient background
- App layout with header and navigation
- Landing page (`/[locale]`)
- Login page (`/[locale]/login`)
- Signup page (`/[locale]/signup`)
- OAuth callback page (`/[locale]/auth/callback`)
- Dashboard page (`/[locale]/dashboard`) with placeholder cards

#### Components
- Header component with navigation
- PostHogProvider for analytics tracking
- Reusable Card components from shadcn

#### Analytics
- PostHog initialization with privacy settings
- COPPA-compliant configuration (session recording disabled)
- Automatic pageview tracking
- Person profiles for identified users only
- Debug mode in development

#### PWA Support
- Manifest file (`app/manifest.ts`)
- Icon placeholder structure
- Standalone display mode
- Theme color (#6C5CE7 - Quest Purple)

#### Configuration Files
- `next.config.ts` - with next-intl plugin and security headers
- `tailwind.config.ts` - with brand colors and customizations
- `middleware.ts` - i18n routing and locale detection
- `tsconfig.json` - TypeScript configuration with path aliases
- `components.json` - shadcn/ui configuration
- `.env.example` - Environment variable template
- `.gitignore` - Git ignore patterns

#### Documentation
- `README.md` - Updated project overview
- `DEVELOPMENT.md` - Complete development guide
- `CHANGELOG.md` - This file
- `docs/` - Complete PRD, setup guide, data model, brand guidelines

### Changed
- Moved from root `/app` to `/app/[locale]` structure for i18n
- Updated all imports to use `@/` path alias
- Configured CSS variables mode for shadcn/ui theming

### Fixed
- Added missing `autoprefixer` dependency
- Added missing `lucide-react` dependency for icons
- Fixed ESLint unescaped entity in dashboard page
- Resolved build errors with proper dependency installation

### Technical Details

#### File Structure Created
- 7 app route pages
- 12 shadcn/ui components
- 3 Supabase client utilities
- 3 i18n configuration files
- 8 translation JSON files (4 per locale)
- 4 layout components
- 1 analytics provider

#### Build Status
- ✅ TypeScript compilation successful
- ✅ ESLint checks passing
- ✅ Production build successful
- ✅ Static page generation working (14 routes)
- ✅ All locales rendering correctly

#### Bundle Sizes
- First Load JS: ~102 kB (shared)
- Middleware: 45.2 kB
- Individual pages: 276 B - 550 B (excluding shared chunks)

### Security
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Environment variables properly gitignored
- Service role key marked as server-side only

### Performance
- Static page prerendering enabled
- Optimized production build
- Lazy loading for route segments
- CSS extraction and minification

---

## Notes

### Version Numbering
- **0.x.x**: Pre-release / MVP development
- **1.0.0**: MVP launch
- **Major**: Breaking changes or major feature releases
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, minor improvements

### Phase Status
- ✅ **Phase 1 (Week 1-2)**: Foundation - COMPLETE
- ✅ **Phase 2 (Week 3-4)**: OAuth & Family Creation - COMPLETE
- ⏳ **Phase 3 (Week 5-6)**: Task System - PENDING
- ⏳ **Phase 4 (Week 7-8)**: Reward System - PENDING

### Manual Steps Required Before Testing
1. ✅ Create Supabase project (DONE)
2. ✅ Update `.env.local` with actual Supabase credentials (DONE)
3. ✅ Execute database migrations (DONE)
4. ⏳ Configure Google OAuth in Supabase Dashboard
5. ⏳ (Optional) Configure Apple OAuth
6. ⏳ Test family creation flow locally
7. ⏳ Deploy to Vercel production
8. (Optional) Create PostHog project and add API key
9. (Optional) Convert logo SVG to PNG icons

### Known Limitations
- Dashboard shows placeholder data (real data display in Phase 3)
- Only one age group supported (8-11 years)
- Cannot customize task/reward points during setup
- Maximum 6 children per family
- PWA icons are placeholders
- Analytics requires PostHog account setup
