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
| 2026-01-27 | 스크린 타임 백그라운드 멈춤 | 클라이언트 setInterval이 백그라운드에서 중지됨 | 서버 타임스탬프 기반 시간 계산 + 일시정지 기능 | `071_*.sql`, `ScreenTimeTimer.tsx`, `pause/route.ts`, `resume/route.ts` |
| 2026-01-27 | 로그아웃 CORS 에러 | POST 요청에 307 redirect 반환 시 CORS 문제 | JSON 응답 반환 + 클라이언트에서 redirect 처리 | `logout/route.ts`, `child-logout/route.ts`, `LogoutButton.tsx` |
| 2026-01-27 | 벌크 삭제 시 window.confirm 사용 | alert/confirm은 제거하기로 함 | ConfirmDialog 컴포넌트로 대체 | `TaskList.tsx` |
| 2026-01-27 | 타이머 분 입력 삭제 불가 | `parseInt() \|\| 1`로 빈값이 1로 강제 | onBlur에서 최소값 검증, 입력 중 빈값 허용 | `TaskFormDialog.tsx` |
