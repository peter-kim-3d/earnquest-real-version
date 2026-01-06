# EarnQuest

> Growing habits, shining rewards

**Status**: Phase 1 Week 1-2 ✅ Complete | MVP Development in Progress

---

## Project Overview

EarnQuest is a family rewards platform that motivates children to build good habits through a points-based system where tasks earn points and points purchase rewards (screen time, experiences, autonomy).

**Target Users**: US families with 8-11 year old children (MVP)

---

## Current Status

### ✅ Phase 1 Week 1-2: Foundation (Complete)
- Next.js 15 with App Router and TypeScript
- i18n with next-intl (en-US primary, ko-KR prepared)
- Tailwind CSS with EarnQuest brand design system
- shadcn/ui component library (10 components)
- Supabase client configuration
- Auth page structure (login, signup, callback)
- PostHog analytics integration
- PWA manifest
- Production build successful

### ⏳ Next: Phase 2 (Week 3-4) - Core Data & Auth
- OAuth authentication implementation
- Family creation flow
- Database migration execution
- Protected route middleware
- Onboarding wizard

---

## Quick Start

### Prerequisites
- Node.js 18.17+
- npm or yarn
- Supabase account
- (Optional) PostHog account

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Visit http://localhost:3000 (redirects to `/en-US`)

### Build for Production

```bash
npm run build
npm run start
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 15 (App Router) | React framework with server components |
| **Language** | TypeScript | Type-safe development |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first CSS + component library |
| **Backend** | Supabase | PostgreSQL + Auth + Realtime |
| **Hosting** | Vercel | Deployment platform |
| **Auth** | Supabase Auth | OAuth (Google, Apple) |
| **i18n** | next-intl | Internationalization |
| **State** | Zustand + TanStack Query | State management + data fetching |
| **Forms** | React Hook Form + Zod | Form handling + validation |
| **Icons** | Phosphor Icons + Lucide | Icon libraries |
| **Analytics** | PostHog | Privacy-friendly analytics |

---

## Documentation

### Development Guides
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Complete development guide
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes

### Specification Documents
- [Product Requirements](./docs/earnquest-prd-final.md) - Complete PRD with features and specs
- [Setup Guide](./docs/earnquest-setup-guide.md) - Technical stack and configuration
- [Data Model](./docs/earnquest-data-model.md) - Database schema and SQL
- [Brand Guidelines](./docs/earnquest-brand-guidelines.md) - Design system and colors
- [Project Proposal](./docs/earnquest-proposal-v1.0-final.md) - Detailed planning notes

---

## Project Structure

```
earnquest-real-version/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   ├── globals.css        # Global styles
│   └── manifest.ts        # PWA manifest
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── layout/           # Layout components
├── lib/                   # Utility functions
│   ├── supabase/         # Supabase clients
│   ├── i18n/             # i18n configuration
│   └── posthog/          # Analytics
├── locales/              # Translation files
│   ├── en-US/           # English (US)
│   └── ko-KR/           # Korean (prepared)
├── docs/                 # Documentation
├── assets/               # Logo and icon files
├── middleware.ts         # Next.js middleware
└── next.config.ts       # Next.js configuration
```

---

## Implementation Roadmap

### ✅ Phase 1 (Week 1-2): Foundation - COMPLETE
- Next.js project setup
- i18n configuration (en-US)
- Tailwind + shadcn/ui
- Supabase client setup
- Auth page structure
- Basic layouts
- Production build

### ⏳ Phase 2 (Week 3-4): Core Data & Auth
- OAuth implementation (Google, Apple)
- Authentication pages
- Family creation flow
- Child profiles
- Database migrations
- Onboarding wizard

### 📋 Phase 3 (Week 5-6): Task System
- Task list views
- Task completion flow
- Parent approval UI
- Auto-approval system
- Points calculation

### 📋 Phase 4 (Week 7-8): Reward System
- Rewards store
- Purchase flow
- Reward history
- Screen time budget
- Weekly summaries
- MVP completion

---

## Manual Setup Required

Before continuing to Phase 2, complete these steps:

1. **Create Supabase Project**
   - Visit https://supabase.com/dashboard
   - Create new project in us-east-1 region
   - Save project URL and API keys

2. **Update Environment Variables**
   - Copy credentials to `.env.local`
   - Add to Vercel environment variables

3. **(Optional) Set Up PostHog**
   - Create project at https://posthog.com
   - Add API key to `.env.local`

4. **Create PWA Icons**
   - Convert `assets/earnquest-icon.svg` to PNG
   - Create 192x192, 512x512, and maskable versions
   - Place in `public/icons/`

5. **Deploy to Vercel**
   - Push code to GitHub
   - Import repository in Vercel
   - Add environment variables
   - Deploy

---

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development instructions.

---

## License

Private - All rights reserved

---

*Growing habits, shining rewards* ✨
