# Issue Tracking

버그 수정 기록. `/log-issue` 스킬로 추가.

| 날짜 | 이슈 | 원인 | 수정 | 관련 파일 |
|------|------|------|------|----------|
| 2026-01-22 | v_child_goals 권한 에러 | service_role GRANT 누락 | 063 migration | `supabase/migrations/063_*` |
| 2026-01-22 | 태스크 타임존 버그 | UTC 비교 오류 | 뷰 + API 수정 | `064_*.sql`, `tasks/complete/route.ts` |
| 2026-01-22 | approve_ticket_use 500 에러 | approved_by 컬럼 없음 | fulfilled_by 사용 | `065_*.sql` |
| 2026-01-22 | ticket cancel 400 에러 | 'active' 상태 미허용 | API 수정 | `rewards/cancel/route.ts` |
| 2026-01-22 | cancel 후 UI 미갱신 | optimistic update 누락 | onCancel 콜백 추가 | `TicketCard.tsx`, `TicketsClientPage.tsx` |
| 2026-01-22 | 태스크 타이머 새로고침 시 리셋 | task.metadata에 timer_state 저장 시 Zod 스키마가 strip, 아이별 분리 안됨 | child_task_overrides에 per-child timer_state 저장 | `068_*.sql`, `TaskCard.tsx`, `timer-state/route.ts` |
