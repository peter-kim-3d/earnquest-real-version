# EarnQuest Brand Guidelines v1.0

> **"성장하는 습관, 빛나는 보상"**

---

## Brand Overview

### Brand Essence
EarnQuest는 아이들이 좋은 습관을 통해 성장하고, 그 과정에서 성취감과 보상을 경험하는 가족 플랫폼입니다.

### Brand Personality
| 특성 | 설명 |
|-----|------|
| **Encouraging** | 격려하는, 응원하는 |
| **Playful** | 재미있지만 유치하지 않은 |
| **Trustworthy** | 부모가 신뢰할 수 있는 |
| **Growing** | 성장과 발전을 상징 |

### Target Audience
- **Primary**: 8-11세 아이들
- **Secondary**: 부모 (25-45세)
- **Tertiary**: 5-7세, 12-14세 확장

---

## Logo

### Primary Logo Concept

```
    ★
   ╱ ╲
  ╱   ╲
 ╱─────╲
    │
    │        EarnQuest
   ═══
```

**컨셉**: 별(성취) + 깃발(퀘스트/목표) + 성장하는 식물 줄기

### Logo Variations

| 버전 | 용도 |
|-----|------|
| **Full Logo** | 로고 + 텍스트 (가로형) |
| **Stacked Logo** | 로고 위, 텍스트 아래 (세로형) |
| **Icon Only** | 앱 아이콘, 파비콘 |
| **Wordmark Only** | 텍스트만 (공간 제한 시) |

### Logo Colors

```
Primary (Default):    Purple gradient on white
Reversed:             White on purple/dark
Monochrome Dark:      #1a1a2e on white
Monochrome Light:     White on dark
```

### Clear Space
로고 주변에 최소 로고 높이의 50% 여백 확보

### Minimum Size
- Digital: 24px height (icon), 80px width (full logo)
- Print: 10mm height (icon), 30mm width (full logo)

---

## Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Quest Purple** | `#6C5CE7` | 108, 92, 231 | 주요 브랜드 색상, CTA 버튼 |
| **Star Gold** | `#FDCB6E` | 253, 203, 110 | 포인트, 별, 성취 강조 |
| **Growth Green** | `#00B894` | 0, 184, 148 | 완료, 성공, 긍정 피드백 |

### Secondary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Sky Blue** | `#74B9FF` | 116, 185, 255 | 정보, 링크, 보조 액션 |
| **Coral Pink** | `#FF7675` | 255, 118, 117 | 알림, 주의, 리워드 강조 |
| **Mint** | `#55EFC4` | 85, 239, 196 | 배지, 레벨업, 친절 시스템 |

### Neutral Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Dark** | `#2D3436` | 45, 52, 54 | 텍스트, 헤더 |
| **Gray 700** | `#636E72` | 99, 110, 114 | 보조 텍스트 |
| **Gray 400** | `#B2BEC3` | 178, 190, 195 | 비활성, 플레이스홀더 |
| **Gray 100** | `#DFE6E9` | 223, 230, 233 | 보더, 구분선 |
| **Light** | `#F5F6FA` | 245, 246, 250 | 배경 |
| **White** | `#FFFFFF` | 255, 255, 255 | 카드 배경 |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#00B894` | 완료, 승인, 성공 |
| **Warning** | `#FDCB6E` | 주의, 대기 중 |
| **Error** | `#D63031` | 오류, 삭제 |
| **Info** | `#74B9FF` | 정보, 도움말 |

### Gradients

```css
/* Primary Gradient - 버튼, 헤더 */
.gradient-primary {
  background: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);
}

/* Gold Gradient - 포인트, 별 */
.gradient-gold {
  background: linear-gradient(135deg, #FDCB6E 0%, #F8B500 100%);
}

/* Success Gradient - 완료 상태 */
.gradient-success {
  background: linear-gradient(135deg, #00B894 0%, #55EFC4 100%);
}

/* Fun Gradient - 아이 뷰 배경 */
.gradient-fun {
  background: linear-gradient(180deg, #F5F6FA 0%, #DFE6E9 100%);
}
```

---

## Typography

### Font Family

**Primary Font: Inter**
- 깔끔하고 현대적
- 다양한 weight 지원
- 한글과 조화로움
- Google Fonts에서 무료

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Secondary Font (한글): Pretendard**
- 한글 가독성 우수
- Inter와 유사한 느낌

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

font-family: 'Pretendard', 'Inter', sans-serif;
```

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **Display** | 48px | 800 | 1.1 | 히어로 섹션 |
| **H1** | 32px | 700 | 1.2 | 페이지 타이틀 |
| **H2** | 24px | 700 | 1.3 | 섹션 타이틀 |
| **H3** | 20px | 600 | 1.4 | 카드 타이틀 |
| **H4** | 18px | 600 | 1.4 | 서브 헤딩 |
| **Body Large** | 18px | 400 | 1.6 | 중요 본문 |
| **Body** | 16px | 400 | 1.6 | 기본 본문 |
| **Body Small** | 14px | 400 | 1.5 | 보조 텍스트 |
| **Caption** | 12px | 500 | 1.4 | 라벨, 캡션 |
| **Overline** | 10px | 600 | 1.4 | 카테고리, 태그 |

### Text Colors

```css
/* On Light Background */
.text-primary { color: #2D3436; }    /* 주요 텍스트 */
.text-secondary { color: #636E72; }  /* 보조 텍스트 */
.text-tertiary { color: #B2BEC3; }   /* 비활성/힌트 */

/* On Dark/Purple Background */
.text-on-dark { color: #FFFFFF; }
.text-on-dark-secondary { color: rgba(255,255,255,0.7); }
```

---

## Iconography

### Icon Style
- **Style**: Rounded, Friendly
- **Stroke Width**: 2px
- **Corner Radius**: 4px
- **Size Grid**: 16, 20, 24, 32, 48px

### Recommended Icon Library
**Phosphor Icons** (https://phosphoricons.com)
- 다양한 스타일 (regular, bold, fill)
- 친근하고 둥근 느낌
- React 컴포넌트 제공

```bash
npm install @phosphor-icons/react
```

### Category Icons

| Category | Icon | Color |
|----------|------|-------|
| 학습 (Learning) | 📚 Book | `#6C5CE7` |
| 생활 (Life) | 🏠 House | `#00B894` |
| 건강 (Health) | 💪 Barbell | `#FF7675` |
| 스크린 (Screen) | 🎮 GameController | `#74B9FF` |
| 경험 (Experience) | ⭐ Star | `#FDCB6E` |
| 자율권 (Autonomy) | 👑 Crown | `#A29BFE` |
| 저축 (Savings) | 🐷 PiggyBank | `#55EFC4` |

### Status Icons

| Status | Icon | Color |
|--------|------|-------|
| 완료 (Approved) | ✓ CheckCircle | `#00B894` |
| 대기 (Pending) | ⏳ Clock | `#FDCB6E` |
| 다시 확인 (Fix) | 🔄 ArrowsClockwise | `#74B9FF` |
| 포인트 | ⭐ Star | `#FDCB6E` |

---

## Components

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%);
  color: white;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  box-shadow: 0 4px 14px rgba(108, 92, 231, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(108, 92, 231, 0.4);
}

/* Secondary Button */
.btn-secondary {
  background: white;
  color: #6C5CE7;
  border: 2px solid #6C5CE7;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: #636E72;
  padding: 12px 24px;
  font-weight: 500;
}

/* Success Button (완료/승인) */
.btn-success {
  background: linear-gradient(135deg, #00B894 0%, #55EFC4 100%);
  color: white;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
}

/* Reward Button (리워드 구매) */
.btn-reward {
  background: linear-gradient(135deg, #FDCB6E 0%, #F8B500 100%);
  color: #2D3436;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
}
```

### Cards

```css
/* Base Card */
.card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* Task Card */
.card-task {
  background: white;
  border-radius: 16px;
  padding: 16px;
  border-left: 4px solid #6C5CE7;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* Reward Card */
.card-reward {
  background: linear-gradient(135deg, #FDCB6E10 0%, #FDCB6E05 100%);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #FDCB6E40;
}

/* Kindness Card */
.card-kindness {
  background: linear-gradient(135deg, #55EFC410 0%, #00B89405 100%);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid #00B89440;
}
```

### Points Display

```css
/* Points Badge */
.points-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: linear-gradient(135deg, #FDCB6E 0%, #F8B500 100%);
  color: #2D3436;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 14px;
}

/* Points Balance (큰 표시) */
.points-balance {
  font-size: 48px;
  font-weight: 800;
  background: linear-gradient(135deg, #FDCB6E 0%, #F8B500 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Status Badges

```css
/* Pending */
.badge-pending {
  background: #FDCB6E20;
  color: #D4A017;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

/* Approved */
.badge-approved {
  background: #00B89420;
  color: #00B894;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

/* Fix Requested */
.badge-fix {
  background: #74B9FF20;
  color: #0984E3;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
```

---

## Spacing System

```css
/* Base: 4px */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

## Border Radius

```css
--radius-sm: 8px;    /* 작은 버튼, 뱃지 */
--radius-md: 12px;   /* 버튼, 입력 필드 */
--radius-lg: 16px;   /* 카드 */
--radius-xl: 24px;   /* 큰 카드, 모달 */
--radius-full: 9999px; /* 원형 */
```

## Shadows

```css
/* Subtle - 기본 카드 */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);

/* Medium - 호버, 드롭다운 */
--shadow-md: 0 4px 14px rgba(0, 0, 0, 0.1);

/* Large - 모달, 플로팅 */
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);

/* Purple Glow - CTA 버튼 */
--shadow-purple: 0 4px 14px rgba(108, 92, 231, 0.3);

/* Gold Glow - 포인트, 리워드 */
--shadow-gold: 0 4px 14px rgba(253, 203, 110, 0.4);
```

---

## Motion / Animation

### Timing

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.45, 0, 0.55, 1);

--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;
```

### Common Animations

```css
/* Button Hover */
.btn:hover {
  transform: translateY(-2px);
  transition: transform var(--duration-fast) var(--ease-out);
}

/* Card Hover */
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  transition: all var(--duration-normal) var(--ease-out);
}

/* Points Earned - 축하 효과 */
@keyframes points-pop {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.points-earned {
  animation: points-pop 0.4s var(--ease-out);
}

/* Task Complete - 체크마크 */
@keyframes check-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.task-complete-icon {
  animation: check-bounce 0.3s var(--ease-out);
}

/* Badge Earned - 빛나는 효과 */
@keyframes badge-shine {
  0% { box-shadow: 0 0 0 0 rgba(253, 203, 110, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(253, 203, 110, 0); }
  100% { box-shadow: 0 0 0 0 rgba(253, 203, 110, 0); }
}

.badge-new {
  animation: badge-shine 1s ease-out;
}
```

---

## Voice & Tone

### 아이에게 말할 때

| ✅ Do | ❌ Don't |
|-------|---------|
| "잘했어! 🎉" | "승인되었습니다" |
| "조금만 더 해볼까?" | "거절됨" |
| "와, 벌써 100포인트!" | "포인트 잔액: 100" |
| "오늘도 대단해!" | "태스크 완료" |

### 부모에게 말할 때

| ✅ Do | ❌ Don't |
|-------|---------|
| "안나가 오늘 3개나 완료했어요" | "3개 태스크 완료됨" |
| "확인이 필요해요" | "승인 대기 중" |
| "이번 주 잔소리가 줄었을 거예요 😊" | "주간 리포트" |

### 핵심 메시지 톤
- **Encouraging**: 항상 격려하는 톤
- **Celebratory**: 작은 성취도 축하
- **Simple**: 쉬운 단어, 짧은 문장
- **Warm**: 따뜻하고 친근한 느낌

---

## App-Specific Guidelines

### Child View (아이 화면)

```
- 큰 버튼, 터치 친화적 (min 44px)
- 밝은 색상, 그라데이션 적극 활용
- 아이콘 + 텍스트 함께 사용
- 포인트는 항상 눈에 띄게 (골드)
- 성취 시 애니메이션/효과
```

### Parent View (부모 화면)

```
- 더 깔끔하고 정보 밀도 높게
- 배치 처리 UI (효율성)
- 통계/진행상황 한눈에
- 빠른 액션 (1-2탭으로 완료)
- 알림은 간결하게
```

### Approval States

```css
/* Pending - 대기 */
.state-pending {
  border-left-color: #FDCB6E;
  background: #FDCB6E08;
}

/* Approved - 완료 */
.state-approved {
  border-left-color: #00B894;
  background: #00B89408;
}

/* Fix Requested - 다시 확인 */
.state-fix {
  border-left-color: #74B9FF;
  background: #74B9FF08;
}
```

---

## Stitch 수정 프롬프트

기존 Stitch 디자인을 EarnQuest 브랜딩에 맞게 수정하려면:

```
Please update the EarnQuest app design with the following brand guidelines:

## Colors
- Primary: #6C5CE7 (Quest Purple) - for main buttons, headers
- Secondary: #FDCB6E (Star Gold) - for points, stars, rewards
- Success: #00B894 (Growth Green) - for completed tasks, approvals
- Accent Blue: #74B9FF - for links, info
- Accent Pink: #FF7675 - for notifications
- Background: #F5F6FA (light gray)
- Cards: #FFFFFF with subtle shadow

## Typography
- Font: Inter (or system sans-serif)
- Headings: Bold/Semibold
- Body: Regular

## Style
- Border radius: 12-16px for cards, 8-12px for buttons
- Shadows: Subtle, soft (0 2px 8px rgba(0,0,0,0.06))
- Buttons: Gradient backgrounds for primary actions
- Icons: Rounded, friendly style (Phosphor Icons recommended)

## Child View Specifics
- Large touch targets (min 44px)
- Points displayed prominently with gold color
- Celebratory feel with subtle animations
- Category colors for task types:
  - Learning: Purple (#6C5CE7)
  - Life: Green (#00B894)  
  - Health: Pink (#FF7675)

## Parent View Specifics
- Cleaner, more professional look
- Efficient batch approval UI
- Clear status indicators
- Quick action buttons

## Key Screens to Update
1. Child Dashboard - show points prominently, today's tasks
2. Task List - category colors, completion states
3. Store - reward cards with gold accents
4. Parent Approval - batch list with quick actions
5. Weekly Summary - celebratory tone, stats visualization

Please maintain a friendly, encouraging tone throughout while ensuring
the design feels trustworthy for parents.
```

---

## Asset Checklist

### Required Assets

- [ ] Logo (SVG, PNG @1x, @2x, @3x)
- [ ] App Icon (1024x1024 for App Store)
- [ ] Favicon (16x16, 32x32, 180x180)
- [ ] OG Image (1200x630)
- [ ] Category Icons (SVG)
- [ ] Status Icons (SVG)
- [ ] Empty States Illustrations
- [ ] Onboarding Illustrations
- [ ] Achievement/Badge Designs

### Font Files

- [ ] Inter (woff2) - Regular, Medium, SemiBold, Bold, ExtraBold
- [ ] Pretendard (woff2) - for Korean support

---

## Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Primary
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
        // Secondary
        'sky-blue': '#74B9FF',
        'coral-pink': '#FF7675',
        'mint': '#55EFC4',
        // Neutral
        'dark': '#2D3436',
        'gray': {
          700: '#636E72',
          400: '#B2BEC3',
          100: '#DFE6E9',
        },
        'light': '#F5F6FA',
      },
      fontFamily: {
        sans: ['Inter', 'Pretendard', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.06)',
        'md': '0 4px 14px rgba(0, 0, 0, 0.1)',
        'lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'purple': '0 4px 14px rgba(108, 92, 231, 0.3)',
        'gold': '0 4px 14px rgba(253, 203, 110, 0.4)',
      },
    },
  },
}
```

---

*EarnQuest Brand Guidelines v1.0*
*Created: January 2025*
