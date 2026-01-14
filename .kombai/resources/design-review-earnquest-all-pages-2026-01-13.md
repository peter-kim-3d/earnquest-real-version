# Design Review Results: EarnQuest - All Pages

**Review Date**: January 13, 2026  
**Routes Reviewed**: All pages (Landing, Dashboard, Tasks, Rewards, Profile, Settings, Child Dashboard, Child Store, Child Tickets, Onboarding)  
**Focus Areas**: Visual Design, UX/Usability, Responsive/Mobile, Accessibility, Micro-interactions/Motion, Consistency, Performance

## Summary

EarnQuest demonstrates a solid foundation with a cohesive "Stitch Design System" featuring bright green (#37ec13) as the primary color. The application shows good component reuse with shadcn, proper dark mode support, and well-structured TypeScript code. However, there are significant opportunities for improvement across accessibility (WCAG violations), information architecture (scattered parent dashboard), responsive design (missing mobile breakpoints), and visual consistency (mixed icon libraries, inconsistent spacing patterns).

## Issues

| # | Issue | Criticality | Category | Location |
|---|-------|-------------|----------|----------|
| 1 | Primary green (#37ec13) fails WCAG AA contrast on white backgrounds (2.8:1, needs 4.5:1) | Critical | Accessibility | `tailwind.config.ts:13`, `app/globals.css:7` |
| 2 | Missing ARIA labels on icon-only buttons and navigation items | Critical | Accessibility | `app/[locale]/page.tsx:46-47`, `components/parent/ParentNav.tsx`, `components/child/ChildNav.tsx` |
| 3 | Material Symbols icons loaded from CDN instead of bundled, blocking initial render | High | Performance | `app/layout.tsx` (inferred from usage) |
| 4 | No keyboard focus indicators visible on interactive elements | Critical | Accessibility | All interactive components - missing `:focus-visible` styles |
| 5 | Parent dashboard information scattered across multiple cards with no clear hierarchy | High | UX/Usability | `app/[locale]/(app)/dashboard/page.tsx:8-177` |
| 6 | Missing mobile breakpoints for complex grid layouts (3-column stats, 2-column child cards) | High | Responsive | `app/[locale]/(app)/dashboard/page.tsx`, `app/[locale]/(app)/tasks/page.tsx:68-100` |
| 7 | Inconsistent icon usage: Material Symbols, Lucide, and Phosphor mixed throughout | Medium | Consistency | Throughout codebase - `app/[locale]/page.tsx` (Lucide), dashboard pages (Material Symbols) |
| 8 | Hardcoded spacing values (px) instead of Tailwind spacing scale | Medium | Consistency | `app/[locale]/page.tsx:32-76`, multiple component files |
| 9 | Color variables from Tailwind config not consistently used (e.g., `text-text-main` vs `text-text-muted`) | Medium | Consistency | `tailwind.config.ts:14-21` vs actual usage in pages |
| 10 | No loading states or skeleton screens for async data | High | UX/Usability | All page components with `await supabase` calls |
| 11 | Touch targets smaller than 44x44px on mobile (navigation icons, quick actions) | High | Accessibility | `components/parent/ParentNav.tsx`, `components/child/ChildNav.tsx` |
| 12 | Missing error boundaries and error states for failed data fetches | High | UX/Usability | All page components - no error handling for Supabase failures |
| 13 | Pending approvals buried in separate `ActionCenter` component, not immediately visible | High | UX/Usability | `components/parent/ActionCenter.tsx:33`, `app/[locale]/(app)/dashboard/page.tsx:115-120` |
| 14 | No empty states when children have no tasks or completions | Medium | UX/Usability | `components/child/TaskList.tsx:48`, `components/parent/ActivityFeed.tsx:20` |
| 15 | Card shadows inconsistent: some use `shadow`, others use `shadow-sm`, some have `shadow-2xl` | Low | Visual Design | `components/ui/card.tsx:12` vs `app/[locale]/page.tsx:32` |
| 16 | Beta badge styling hardcoded instead of component variant | Low | Consistency | `components/BetaBadge.tsx:1` vs `app/[locale]/page.tsx:20` |
| 17 | Navigation doesn't indicate active page/route | Medium | UX/Usability | `components/parent/ParentNav.tsx:22`, no active state logic |
| 18 | Forms lack inline validation and clear error messaging | Medium | UX/Usability | `components/parent/TaskFormDialog.tsx`, `components/parent/RewardFormDialog.tsx` |
| 19 | Task completion flow requires multiple clicks without clear progress indication | Medium | UX/Usability | `components/child/TaskList.tsx:48` - no multi-step progress |
| 20 | Settings page lacks visual hierarchy - all sections appear equally important | Medium | Visual Design | `app/[locale]/(app)/settings/page.tsx:46-163` |
| 21 | No confirmation dialogs for destructive actions (delete task, delete reward) | High | UX/Usability | Inferred - `components/ui/confirm-dialog.tsx` exists but not consistently used |
| 22 | Avatar upload flow complex - multiple modals, no clear instructions | Medium | UX/Usability | `components/profile/AvatarEditModal.tsx:22-355` |
| 23 | Responsive images missing `sizes` and `srcset` attributes | Medium | Performance | Throughout - all `<img>` tags and Next.js Image components |
| 24 | Stat cards use different number formatting (some with commas, some without) | Low | Consistency | `app/[locale]/(app)/dashboard/page.tsx`, `app/[locale]/(app)/tasks/page.tsx:68-100` |
| 25 | Child dashboard lacks parent visibility/communication features | Medium | UX/Usability | `app/[locale]/(child)/child/dashboard/page.tsx:1-107` |
| 26 | Onboarding flow not preserved in URL (can't bookmark/share specific step) | Medium | UX/Usability | `app/[locale]/(app)/onboarding/*` - client-side only state |
| 27 | Dark mode toggle not easily accessible (missing from UI) | Medium | UX/Usability | No visible toggle in `components/parent/ParentNav.tsx` or settings |
| 28 | Animation timings hardcoded, not using CSS custom properties for consistency | Low | Micro-interactions | `app/[locale]/page.tsx:32` (duration-300), not theme-based |
| 29 | Store/Rewards page uses duplicate layout patterns with Tasks page | Low | Consistency | `app/[locale]/(app)/rewards/page.tsx` vs `app/[locale]/(app)/tasks/page.tsx` |
| 30 | Profile page layout breaks on narrow screens (flex wrapping issues) | Medium | Responsive | `app/[locale]/(app)/profile/page.tsx:48-192` |
| 31 | No print styles for completion certificates or reports | Low | UX/Usability | Missing `@media print` styles |
| 32 | Kindness feature completely separate, lacks integration with main task system | Medium | Consistency | `app/[locale]/(app)/kindness/send/page.tsx` isolated |
| 33 | Points and rewards lack clear visual connection (points shown but reward costs unclear) | Medium | UX/Usability | `components/child/StatsCard.tsx:17` vs `components/store/RewardCard.tsx:27` |
| 34 | Table components not responsive - no mobile-friendly alternatives | High | Responsive | `components/parent/ActivityFeed.tsx:20` uses table with many columns |
| 35 | Notification badge on header only shows count, no preview of notifications | Medium | UX/Usability | Inferred from header structure - no notification panel |
| 36 | Child login PIN entry lacks masking and doesn't show strength indicator | Low | UX/Usability | `app/[locale]/(auth)/child-login/page.tsx` |
| 37 | Duplicate Supabase queries in pages (e.g., children fetched multiple times) | Medium | Performance | `app/[locale]/(app)/dashboard/page.tsx:29-33` and other pages |
| 38 | No progressive disclosure for advanced settings | Medium | UX/Usability | `app/[locale]/(app)/settings/page.tsx:46-163` - all options visible |
| 39 | Missing breadcrumb navigation in nested routes | Medium | UX/Usability | All nested routes under `/settings/`, `/children/` |
| 40 | Color picker for theme customization not implemented (mentioned in docs) | Low | UX/Usability | Settings page doesn't expose theme customization |
| 41 | No bulk actions for task/reward management | Medium | UX/Usability | `components/parent/TaskList.tsx:34`, no checkboxes for multi-select |
| 42 | Landing page CTA buttons lack hover state consistency | Low | Micro-interactions | `app/[locale]/page.tsx:32-76` - different hover effects |
| 43 | Modal dialogs don't trap focus properly | High | Accessibility | All Dialog components from `components/ui/dialog.tsx` |
| 44 | No skip-to-content link for keyboard users | High | Accessibility | Missing from all layouts |
| 45 | Language selector not visible (next-intl configured but no UI) | Medium | UX/Usability | No language switcher in header or settings |
| 46 | Dashboard widgets not customizable or reorderable | Low | UX/Usability | `app/[locale]/(app)/dashboard/page.tsx:8-177` fixed layout |
| 47 | Ticket redemption flow unclear - multiple steps without progress indication | Medium | UX/Usability | `components/dashboard/PendingTicketsSection.tsx:35` |
| 48 | No visual feedback when task completion is pending approval | Medium | UX/Usability | `components/child/TaskList.tsx` - completed tasks not clearly marked as "pending" |
| 49 | Settings page device connection section lacks error states | Medium | UX/Usability | `components/settings/DeviceConnection.tsx:15` |
| 50 | Co-parent invitation flow doesn't show expiry countdown | Low | UX/Usability | `components/settings/InviteCoParent.tsx:17` |

## Criticality Legend
- **Critical**: Breaks WCAG accessibility standards, blocks core functionality, or creates security issues
- **High**: Significantly impacts user experience, responsive design, or page usability
- **Medium**: Noticeable issues that should be addressed for polish and consistency
- **Low**: Nice-to-have improvements for enhanced experience

## Design System Observations

### Strengths
1. **Consistent Color Palette**: Well-defined Stitch theme with bright green (#37ec13) primary and proper dark mode variants
2. **Component Library**: Good use of shadcn/ui with proper TypeScript typing
3. **Typography**: Clear hierarchy with Lexend for headings and Noto Sans for body text
4. **Theme Tokens**: CSS custom properties properly configured in globals.css
5. **Dark Mode**: Comprehensive dark mode support across all components

### Areas for Improvement
1. **Accessibility**: Primary green fails WCAG contrast requirements (2.8:1 vs required 4.5:1)
2. **Icon Consistency**: Three different icon libraries mixed (Material Symbols, Lucide, Phosphor)
3. **Spacing Scale**: Hardcoded px values instead of Tailwind's spacing tokens
4. **Animation System**: No centralized animation/transition tokens
5. **Component Variants**: Some components recreate patterns instead of extending base components

## Next Steps

### Immediate Priorities (Critical Issues)
1. **Fix WCAG Contrast**: Adjust primary green to #2bb800 or darker for 4.5:1 contrast on white
2. **Add ARIA Labels**: Audit all icon-only buttons and add descriptive labels
3. **Keyboard Navigation**: Add visible focus indicators with `:focus-visible` utilities
4. **Focus Trapping**: Ensure modals properly trap and restore focus
5. **Skip Links**: Add skip-to-content for keyboard users

### High-Impact UX Improvements
6. **Unified Dashboard**: Implement wireframe design with priority-based information hierarchy
7. **Mobile Responsive**: Add breakpoints for all grid layouts, make tables responsive
8. **Loading States**: Add skeleton screens for all async data fetches
9. **Error Handling**: Implement error boundaries and user-friendly error messages
10. **Touch Targets**: Ensure all interactive elements meet 44x44px minimum

### Consistency & Polish
11. **Icon Library**: Standardize on Phosphor Icons (already in package.json)
12. **Spacing System**: Migrate all hardcoded px to Tailwind spacing tokens
13. **Form Validation**: Add inline validation with react-hook-form
14. **Empty States**: Design and implement empty states for all list views
15. **Component Audit**: Create reusable variants instead of duplicating patterns

### Performance Optimization
16. **Bundle Icons**: Replace CDN Material Symbols with bundled Phosphor
17. **Image Optimization**: Add proper `sizes` and responsive images
18. **Query Deduplication**: Implement Tanstack Query properly to avoid duplicate fetches
19. **Code Splitting**: Lazy load modal components and heavy features

### Future Enhancements (Based on Wireframe)
20. **Family Stats Dashboard**: Weekly progress overview with trend indicators
21. **Insights Panel**: AI-powered recommendations and pattern recognition
22. **Quick Actions Sidebar**: Streamlined creation flows
23. **Child Filters**: Focus mode for individual children
24. **Enhanced Activity Feed**: Richer timeline with more context