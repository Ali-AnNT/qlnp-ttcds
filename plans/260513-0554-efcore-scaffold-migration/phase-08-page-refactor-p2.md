---
phase: 8
title: "Page Refactor P2"
status: pending
priority: P1
effort: "3h"
dependencies: ["7"]
---

# Phase 8: Page Refactor P2

## Overview

Refactor: Approval, Summary, Reports, Violations, Config + AppLayout.

## Scope

| Page | Key Changes |
|------|-------------|
| ApprovalPage | Role filter, approve/reject qua API |
| SummaryPage | Aggregate + drill-down dialogs |
| ReportsPage | KPI + charts + CSV export |
| ViolationsPage | Overage calc, period filter |
| ConfigPage | CRUD leave types + approval configs |
| AppLayout | Sidebar/header refactor |

## Related Code Files

| Action | File |
|--------|------|
| Modify | `packages/web/src/pages/ApprovalPage.tsx` |
| Modify | `packages/web/src/pages/SummaryPage.tsx` |
| Modify | `packages/web/src/pages/ReportsPage.tsx` |
| Modify | `packages/web/src/pages/ViolationsPage.tsx` |
| Modify | `packages/web/src/pages/ConfigPage.tsx` |
| Modify | `packages/web/src/components/AppLayout.tsx` |
| Modify | `packages/web/src/components/AppSidebar.tsx` |
| Modify | `packages/web/src/components/AppHeader.tsx` |

## Success Criteria

- [ ] 5 pages + layout từ .NET API
- [ ] Approval 2 cấp hoạt động
- [ ] CSV export UTF-8 BOM
- [ ] Violations tính đúng
- [ ] Config CRUD hoạt động
- [ ] `bun run build` success
