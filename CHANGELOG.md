# Changelog

All notable changes to the EarnQuest project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned for Week 3-4
- OAuth authentication implementation (Google, Apple)
- Family creation flow
- Database migration execution
- Protected route middleware
- Onboarding wizard

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
- ⏳ **Phase 2 (Week 3-4)**: Core Data & Auth - PENDING
- ⏳ **Phase 3 (Week 5-6)**: Task System - PENDING
- ⏳ **Phase 4 (Week 7-8)**: Reward System - PENDING

### Manual Steps Required Before Week 3
1. Create Supabase project at https://supabase.com/dashboard
2. Update `.env.local` with actual Supabase credentials
3. (Optional) Create PostHog project and add API key
4. Convert logo SVG to PNG icons (192x192, 512x512)
5. Initialize Git repository and push to GitHub
6. Connect repository to Vercel
7. Add environment variables to Vercel
8. Deploy to production

### Known Limitations
- Database migrations prepared but not executed
- OAuth authentication not implemented (buttons disabled)
- No actual data persistence yet
- PWA icons are placeholders
- Analytics requires PostHog account setup
