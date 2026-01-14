# EarnQuest

> Growing habits, shining rewards

A gamified task and reward system for families to help children develop good habits through motivation, trust, and positive reinforcement.

## 🎯 Project Status

**Phase 1: Foundation & Setup** ✅ COMPLETE

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v3 + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **i18n**: next-intl (en-US, ko-KR support)
- **State Management**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React, Phosphor Icons, Material Symbols

## 📂 Project Structure

```
earnquest/
├── app/
│   ├── [locale]/              # i18n routes (en-US, ko-KR)
│   │   ├── layout.tsx         # Locale-specific layout
│   │   └── page.tsx           # Home page
│   ├── layout.tsx             # Root layout
│   └── globals.css            # Global styles + design system
├── components/
│   └── ui/                    # shadcn/ui components (10 components)
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser client
│   │   ├── server.ts          # Server client
│   │   ├── middleware.ts      # Auth middleware
│   │   └── types.ts           # Database types (placeholder)
│   ├── services/
│   │   └── auth.ts            # Auth helper functions
│   ├── i18n/
│   │   ├── config.ts          # Locale configuration
│   │   ├── request.ts         # next-intl request config
│   │   └── navigation.ts      # i18n-aware navigation
│   └── utils.ts               # Utility functions (cn)
├── locales/
│   └── en-US/
│       └── common.json        # English translations
├── supabase/
│   ├── migrations/
│   │   ├── 001_create_families.sql
│   │   ├── 002_create_users.sql
│   │   ├── 003_create_children.sql
│   │   └── TODO.md            # Remaining migrations
│   └── README.md              # Supabase setup guide
├── docs/
│   ├── earnquest-proposal-v1.0-final.md
│   ├── earnquest-prd-final.md
│   ├── earnquest-data-model.md
│   └── earnquest-setup-guide.md
├── .stitch_child_s_task_list/ # Google Stitch UI designs
├── .env.local                 # Environment variables (gitignored)
├── .env.example               # Environment template
└── package.json
```

## 🎨 Design System (Stitch)

### Colors

```css
/* Primary (Main Theme) */
--primary: #37ec13 (bright green)

/* Kindness Features */
--primary-kindness: #f49d25 (warm orange)

/* Backgrounds */
--background-light: #f6f8f6
--background-dark: #132210
--card-light: #ffffff
--card-dark: #1c3018

/* Text */
--text-main: #121811
--text-muted: #688961
```

### Typography

- **Display Font**: Lexend (headings)
- **Body Font**: Noto Sans (body text)
- **Kindness Font**: Plus Jakarta Sans (kindness features)

### Border Radius

- `rounded-xl`: 1.5rem
- `rounded-2xl`: 2rem
- `rounded-full`: 9999px

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (for database)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### Running Locally

```bash
# Development server
npm run dev

# Open http://localhost:3000/en-US
```

### Building

```bash
# Production build
npm run build

# Start production server
npm start
```

## 🗄️ Database Setup

### Option 1: Quick Setup (Recommended for Development)

1. Create a Supabase project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Copy the Project URL and anon key to `.env.local`
3. Go to SQL Editor in Supabase Dashboard
4. Run the migration files in `supabase/migrations/` in order

See detailed instructions in `supabase/README.md`

### Option 2: Using Supabase CLI

```bash
# Link to your project
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push

# Generate TypeScript types
npx supabase gen types typescript --project-id=your-project-ref > lib/supabase/types.ts
```

### Database Migrations

**Completed:**
- ✅ 001_create_families.sql
- ✅ 002_create_users.sql
- ✅ 003_create_children.sql

**To Create:** (See `supabase/migrations/TODO.md`)
- 📝 Tasks, Rewards, Kindness systems
- 📝 Functions, Triggers, RLS Policies
- 📝 Seed data

## 🌍 Internationalization (i18n)

Currently supports:
- 🇺🇸 English (en-US) - Default
- 🇰🇷 Korean (ko-KR) - Phase 2

### Adding Translations

1. Add translations to `locales/{locale}/common.json`
2. Use `useTranslations` hook in components:

```tsx
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations();
  return <h1>{t('app.name')}</h1>;
}
```

## 📦 Included Components (shadcn/ui)

- Button
- Card
- Input
- Label
- Dialog
- Dropdown Menu
- Avatar
- Badge
- Tabs
- Sonner (Toast notifications)

## 🔐 Authentication

Configured for:
- ✅ Google OAuth
- ✅ Apple OAuth
- ✅ Email/Password

See `lib/services/auth.ts` for helper functions.

## 📋 Next Steps

### Phase 2: Onboarding Flow (Week 3-4)

- [ ] Create auth pages (login, signup, callback)
- [ ] Implement OAuth flows
- [ ] Build onboarding wizard:
  - [ ] Add child
  - [ ] Select style (Easy Start / Balanced / Learning Focus)
  - [ ] Family values (optional)
  - [ ] Ready to start
- [ ] Populate default tasks and rewards

### Phase 3: Child Dashboard & Task List (Week 5)

- [ ] Child layout and navigation
- [ ] Task card components
- [ ] Task completion flow
- [ ] Stats sidebar
- [ ] Motivational banners

## 📖 Documentation

- `docs/earnquest-proposal-v1.0-final.md` - Original proposal
- `docs/earnquest-prd-final.md` - Product requirements
- `docs/earnquest-data-model.md` - Database schema
- `docs/earnquest-setup-guide.md` - Setup instructions
- `supabase/README.md` - Database setup guide

## 🎨 UI Design Files

Google Stitch designs are in `.stitch_child_s_task_list/`:
- 28 views across 7 categories
- Onboarding, Child views, Parent views, Kindness features
- HTML + PNG for each view

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel Dashboard
```

### Environment Variables for Production

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## 🐛 Known Issues

- ⚠️ Custom fonts warning (cosmetic, doesn't affect functionality)
- ⚠️ Supabase Edge Runtime warnings in middleware (normal, doesn't affect functionality)

## 📄 License

Private project - All rights reserved

## 🤝 Contributing

This is a private project. Refer to the implementation plan for development guidelines.

---

**Built with ❤️ using Next.js, Supabase, and Tailwind CSS**
