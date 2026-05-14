---
phase: 7
title: "Page Refactor P1"
status: completed
priority: P1
effort: "3h"
dependencies: ["6"]
---

# Phase 7: Page Refactor P1

## Overview

Refactor 5 pages: Dashboard, Login, LeaveNew, LeaveMy, Calendar. Thay Supabase → API calls, giữ UI.

## Scope

| Page | Key Changes |
|------|-------------|
| DashboardPage | KPI cards từ API |
| LoginPage | Redirect SSO, không form |
| LeaveNewPage | POST API + overlap check |
| LeaveMyPage | API list + edit/cancel |
| CalendarPage | API data + dept filter |

## Related Code Files

| Action | File |
|--------|------|
| Modify | `packages/web/src/pages/DashboardPage.tsx` |
| Modify | `packages/web/src/pages/LoginPage.tsx` |
| Modify | `packages/web/src/pages/LeaveNewPage.tsx` |
| Modify | `packages/web/src/pages/LeaveMyPage.tsx` |
| Modify | `packages/web/src/pages/CalendarPage.tsx` |

## Implementation Steps

1. Mỗi page: import API module, remove supabase import
2. `useEffect` → API call
3. Form handlers → API POST/PUT + toast
4. Verify UI không thay đổi

## Success Criteria

- [ ] 5 pages load từ .NET API
- [ ] Form submit/edit/cancel hoạt động
- [ ] UI giữ nguyên
- [ ] `bun run build` success
