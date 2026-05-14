---
day: 8
title: Page Refactor P2
status: done-verify-pending
priority: P1
effort: 0.5 day
date: 2026-05-13
---

# Day 8: Page Refactor P2

## Context Links

- `packages/web/src/pages/ApprovalPage.tsx`
- `packages/web/src/pages/SummaryPage.tsx`
- `packages/web/src/pages/ReportsPage.tsx`
- `packages/web/src/pages/ViolationsPage.tsx`
- `packages/web/src/pages/ConfigPage.tsx`
- `packages/web/src/pages/AppLayout.tsx`

## Overview

Refactor approval, reporting, violation, config, and layout surfaces to API/AuthContext.

## Key Insights

- Server must filter approval/report data by role.
- Config writes are QTHT-only.
- Reporting correctness depends on approved-status semantics.

## Requirements

- Approval page calls approve/reject endpoints.
- Summary/reports/violations use API-backed leave data.
- Config page uses config API.
- Sidebar/header use AuthContext user.

## Architecture

Management pages -> API modules -> role-aware endpoints.

## Related Code Files

| Action | File |
|--------|------|
| Modified | `packages/web/src/pages/ApprovalPage.tsx` |
| Modified | `packages/web/src/pages/SummaryPage.tsx` |
| Modified | `packages/web/src/pages/ReportsPage.tsx` |
| Modified | `packages/web/src/pages/ViolationsPage.tsx` |
| Modified | `packages/web/src/pages/ConfigPage.tsx` |
| Modified | `packages/web/src/components/AppSidebar.tsx` |
| Modified | `packages/web/src/components/AppHeader.tsx` |

## Implementation Steps

1. Replace store/Supabase dependencies with API-backed store data.
2. Use AuthContext for role display/navigation.
3. Keep CSV export client-side unless backend export is added later.
4. Verify role-specific views after endpoint work.

## Todo List

- [x] Pages refactored structurally.
- [ ] Verify approval state transitions with real API.
- [ ] Verify config writes with QTHT only.
- [ ] Verify report/violation calculations.

## Success Criteria

- Approval and config flows work against real API.
- Reports use approved requests only.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Role filtering inconsistent | Centralize filtering in backend endpoints |

## Security Considerations

- API must reject unauthorized approval/config writes.

## Next Steps

- Implement backend endpoint P1.
