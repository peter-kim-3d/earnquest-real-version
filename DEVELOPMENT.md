# EarnQuest Development Guide

## Setup

### Prerequisites
- Node.js 18.17 or later
- npm or yarn
- Supabase account
- (Optional) PostHog account for analytics

### Initial Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd earnquest-real-version
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your actual credentials:
   - Create a Supabase project at https://supabase.com/dashboard
   - Copy the project URL and anon key
   - (Optional) Create PostHog project and add API key

4. **Run development server**
   ```bash
   npm run dev
   ```

   Visit http://localhost:3000 (will redirect to `/en-US`)

## Project Structure

```
earnquest-real-version/
├── app/                          # Next.js App Router
│   ├── [locale]/                # Internationalized routes
│   │   ├── layout.tsx           # Root layout with i18n
│   │   ├── page.tsx             # Landing page
│   │   ├── (auth)/              # Auth route group
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── auth/callback/       # OAuth callback
│   │   └── (app)/               # Protected app routes
│   │       └── dashboard/
│   ├── globals.css              # Global styles + Tailwind
│   └── manifest.ts              # PWA manifest
│
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── layout/                  # Layout components
│   │   └── Header.tsx
│   └── PostHogProvider.tsx      # Analytics wrapper
│
├── lib/
│   ├── supabase/                # Supabase clients
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── middleware.ts        # Auth middleware
│   ├── i18n/                    # Internationalization
│   │   ├── config.ts            # Locale configs
│   │   ├── request.ts           # Message loading
│   │   └── navigation.ts        # Typed navigation
│   ├── posthog/                 # Analytics
│   │   └── client.ts
│   └── utils.ts                 # Utility functions
│
├── locales/                     # Translation files
│   ├── en-US/                   # English (US)
│   │   ├── common.json
│   │   ├── tasks.json
│   │   ├── rewards.json
│   │   └── onboarding.json
│   └── ko-KR/                   # Korean (prepared)
│
├── supabase/migrations/         # Database migrations (Week 3+)
├── public/icons/                # PWA icons
├── middleware.ts                # Next.js middleware (i18n + auth)
└── next.config.ts               # Next.js configuration
```

## Available Scripts

### Development
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Building for Production
```bash
npm run build
npm run start
```

## Key Features

### Internationalization (i18n)
- **Library**: next-intl
- **Supported Locales**: en-US (active), ko-KR (prepared)
- **URL Structure**: `/[locale]/page` (e.g., `/en-US/dashboard`)
- **Default Locale**: en-US

#### Adding Translations
1. Add keys to locale JSON files in `locales/[locale]/`
2. Use in components:
   ```tsx
   import { useTranslations } from 'next-intl';

   const t = useTranslations('common');
   t('key'); // Returns translated string
   ```

### Brand Design System
- **Primary Color**: Quest Purple (#6C5CE7)
- **Secondary Colors**: Star Gold (#FDCB6E), Growth Green (#00B894)
- **Font**: Inter (loaded from Google Fonts)
- **UI Library**: shadcn/ui with Tailwind CSS

#### Using Brand Colors
```tsx
<div className="text-quest-purple bg-star-gold/10">
  Styled with brand colors
</div>
```

### Authentication (Structure Only - Week 3+ for Implementation)
- **Provider**: Supabase Auth
- **OAuth**: Google, Apple (prepared)
- **Auth Pages**: `/login`, `/signup`, `/auth/callback`

### Analytics
- **Provider**: PostHog
- **Privacy**: COPPA compliant (session recording disabled)
- **Tracking**: Pageviews automatically captured

## Environment Variables

### Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-side only)

### Optional
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog API key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host (default: https://app.posthog.com)

### Configuration
- `NEXT_PUBLIC_APP_URL` - Application URL (default: http://localhost:3000)
- `NEXT_PUBLIC_DEFAULT_LOCALE` - Default locale (default: en-US)

## Database Migrations (Week 3+)

Database migrations are prepared but not executed in Phase 1.

To run migrations (Week 3+):
```bash
npx supabase migration up
```

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

### Environment Variables on Vercel
Add all variables from `.env.example` in Vercel dashboard under Project Settings → Environment Variables.

## Troubleshooting

### Build Errors
- **Missing dependencies**: Run `npm install`
- **TypeScript errors**: Check imports and types
- **ESLint errors**: Fix or disable specific rules in `.eslintrc.json`

### i18n Issues
- **Redirects not working**: Check `middleware.ts` configuration
- **Missing translations**: Verify locale JSON files exist
- **Wrong locale**: Check `NEXT_PUBLIC_DEFAULT_LOCALE`

### Supabase Connection
- **401 errors**: Verify anon key is correct
- **CORS issues**: Check Supabase URL configuration
- **Missing tables**: Migrations not run yet (Week 3+)

## Code Style

### Naming Conventions
- **Components**: PascalCase (`Header.tsx`)
- **Utilities**: camelCase (`createClient.ts`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_LOCALE`)

### Import Order
1. React/Next.js imports
2. Third-party libraries
3. Local components
4. Local utilities
5. Types
6. Styles

### TypeScript
- Use strict mode
- Avoid `any` type
- Define interfaces for props
- Use type inference where possible

## Testing (Week 3+)

Testing infrastructure to be added in later phases.

## Contributing

1. Create feature branch from `main`
2. Make changes
3. Test locally with `npm run build`
4. Create pull request
5. Wait for review

## Support

- **Documentation**: See `docs/` folder for detailed specs
- **Issues**: Report at GitHub repository
- **Questions**: Contact development team

## Next Steps (Week 3-4)

After Phase 1 completion:
1. Implement OAuth authentication (Google, Apple)
2. Build family creation flow
3. Execute database migrations
4. Add protected route middleware
5. Create onboarding wizard
