---
day: 7
title: Page Refactor P1
status: done-verify-pending
priority: P1
effort: 0.5 day
date: 2026-05-13
---

# Day 7: Page Refactor P1

## Context Links

- `packages/web/src/pages/DashboardPage.tsx`
- `packages/web/src/pages/LoginPage.tsx`
- `packages/web/src/pages/LeaveNewPage.tsx`
- `packages/web/src/pages/LeaveMyPage.tsx`
- `packages/web/src/pages/CalendarPage.tsx`

## Overview

Refactor primary user workflows to API-backed data and AuthContext.

## Key Insights

- UI/UX should remain unchanged.
- Business rules must live on API, not frontend.
- P1 pages need real endpoint verification.

## Requirements

- Dashboard uses store/API data.
- Leave create/update/cancel calls API.
- Calendar renders active leave requests.
- Login is SSO waiting/dev entry, not password form.

## Architecture

Pages -> store/API -> backend endpoint. Client-side validation remains UX-only.

## Related Code Files

| Action | File |
|--------|------|
| Modified | `packages/web/src/pages/DashboardPage.tsx` |
| Modified | `packages/web/src/pages/LoginPage.tsx` |
| Modified | `packages/web/src/pages/LeaveNewPage.tsx` |
| Modified | `packages/web/src/pages/LeaveMyPage.tsx` |
| Modified | `packages/web/src/pages/CalendarPage.tsx` |

## Implementation Steps

1. Replace Supabase data reads with store/API calls.
2. Use AuthContext user for current-user UI.
3. Keep form UX validation.
4. Route writes to API modules.
5. Re-test after Days 9-10 endpoints.

## Todo List

- [x] Pages refactored structurally.
- [ ] Verify create leave against real API.
- [ ] Verify cancel/update against real API.
- [ ] Verify calendar status filters.

## Success Criteria

- All P1 pages render without Supabase.
- End-to-end leave creation works after API completion.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Frontend duplicated business rules | Treat client checks as UX only; API is source of truth |

## Security Considerations

- Hide unavailable actions by role, but enforce role on API.

## Next Steps

- Refactor management/reporting pages.
