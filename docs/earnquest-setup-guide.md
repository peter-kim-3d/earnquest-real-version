# EarnQuest - Project Setup Guide

> Claude Code plan mode에서 사용할 프로젝트 설정 가이드

---

## Technical Decisions (Confirmed)

| Category | Decision | Notes |
|----------|----------|-------|
| **Framework** | Next.js 14+ (App Router) | TypeScript |
| **Backend** | Supabase (new project) | PostgreSQL + Auth + Realtime |
| **Hosting** | Vercel | `earnquest2.vercel.app` |
| **App Type** | PWA | Native in Phase 4 |
| **Auth Providers** | Google + Apple | Kakao in Phase 2 (Korea) |
| **i18n** | next-intl | en-US primary, ko-KR Phase 2 |
| **Styling** | Tailwind CSS + shadcn/ui | |
| **Analytics** | PostHog | Privacy-friendly, feature flags |
| **State** | Zustand + TanStack Query | |
| **Forms** | React Hook Form + Zod | |
| **Icons** | Phosphor Icons | |

---

## Project Structure

```
earnquest/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Landing
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/page.tsx       # OAuth callback
│   │   ├── (app)/                      # Parent view
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── tasks/
│   │   │   ├── store/
│   │   │   ├── family/
│   │   │   └── settings/
│   │   └── (child)/                    # Child view
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── tasks/
│   │       └── store/
│   ├── api/
│   │   ├── tasks/
│   │   ├── rewards/
│   │   ├── approvals/
│   │   └── webhooks/
│   ├── manifest.ts                     # PWA manifest
│   └── globals.css
├── components/
│   ├── ui/                             # shadcn/ui
│   ├── tasks/
│   ├── rewards/
│   ├── points/
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── middleware.ts
│   │   └── types.ts                    # Generated types
│   ├── i18n/
│   │   ├── config.ts
│   │   ├── request.ts
│   │   └── navigation.ts
│   ├── posthog/
│   │   └── client.ts
│   └── utils/
├── hooks/
├── types/
├── locales/
│   ├── en-US/
│   │   ├── common.json
│   │   ├── tasks.json
│   │   ├── rewards.json
│   │   └── onboarding.json
│   └── ko-KR/                          # Phase 2
├── config/
│   ├── locales.ts
│   ├── constants.ts
│   └── templates/
│       ├── en-US/
│       │   ├── tasks.json
│       │   └── rewards.json
│       └── ko-KR/
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_families.sql
│   │   ├── 002_create_users.sql
│   │   └── ...
│   ├── seed.sql
│   └── config.toml
├── public/
│   ├── icons/                          # PWA icons
│   ├── images/
│   └── sw.js                           # Service worker
├── .env.local
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Environment Variables

```bash
# .env.example

# ===================
# Supabase
# ===================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ===================
# App Configuration
# ===================
NEXT_PUBLIC_APP_URL=https://earnquest2.vercel.app
NEXT_PUBLIC_DEFAULT_LOCALE=en-US
NEXT_PUBLIC_SUPPORTED_LOCALES=en-US

# ===================
# Analytics (PostHog)
# ===================
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# ===================
# OAuth (configured in Supabase)
# ===================
# Google and Apple OAuth are configured in Supabase Dashboard
# No additional env vars needed here
```

---

## Initial Setup Commands

```bash
# 1. Create Next.js project
npx create-next-app@latest earnquest --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

cd earnquest

# 2. Install core dependencies
npm install @supabase/supabase-js @supabase/ssr next-intl zustand @tanstack/react-query

# 3. Install UI dependencies
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge
npm install @phosphor-icons/react

# 4. Install form dependencies
npm install react-hook-form @hookform/resolvers zod

# 5. Install analytics
npm install posthog-js

# 6. Install dev dependencies
npm install -D supabase @types/node

# 7. Initialize shadcn/ui
npx shadcn@latest init

# 8. Add shadcn components
npx shadcn@latest add button card input label dialog dropdown-menu avatar badge tabs toast

# 9. Initialize Supabase locally (optional, for local dev)
npx supabase init
```

---

## Supabase Project Setup

### 1. Create Project

1. Go to https://supabase.com/dashboard
2. Create new project: `earnquest`
3. Choose region: `us-east-1` (or closest to target users)
4. Save the project URL and keys

### 2. Configure Authentication

**Google OAuth:**
1. Supabase Dashboard → Authentication → Providers → Google
2. Create Google Cloud OAuth credentials
3. Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`
4. Add authorized origin: `https://earnquest2.vercel.app`

**Apple OAuth:**
1. Supabase Dashboard → Authentication → Providers → Apple
2. Create Apple Developer credentials
3. Configure Sign in with Apple

**Auth Settings:**
```
Site URL: https://earnquest2.vercel.app
Redirect URLs:
  - https://earnquest2.vercel.app/en-US/auth/callback
  - http://localhost:3000/en-US/auth/callback
```

### 3. Run Migrations

```bash
# Connect to remote Supabase
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push

# Or apply migrations manually in SQL Editor
```

---

## Key Configuration Files

### next.config.ts

```typescript
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

const nextConfig: NextConfig = {
  // PWA headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
```

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        'quest-purple': {
          DEFAULT: '#6C5CE7',
          light: '#A29BFE',
          dark: '#5849C2',
        },
        'star-gold': {
          DEFAULT: '#FDCB6E',
          light: '#FFEAA7',
          dark: '#F8B500',
        },
        'growth-green': {
          DEFAULT: '#00B894',
          light: '#55EFC4',
          dark: '#00A381',
        },
        'sky-blue': '#74B9FF',
        'coral-pink': '#FF7675',
        'mint': '#55EFC4',
        // Semantic
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... rest of shadcn config
      },
      fontFamily: {
        sans: ['Inter', 'Pretendard', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

### lib/i18n/config.ts

```typescript
export const locales = ['en-US', 'ko-KR'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en-US';

export const localeConfigs: Record<Locale, LocaleConfig> = {
  'en-US': {
    language: 'en',
    region: 'US',
    currency: 'USD',
    currencySymbol: '$',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    weekStartsOn: 0,
    direction: 'ltr',
  },
  'ko-KR': {
    language: 'ko',
    region: 'KR',
    currency: 'KRW',
    currencySymbol: '₩',
    dateFormat: 'YYYY.MM.DD',
    timeFormat: '24h',
    weekStartsOn: 1,
    direction: 'ltr',
  },
};

export interface LocaleConfig {
  language: string;
  region: string;
  currency: string;
  currencySymbol: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: 0 | 1;
  direction: 'ltr' | 'rtl';
}
```

### lib/supabase/client.ts

```typescript
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### lib/supabase/server.ts

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component
          }
        },
      },
    }
  );
}
```

### lib/posthog/client.ts

```typescript
import posthog from 'posthog-js';

export function initPostHog() {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      person_profiles: 'identified_only', // Privacy: only track identified users
      capture_pageview: false, // We'll capture manually for SPA
      capture_pageleave: true,
      // COPPA compliance: disable session recording for children
      disable_session_recording: true,
    });
  }
}

export { posthog };
```

---

## PWA Configuration

### app/manifest.ts

```typescript
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EarnQuest',
    short_name: 'EarnQuest',
    description: 'Growing habits, shining rewards',
    start_url: '/en-US',
    display: 'standalone',
    background_color: '#F5F6FA',
    theme_color: '#6C5CE7',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
```

---

## Vercel Deployment

### vercel.json (optional)

```json
{
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_DEFAULT_LOCALE": "en-US"
  }
}
```

### Deployment Steps

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables in Vercel Dashboard
4. Deploy

---

## Phase 1 Implementation Order

```
Week 1-2: Foundation
├── 1. Create Next.js project with dependencies
├── 2. Set up Supabase project & initial migrations
├── 3. Configure next-intl with en-US
├── 4. Set up Tailwind + shadcn/ui
├── 5. Create basic layout (header, nav)
├── 6. Set up PostHog
└── 7. Deploy to Vercel (CI/CD)

Week 3-4: Auth & Family
├── 1. Supabase Auth (Google + Apple)
├── 2. Auth pages (login, signup, callback)
├── 3. Protected routes middleware
├── 4. Family creation flow
├── 5. Child profile creation
├── 6. Onboarding wizard
└── 7. Default task/reward seeding

Week 5-6: Task System
├── 1. Task list component
├── 2. Task card component
├── 3. Task completion flow
├── 4. Approval UI (parent)
├── 5. Fix request templates
├── 6. Auto-approval (24h)
└── 7. Points crediting

Week 7-8: Reward System
├── 1. Reward store component
├── 2. Reward card component
├── 3. Purchase flow
├── 4. Points deduction
├── 5. Ticket system
├── 6. Screen budget
└── 7. MVP polish & testing
```

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| `earnquest-prd-final.md` | Full product requirements |
| `earnquest-data-model.md` | Database schema & SQL |
| `earnquest-brand-guidelines.md` | Design system |
| `earnquest-logo.svg` | Logo asset |
| `earnquest-icon.svg` | App icon asset |

---

## Claude Code Usage

```bash
# Start Claude Code
claude

# Initial planning
> /plan Read all earnquest-*.md files and create detailed implementation plan for Phase 1 Week 1-2

# Specific feature
> /plan Based on earnquest-prd-final.md section 6.2, implement the task completion flow

# With context
> Read earnquest-data-model.md and create the Supabase migration files
```

---

*EarnQuest Setup Guide v1.0*
*Ready for Claude Code*
