# EarnQuest - Product Requirements Document (PRD) v1.0 Final

> **"Growing habits, shining rewards"**  
> **"성장하는 습관, 빛나는 보상"**

---

## Document Purpose

이 문서는 Claude Code의 plan mode에서 구현 계획을 세우기 위한 **최종 제품 명세서**입니다.

**Target Readers**: AI coding assistant, developers  
**Usage**: `claude --plan` 모드에서 이 문서를 참조하여 구현 계획 수립

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Core Concepts](#2-core-concepts)
3. [Internationalization (i18n) Strategy](#3-internationalization-i18n-strategy)
4. [Technical Stack](#4-technical-stack)
5. [Data Model](#5-data-model)
6. [Feature Specifications](#6-feature-specifications)
7. [UI/UX Guidelines](#7-uiux-guidelines)
8. [Implementation Phases](#8-implementation-phases)
9. [API Specifications](#9-api-specifications)
10. [Security & Compliance](#10-security--compliance)

---

## 1. Executive Summary

### 1.1 Product Definition

EarnQuest는 **아이들이 좋은 습관을 통해 포인트를 벌고, 원하는 보상으로 교환하는 가족 플랫폼**입니다.

### 1.2 Core Value Proposition

| For | Value |
|-----|-------|
| **Children** | 게임처럼 재미있게 습관 형성, 원하는 보상 획득 |
| **Parents** | 잔소리 없이 자녀 동기부여, 스크린타임 갈등 해소 |

### 1.3 Target Markets (Priority Order)

| Phase | Market | Language | Timeline |
|-------|--------|----------|----------|
| 1 | United States | English | MVP |
| 2 | South Korea | Korean | +3 months |
| 3 | Other English-speaking | English | +6 months |
| 4 | Japan, China, etc. | Local | Future |

### 1.4 Target Users

| Segment | Age | Characteristics |
|---------|-----|-----------------|
| **Primary Child** | 8-11 | Core feature set |
| **Young Child** | 5-7 | Simplified UI, immediate rewards |
| **Teen** | 12-14 | More autonomy, financial education |
| **Parent** | 25-45 | Millennial/Gen-Z, tech-savvy |

---

## 2. Core Concepts

### 2.1 Core Loop

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   TASKS              POINTS              STORE              │
│   Complete    →      Earn         →      Spend              │
│                                                             │
│   • Default          • Request           • Screen time      │
│   • Custom           • Approve/Auto      • Experiences      │
│   • App-linked       • Track             • Savings          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Key Design Principles

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| **Motivation > Control** | Encourage, don't police | Positive language, celebrations |
| **Negotiation > Command** | Family contract, not orders | "Family agreement" terminology |
| **Trust > Verification** | Default trust, verify when needed | Trust level system |
| **Habit > Reward** | Long-term goal is intrinsic motivation | Fade-out mechanism |
| **Simplicity > Completeness** | Easy to use beats feature-rich | Progressive disclosure |

### 2.3 Psychological Foundation

| Concept | Application |
|---------|-------------|
| **Overjustification Effect** | Don't reward intrinsically motivated behaviors |
| **Self-Determination Theory** | Support autonomy, competence, relatedness |
| **Token Economy** | Points as tokens, clear exchange rates |
| **Natural Consequences** | Trust level changes, not punishments |

---

## 3. Internationalization (i18n) Strategy

### 3.1 Supported Locales

| Locale Code | Language | Region | Status |
|-------------|----------|--------|--------|
| `en-US` | English | United States | Primary (MVP) |
| `ko-KR` | Korean | South Korea | Phase 2 |
| `en-GB` | English | United Kingdom | Phase 3 |
| `en-AU` | English | Australia | Phase 3 |
| `ja-JP` | Japanese | Japan | Future |
| `zh-CN` | Chinese (Simplified) | China | Future |

### 3.2 i18n Architecture

```
/locales
├── en-US/
│   ├── common.json       # Shared UI strings
│   ├── tasks.json        # Task-related strings
│   ├── rewards.json      # Reward-related strings
│   ├── onboarding.json   # Onboarding flow
│   └── notifications.json
├── ko-KR/
│   ├── common.json
│   ├── tasks.json
│   └── ...
└── templates/
    ├── en-US/
    │   ├── default-tasks.json
    │   └── default-rewards.json
    └── ko-KR/
        ├── default-tasks.json
        └── default-rewards.json
```

### 3.3 Library Choice: next-intl

**Why next-intl over i18next:**
- Native Next.js App Router support
- Server components compatible
- Type-safe with TypeScript
- Smaller bundle size
- Built-in formatting (dates, numbers, currencies)

```typescript
// Usage example
import { useTranslations } from 'next-intl';

function TaskCard({ task }) {
  const t = useTranslations('tasks');
  return <h3>{t('complete', { name: task.name })}</h3>;
}
```

### 3.4 URL Strategy

**Path-based routing** (recommended for SEO):

```
https://earnquest.app/en-US/dashboard
https://earnquest.app/ko-KR/dashboard
```

**Implementation:**
```
/app
├── [locale]/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── dashboard/
│   ├── tasks/
│   └── store/
└── api/  # API routes are locale-agnostic
```

### 3.5 Locale-Specific Configurations

```typescript
// config/locales.ts

export const localeConfigs = {
  'en-US': {
    language: 'en',
    region: 'US',
    currency: 'USD',
    currencySymbol: '$',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    weekStartsOn: 0, // Sunday
    ageGroups: {
      young: { label: 'K-2', min: 5, max: 7 },
      primary: { label: '3-5', min: 8, max: 11 },
      teen: { label: '6-8', min: 12, max: 14 },
    },
    schoolYear: {
      start: 8, // August
      end: 5,   // May
    },
  },
  'ko-KR': {
    language: 'ko',
    region: 'KR',
    currency: 'KRW',
    currencySymbol: '₩',
    dateFormat: 'YYYY.MM.DD',
    timeFormat: '24h',
    weekStartsOn: 1, // Monday
    ageGroups: {
      young: { label: '초1-2', min: 7, max: 8 },
      primary: { label: '초3-5', min: 9, max: 11 },
      teen: { label: '초6-중2', min: 12, max: 14 },
    },
    schoolYear: {
      start: 3, // March
      end: 12,  // December
    },
  },
};
```

### 3.6 Default Content by Locale

#### 3.6.1 Default Tasks

**en-US:**
```json
{
  "tasks": [
    {
      "key": "homework",
      "category": "learning",
      "name": "Complete homework",
      "points": 50,
      "approvalType": "parent"
    },
    {
      "key": "reading",
      "category": "learning",
      "name": "Read for 20 minutes",
      "points": 30,
      "approvalType": "timer",
      "timerMinutes": 20
    },
    {
      "key": "room_cleaning",
      "category": "life",
      "name": "Clean your room",
      "points": 30,
      "approvalType": "parent"
    },
    {
      "key": "dishes",
      "category": "life",
      "name": "Clear dishes after meal",
      "points": 20,
      "approvalType": "auto"
    },
    {
      "key": "exercise",
      "category": "health",
      "name": "Exercise for 30 minutes",
      "points": 40,
      "approvalType": "parent"
    }
  ]
}
```

**ko-KR:**
```json
{
  "tasks": [
    {
      "key": "homework",
      "category": "learning",
      "name": "숙제 완료",
      "points": 50,
      "approvalType": "parent"
    },
    {
      "key": "reading",
      "category": "learning",
      "name": "독서 20분",
      "points": 30,
      "approvalType": "timer",
      "timerMinutes": 20
    },
    {
      "key": "room_cleaning",
      "category": "life",
      "name": "방 정리",
      "points": 30,
      "approvalType": "parent"
    },
    {
      "key": "dishes",
      "category": "life",
      "name": "식사 후 정리",
      "points": 20,
      "approvalType": "auto"
    },
    {
      "key": "exercise",
      "category": "health",
      "name": "운동 30분",
      "points": 40,
      "approvalType": "parent"
    },
    {
      "key": "academy_homework",
      "category": "learning",
      "name": "학원 숙제",
      "points": 40,
      "approvalType": "parent",
      "localeSpecific": true
    }
  ]
}
```

#### 3.6.2 Default Rewards

**en-US:**
```json
{
  "rewards": [
    {
      "key": "menu_choice",
      "category": "autonomy",
      "name": "Choose dinner menu",
      "description": "You decide what we eat tonight!",
      "points": 80
    },
    {
      "key": "bedtime_extend",
      "category": "autonomy",
      "name": "30 min later bedtime",
      "description": "Stay up a bit longer on weekends",
      "points": 120,
      "weeklyLimit": 2
    },
    {
      "key": "board_game",
      "category": "experience",
      "name": "Board game with parent",
      "description": "30 minutes of quality time",
      "points": 60
    },
    {
      "key": "ice_cream",
      "category": "experience",
      "name": "Ice cream treat",
      "points": 150
    },
    {
      "key": "game_30min",
      "category": "screen",
      "name": "30 min video games",
      "points": 100,
      "isScreenReward": true,
      "screenMinutes": 30
    },
    {
      "key": "youtube_30min",
      "category": "screen",
      "name": "30 min YouTube",
      "points": 100,
      "isScreenReward": true,
      "screenMinutes": 30
    },
    {
      "key": "save_1dollar",
      "category": "savings",
      "name": "Save $1",
      "description": "Add to your savings!",
      "points": 150
    }
  ]
}
```

**ko-KR:**
```json
{
  "rewards": [
    {
      "key": "menu_choice",
      "category": "autonomy",
      "name": "저녁 메뉴 결정권",
      "description": "오늘 뭐 먹을지 네가 정해!",
      "points": 80
    },
    {
      "key": "bedtime_extend",
      "category": "autonomy",
      "name": "취침 30분 연장",
      "description": "주말에 조금 더 놀 수 있어",
      "points": 120,
      "weeklyLimit": 2
    },
    {
      "key": "board_game",
      "category": "experience",
      "name": "부모님과 보드게임",
      "description": "엄마/아빠랑 둘이서만 30분",
      "points": 60
    },
    {
      "key": "convenience_store",
      "category": "experience",
      "name": "편의점 간식",
      "description": "원하는 간식 하나!",
      "points": 150,
      "localeSpecific": true
    },
    {
      "key": "game_30min",
      "category": "screen",
      "name": "게임 30분",
      "points": 100,
      "isScreenReward": true,
      "screenMinutes": 30
    },
    {
      "key": "youtube_30min",
      "category": "screen",
      "name": "유튜브 30분",
      "points": 100,
      "isScreenReward": true,
      "screenMinutes": 30
    },
    {
      "key": "save_1000won",
      "category": "savings",
      "name": "1,000원 저축",
      "description": "저금통에 적립!",
      "points": 150
    }
  ]
}
```

### 3.7 Cultural Considerations

| Aspect | US | Korea | Implementation |
|--------|-----|-------|----------------|
| **Allowance culture** | Weekly, chore-based common | Monthly, less chore-tied | Flexible savings reward |
| **Screen time perception** | Major concern | Major concern (학원 시간 경쟁) | Same priority |
| **Educational pressure** | Moderate | High (학원, 학습지) | More learning tasks for KR |
| **Family hierarchy** | More egalitarian | More hierarchical | Adjust tone in KR |
| **Reward expectations** | Experience-focused | Can be material-focused | Both options available |
| **Age calculation** | Standard | Korean age (만 나이) | Use birth year, calculate dynamically |

### 3.8 Number & Currency Formatting

```typescript
// utils/format.ts
import { useFormatter } from 'next-intl';

export function useFormatters() {
  const format = useFormatter();
  
  return {
    // Points: Always integer, locale-aware thousands separator
    points: (value: number) => format.number(value),
    
    // Currency: Locale-aware
    currency: (value: number, currency: string) => 
      format.number(value, { style: 'currency', currency }),
    
    // Date: Locale-aware
    date: (date: Date) => format.dateTime(date, { dateStyle: 'medium' }),
    
    // Relative time: "2 hours ago"
    relativeTime: (date: Date) => format.relativeTime(date),
  };
}
```

### 3.9 Right-to-Left (RTL) Preparation

For future Arabic/Hebrew support:

```typescript
// config/locales.ts
export const localeConfigs = {
  // ...existing locales
  'ar-SA': {
    language: 'ar',
    region: 'SA',
    direction: 'rtl', // Add direction flag
    // ...
  },
};
```

```css
/* globals.css */
[dir="rtl"] {
  /* RTL-specific overrides */
}
```

---

## 4. Technical Stack

### 4.1 Core Stack (Confirmed)

| Layer | Technology | Reason |
|-------|------------|--------|
| **Framework** | Next.js 14+ (App Router) | SSR, API routes, file-based routing |
| **Language** | TypeScript | Type safety, better DX |
| **Styling** | Tailwind CSS | Utility-first, consistent |
| **UI Components** | shadcn/ui | Accessible, customizable |
| **Backend** | Supabase (NEW project) | PostgreSQL, Auth, Realtime, Storage |
| **Hosting** | Vercel | `earnquest2.vercel.app` |
| **App Type** | PWA first | Native in Phase 4 |
| **Auth** | Google + Apple OAuth | Kakao in Phase 2 (Korea) |
| **i18n** | next-intl | Native Next.js support |
| **State** | Zustand + TanStack Query | Simple state + server state |
| **Forms** | React Hook Form + Zod | Validation, performance |
| **Icons** | Phosphor Icons | Friendly, consistent |
| **Analytics** | PostHog | Privacy-friendly, feature flags, free tier |

### 4.2 Project Structure

```
earnquest/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Landing/Marketing
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   └── forgot-password/
│   │   ├── (app)/
│   │   │   ├── layout.tsx        # App shell with nav
│   │   │   ├── dashboard/
│   │   │   ├── tasks/
│   │   │   ├── store/
│   │   │   ├── kindness/
│   │   │   ├── family/
│   │   │   └── settings/
│   │   └── (child)/
│   │       ├── layout.tsx        # Child-specific layout
│   │       ├── my-tasks/
│   │       ├── my-points/
│   │       └── my-store/
│   ├── api/
│   │   ├── tasks/
│   │   ├── rewards/
│   │   ├── points/
│   │   ├── approvals/
│   │   └── webhooks/
│   │       └── integrations/
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── tasks/
│   ├── rewards/
│   ├── points/
│   ├── approvals/
│   ├── kindness/
│   └── shared/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── i18n/
│   │   ├── config.ts
│   │   ├── request.ts
│   │   └── navigation.ts
│   └── utils/
├── hooks/
│   ├── use-tasks.ts
│   ├── use-rewards.ts
│   ├── use-points.ts
│   └── use-family.ts
├── types/
│   ├── database.ts               # Supabase generated types
│   ├── api.ts
│   └── index.ts
├── locales/
│   ├── en-US/
│   └── ko-KR/
├── config/
│   ├── locales.ts
│   ├── constants.ts
│   └── templates/
│       ├── en-US/
│       └── ko-KR/
├── supabase/
│   ├── migrations/
│   └── seed.sql
└── public/
    ├── images/
    └── icons/
```

### 4.3 Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# App
NEXT_PUBLIC_APP_URL=https://earnquest2.vercel.app
NEXT_PUBLIC_DEFAULT_LOCALE=en-US

# Analytics (PostHog)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Integrations (Phase 3)
ARTALES_API_KEY=xxx
```

---

## 5. Data Model

### 5.1 Database Schema Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   families  │────<│    users    │────<│   children  │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
              ┌───────────────────────────────┼───────────────────────────────┐
              │                               │                               │
              ▼                               ▼                               ▼
      ┌─────────────┐                 ┌─────────────┐                 ┌─────────────┐
      │    tasks    │                 │   rewards   │                 │  kindness   │
      └─────────────┘                 └─────────────┘                 │   _cards    │
              │                               │                       └─────────────┘
              ▼                               ▼
      ┌─────────────┐                 ┌─────────────┐
      │    task_    │                 │   reward_   │
      │ completions │                 │  purchases  │
      └─────────────┘                 └─────────────┘

      ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
      │  templates  │     │   point_    │     │    app_     │
      │  (tasks/    │     │transactions │     │integrations │
      │   rewards)  │     └─────────────┘     └─────────────┘
      └─────────────┘
```

### 5.2 Key Tables with i18n Support

#### families

```sql
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  
  -- Locale settings
  locale VARCHAR(10) NOT NULL DEFAULT 'en-US',
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  
  -- Other settings as JSONB for flexibility
  settings JSONB DEFAULT '{
    "autoApprovalHours": 24,
    "screenBudgetWeeklyMinutes": 300,
    "weekStartsOn": 0
  }'::jsonb,
  
  subscription_tier VARCHAR(20) DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

#### task_templates (System-provided, locale-aware)

```sql
CREATE TABLE task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  template_key VARCHAR(100) NOT NULL,  -- 'homework', 'reading', etc.
  locale VARCHAR(10) NOT NULL,          -- 'en-US', 'ko-KR'
  
  -- Content (localized)
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Classification
  category VARCHAR(20) NOT NULL,
  age_group VARCHAR(10),
  
  -- Defaults
  default_points INT NOT NULL,
  default_approval_type VARCHAR(20) DEFAULT 'parent',
  default_timer_minutes INT,
  default_checklist JSONB,
  
  -- Metadata
  icon VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_locale_specific BOOLEAN DEFAULT false,  -- Only show in specific locale
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(template_key, locale)
);
```

#### tasks (Family-specific, inherits locale from family)

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id),
  template_id UUID REFERENCES task_templates(id),
  child_id UUID REFERENCES children(id),
  
  -- Content (can be customized from template)
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(20) NOT NULL,
  
  -- Points and approval
  points INT NOT NULL,
  approval_type VARCHAR(20) DEFAULT 'parent',
  timer_minutes INT,
  checklist JSONB,
  photo_required BOOLEAN DEFAULT false,
  
  -- Trust system
  is_trust_task BOOLEAN DEFAULT false,
  min_trust_level INT DEFAULT 1,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

### 5.3 Full Schema

See separate document: `earnquest-data-model.md`

Key changes for i18n:
- `families.locale` - Family's preferred locale
- `families.timezone` - For auto-approval timing
- `families.currency` - For savings display
- `task_templates` / `reward_templates` - Locale-specific templates
- `is_locale_specific` flag - For locale-only items (e.g., 학원 숙제)

---

## 6. Feature Specifications

### 6.1 Authentication

#### 6.1.1 Parent Authentication

| Method | Priority | Notes |
|--------|----------|-------|
| Email/Password | MVP | Standard signup |
| Google OAuth | MVP | One-click signup |
| Apple OAuth | Phase 2 | Required for iOS |
| Kakao OAuth | Phase 2 | Popular in Korea |

#### 6.1.2 Child Access

| Method | Description |
|--------|-------------|
| **Family Code** | 6-digit code to join family |
| **PIN (optional)** | 4-digit PIN for child login |
| **Device Trust** | Remember device for seamless access |

### 6.2 Task System

#### 6.2.1 Task Properties

```typescript
interface Task {
  id: string;
  familyId: string;
  templateId?: string;
  childId?: string;  // null = all children
  
  name: string;
  description?: string;
  category: 'learning' | 'life' | 'health';
  icon?: string;
  
  points: number;
  approvalType: 'parent' | 'auto' | 'timer' | 'checklist';
  timerMinutes?: number;
  checklist?: string[];
  photoRequired: boolean;
  
  isTrustTask: boolean;
  minTrustLevel: number;
  
  schedule?: {
    days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
    time?: string;
  };
  
  isActive: boolean;
  sortOrder: number;
}
```

#### 6.2.2 Task Completion Flow

```
Child: Tap "Complete" on task
  │
  ├─ Auto approval? ───────────────────────────→ Points credited immediately
  │
  ├─ Timer-based? ─────────────────────────────→ Start timer
  │                                                │
  │                                                └─ Timer complete → Points credited
  │
  ├─ Checklist-based? ─────────────────────────→ Show checklist
  │                                                │
  │                                                └─ All checked → Points credited
  │
  └─ Parent approval? ─────────────────────────→ Create pending request
                                                   │
                                                   ├─ Parent approves → Points credited
                                                   ├─ Parent requests fix → Child notified
                                                   └─ 24h passes → Auto-approved
```

#### 6.2.3 Approval States

| State | Code | Child Message | Parent Action |
|-------|------|---------------|---------------|
| **Pending** | `pending` | "Waiting for check" | Approve / Fix / Later |
| **Fix Requested** | `fix_requested` | "Almost there! Do a bit more" | - |
| **Approved** | `approved` | "Great job! +50 pts" | - |
| **Auto Approved** | `auto_approved` | "Great job! +50 pts" | - |

### 6.3 Reward System

#### 6.3.1 Reward Categories

| Category | Key | Examples |
|----------|-----|----------|
| **Autonomy** | `autonomy` | Menu choice, bedtime extension |
| **Experience** | `experience` | Ice cream, friend visit, board game |
| **Screen** | `screen` | Game time, YouTube time |
| **Savings** | `savings` | Save $1, save ₩1,000 |
| **Item** | `item` | Toys, desired items |

#### 6.3.2 Reward Properties

```typescript
interface Reward {
  id: string;
  familyId: string;
  templateId?: string;
  
  name: string;
  description?: string;
  category: 'autonomy' | 'experience' | 'screen' | 'savings' | 'item';
  icon?: string;
  
  points: number;
  weeklyLimit?: number;
  
  isScreenReward: boolean;
  screenMinutes?: number;
  
  requiresParentAction: boolean;
  
  isActive: boolean;
  sortOrder: number;
}
```

#### 6.3.3 Purchase Flow

```
Child: Tap "Get" on reward
  │
  ├─ Enough points? ───── No ──→ "Need X more points"
  │
  ├─ Weekly limit OK? ─── No ──→ "Already got this X times this week"
  │
  ├─ Screen budget OK? ── No ──→ "Screen time budget used up"
  │
  └─ All checks pass ──────────→ Points deducted
                                  │
                                  └─ "Ticket" issued
                                      │
                                      └─ Parent notified to fulfill
```

### 6.4 Kindness System

#### 6.4.1 Components

| Component | Description |
|-----------|-------------|
| **Kindness Card** | Family member sends appreciation message |
| **Kindness Badge** | Earned after 5 cards received |
| **Weekly Bonus** | Selected "best kindness" gets surprise points |

#### 6.4.2 Why Separate from Tasks

> "Prosocial behavior + expected rewards = reduced intrinsic motivation"

- Kindness is NOT a regular point-earning task
- Recognition through messages and badges (social reward)
- Occasional surprise bonus (unexpected reward preserves motivation)

### 6.5 Trust Level System

#### 6.5.1 Levels

| Level | Name | Requirements | Benefits |
|-------|------|--------------|----------|
| 1 | **Starter** | Default | All tasks need approval |
| 2 | **Trusted** | 2 weeks honest | Some auto-approval |
| 3 | **Highly Trusted** | 4 weeks honest | Most auto-approval |

#### 6.5.2 Trust Changes

```
Honest completion (14 days) → Level up
Dishonest completion found → Level down (that task only)
```

### 6.6 Family Management

#### 6.6.1 Family Structure

```
Family Account
├── Parent 1 (Admin)
├── Parent 2 (Admin) [optional]
├── Child 1
├── Child 2
└── ...
```

#### 6.6.2 Roles & Permissions

| Role | Can Do |
|------|--------|
| **Admin (Parent)** | Everything |
| **Child** | View/complete tasks, view/purchase rewards, send kindness cards |

### 6.7 Notifications

#### 6.7.1 Notification Types

| Event | To | Channel | Message (en-US) |
|-------|-----|---------|-----------------|
| Task completion | Parent | Push, In-app | "{child} completed {task}" |
| Approval pending | Parent | Push (batch) | "3 tasks waiting for review" |
| Points earned | Child | In-app | "Great job! +50 pts" |
| Reward purchased | Parent | Push | "{child} got {reward}" |
| Weekly summary | Parent | Email, Push | "This week in EarnQuest" |
| Kindness received | Child | In-app | "{sender} sent you a thank you!" |

#### 6.7.2 Notification Preferences

```typescript
interface NotificationSettings {
  taskCompletion: boolean;      // Each completion
  batchApproval: boolean;       // Daily digest
  rewardPurchase: boolean;
  weeklyReport: boolean;
  kindnessCards: boolean;
}
```

---

## 7. UI/UX Guidelines

### 7.1 Design Tokens

See `earnquest-brand-guidelines.md` for full details.

**Quick Reference:**

```css
/* Colors */
--color-primary: #6C5CE7;      /* Quest Purple */
--color-secondary: #FDCB6E;    /* Star Gold */
--color-success: #00B894;      /* Growth Green */
--color-info: #74B9FF;         /* Sky Blue */
--color-warning: #FDCB6E;
--color-error: #D63031;

/* Typography */
--font-family: 'Inter', sans-serif;

/* Spacing */
--space-unit: 4px;

/* Border Radius */
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
```

### 7.2 Child View Guidelines

| Principle | Implementation |
|-----------|----------------|
| Large touch targets | Min 44px height for buttons |
| Clear visual hierarchy | Points always prominent (gold) |
| Immediate feedback | Animations on completion |
| Encouraging tone | Celebratory messages |
| Simple navigation | Bottom tab bar, max 4 items |

### 7.3 Parent View Guidelines

| Principle | Implementation |
|-----------|----------------|
| Efficiency | Batch approval UI |
| Information density | More compact cards |
| Quick actions | Swipe gestures, 1-tap approve |
| Overview first | Dashboard with summary stats |

### 7.4 Responsive Breakpoints

```css
/* Mobile first */
sm: 640px   /* Large phone */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
```

### 7.5 Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Color contrast | WCAG AA (4.5:1 text, 3:1 UI) |
| Focus indicators | Visible focus rings |
| Screen readers | Semantic HTML, ARIA labels |
| Reduced motion | `prefers-reduced-motion` support |
| Font sizing | Rem units, user-scalable |

---

## 8. Implementation Phases

### Phase 1: MVP (Weeks 1-8)

**Goal**: Core loop working for one family in English

#### Week 1-2: Foundation
```
□ Next.js project setup with App Router
□ Supabase project & initial schema
□ Authentication (Email + Google)
□ i18n setup (next-intl) with en-US
□ Basic layout & navigation
□ shadcn/ui component setup
```

#### Week 3-4: Core Data & Auth
```
□ Family creation flow
□ Child profile creation
□ Onboarding wizard (style selection)
□ Default task/reward seeding (en-US)
□ Basic dashboard (parent & child views)
```

#### Week 5-6: Task System
```
□ Task list display
□ Task completion (request)
□ Parent approval UI (approve/fix/later)
□ Fix request templates
□ Auto-approval (24h)
□ Points crediting
```

#### Week 7-8: Reward System
```
□ Reward store display
□ Reward purchase flow
□ Points deduction
□ Ticket system
□ Screen budget tracking
□ Weekly limit enforcement
```

**MVP Deliverable**: 
- Parent can create family, add child
- Child can see tasks, request completion
- Parent can approve (batch)
- Child can purchase rewards
- Basic points tracking

---

### Phase 2: Polish & Korean (Weeks 9-14)

**Goal**: Production-ready, Korean locale added

#### Week 9-10: Task Enhancements
```
□ Timer-based tasks
□ Checklist-based tasks
□ Photo upload option
□ Task categories with icons
□ Task scheduling (days)
```

#### Week 11-12: Kindness & Trust
```
□ Kindness cards (send/receive)
□ Kindness badges
□ Weekly kindness bonus
□ Trust level system
□ Trust-based auto-approval
```

#### Week 13-14: Korean Locale
```
□ ko-KR translations
□ Korean default tasks/rewards
□ Korean date/currency formatting
□ Cultural adjustments
□ Testing with Korean users
```

**Phase 2 Deliverable**:
- Full task features (timer, checklist)
- Kindness system working
- Trust levels implemented
- Korean language support
- Ready for beta users

---

### Phase 3: Growth (Weeks 15-20)

**Goal**: Retention features, integrations, mobile prep

#### Week 15-16: Retention Features
```
□ Weekly summary generation
□ Weekly summary email/push
□ Parent achievements/badges
□ Streak tracking
□ Gentle re-engagement nudges
```

#### Week 17-18: Integrations
```
□ Artales API integration
□ Integration task type
□ Daily limit for integrations
□ Integration management UI
```

#### Week 19-20: Mobile & Polish
```
□ PWA setup (installable)
□ Push notifications (web)
□ Performance optimization
□ Error handling & recovery
□ Analytics setup
```

**Phase 3 Deliverable**:
- Weekly reports
- Artales integration
- PWA installable
- Push notifications
- Ready for public launch

---

### Phase 4: Scale (Future)

```
□ Native mobile app (React Native or Capacitor)
□ More locale support
□ Premium subscription features
□ More integrations
□ Advanced analytics
```

---

## 9. API Specifications

### 9.1 API Design Principles

| Principle | Implementation |
|-----------|----------------|
| RESTful | Standard HTTP methods |
| Consistent | `/api/[resource]/[id]` pattern |
| Validated | Zod schemas for all inputs |
| Typed | TypeScript throughout |
| Secure | RLS + API key validation |

### 9.2 Core Endpoints

#### Tasks

```
GET    /api/tasks                    # List family tasks
POST   /api/tasks                    # Create task
GET    /api/tasks/:id                # Get task
PATCH  /api/tasks/:id                # Update task
DELETE /api/tasks/:id                # Soft delete task

POST   /api/tasks/:id/complete       # Child requests completion
GET    /api/tasks/pending            # Parent's pending approvals
POST   /api/tasks/completions/:id/approve    # Parent approves
POST   /api/tasks/completions/:id/fix        # Parent requests fix
```

#### Rewards

```
GET    /api/rewards                  # List family rewards
POST   /api/rewards                  # Create reward
GET    /api/rewards/:id              # Get reward
PATCH  /api/rewards/:id              # Update reward
DELETE /api/rewards/:id              # Soft delete reward

POST   /api/rewards/:id/purchase     # Child purchases reward
GET    /api/rewards/purchases        # List purchases (tickets)
POST   /api/rewards/purchases/:id/fulfill  # Parent fulfills
```

#### Points

```
GET    /api/children/:id/points      # Get child's point balance
GET    /api/children/:id/transactions # Point history
POST   /api/children/:id/points/adjust # Manual adjustment (parent)
```

#### Family

```
GET    /api/family                   # Get family info
PATCH  /api/family                   # Update family settings
POST   /api/family/children          # Add child
GET    /api/family/children          # List children
```

#### Kindness

```
POST   /api/kindness/cards           # Send kindness card
GET    /api/children/:id/kindness    # Child's received cards & badges
POST   /api/kindness/weekly-bonus    # Select weekly bonus winner
```

### 9.3 Request/Response Examples

#### Create Task

```typescript
// POST /api/tasks
// Request
{
  "name": "Complete homework",
  "category": "learning",
  "points": 50,
  "approvalType": "parent",
  "childId": null  // null = all children
}

// Response
{
  "id": "uuid",
  "familyId": "uuid",
  "name": "Complete homework",
  "category": "learning",
  "points": 50,
  "approvalType": "parent",
  "childId": null,
  "isActive": true,
  "createdAt": "2025-01-05T00:00:00Z"
}
```

#### Complete Task

```typescript
// POST /api/tasks/:taskId/complete
// Request
{
  "childId": "uuid",
  "evidence": {
    "photos": ["url1"],      // optional
    "timerCompleted": true,  // if timer task
    "checklist": [true, true, false]  // if checklist task
  }
}

// Response
{
  "completionId": "uuid",
  "status": "pending",  // or "auto_approved" if auto task
  "autoApproveAt": "2025-01-06T00:00:00Z",
  "pointsAwarded": null  // null until approved
}
```

#### Purchase Reward

```typescript
// POST /api/rewards/:rewardId/purchase
// Request
{
  "childId": "uuid"
}

// Response (success)
{
  "purchaseId": "uuid",
  "rewardName": "30 min video games",
  "pointsSpent": 100,
  "newBalance": 250,
  "status": "purchased"
}

// Response (error)
{
  "error": "INSUFFICIENT_POINTS",
  "message": "Need 50 more points",
  "required": 100,
  "current": 50
}
```

---

## 10. Security & Compliance

### 10.1 Data Security

| Measure | Implementation |
|---------|----------------|
| **Encryption at rest** | Supabase default (AES-256) |
| **Encryption in transit** | HTTPS only |
| **Authentication** | Supabase Auth (JWT) |
| **Authorization** | Row Level Security (RLS) |
| **API Security** | Rate limiting, input validation |

### 10.2 Row Level Security (RLS)

```sql
-- Example: Users can only see their own family's data
CREATE POLICY "Users can view own family"
ON tasks FOR SELECT
USING (
  family_id = (
    SELECT family_id FROM users WHERE id = auth.uid()
  )
);
```

### 10.3 Children's Privacy (COPPA / GDPR-K)

| Requirement | Implementation |
|-------------|----------------|
| **Parental consent** | Parent creates child accounts |
| **Minimal data** | Only name, age group (no birthdate required) |
| **No direct contact** | Children can't receive external messages |
| **Data deletion** | Parent can delete child data anytime |
| **No advertising** | No ads, no data selling |

### 10.4 Compliance Checklist

**COPPA (US):**
```
□ Parental consent for under-13
□ No collection of unnecessary personal info
□ No behavioral advertising
□ Parent access to child data
□ Parent deletion rights
□ Secure data handling
```

**개인정보보호법 (Korea):**
```
□ 14세 미만 법정대리인 동의
□ Privacy policy in Korean
□ Data localization consideration
□ Consent for each purpose
□ Right to deletion
```

### 10.5 Terms & Privacy

Required documents (per locale):
- Terms of Service
- Privacy Policy
- Children's Privacy Policy

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Task** | Activity that earns points when completed |
| **Reward** | Item that can be purchased with points |
| **Ticket** | Proof of purchase, awaiting fulfillment |
| **Trust Level** | Child's earned autonomy level |
| **Kindness Card** | Appreciation message between family members |
| **Fix Request** | Parent's request for task improvement |
| **Screen Budget** | Weekly limit on screen-type rewards |

## Appendix B: File Checklist

Required files for implementation:

```
□ earnquest-prd-final.md (this document)
□ earnquest-data-model.md
□ earnquest-brand-guidelines.md
□ earnquest-logo.svg
□ earnquest-icon.svg
```

## Appendix C: Technical Decisions (Confirmed)

| Question | Decision |
|----------|----------|
| Supabase project | New project (not reusing existing) |
| Domain | `earnquest2.vercel.app` (temporary) |
| Hosting | Vercel |
| App type | PWA first, native in Phase 4 |
| Auth providers | Google + Apple (Kakao in Phase 2) |
| Analytics | PostHog |
| Multiple currencies | One currency per family |

---

*EarnQuest PRD v1.0 Final*
*Created: January 2025*
*For use with Claude Code plan mode*
