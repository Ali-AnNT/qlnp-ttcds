---
title: "Reports Filter Bar Redesign"
description: >-
  Redesign the period filter on the reports page to support dynamic selections
  for Year, Quarter, and Month with dynamic UI showing/hiding relevant filters.
status: completed
priority: P2
branch: feat/reports-filter-redesign
tags:
  - reports
  - frontend-refactor
  - ui-ux
blockedBy: []
blocks: []
created: '2026-06-08T05:42:25.000Z'
createdBy: 'ck:brainstorm'
source: skill
---

# Reports Filter Bar Redesign

## Overview

This plan details the redesign of the reports page filters. The current filter bar exposes simple date inputs. The new design allows the user to select the period Type ("Theo năm", "Theo quý", "Theo tháng"). Based on this selection, it dynamically renders the appropriate selectors (Year dropdown, Quarter dropdown, or Month dropdown) and maps them to `from`/`to` date query parameters for the API call and Excel export.

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [FE: Reports Filter Bar Redesign](./phase-01-fe-reports-filter-bar-redesign.md) | Completed | 1h |
| 2 | [FE: Reports Page Integration](./phase-02-fe-reports-page-integration.md) | Completed | 1h |

## Architecture

```
ReportsPage
  ├── State: type ("year"|"quarter"|"month"), year, quarter, month, status
  ├── Compute: from (yyyy-MM-dd), to (yyyy-MM-dd) mapped from state
  ├── useReportsStatistics({ from, to, status, period: type })
  │
  ▼
ReportsFilterBar
  ├── Dropdown: Loại (Year, Quarter, Month)
  ├── Dropdown: Năm (currentYear - 5 to currentYear + 1)
  ├── Dropdown: Quý (Q1..Q4) [Shown only when Type = Quarter]
  ├── Dropdown: Tháng (1..12) [Shown only when Type = Month]
  ├── Dropdown: Trạng thái (Tất cả, Chờ duyệt, Đã duyệt, Từ chối, Đã hủy)
  └── Button: Xuất Excel (calls handleExport using computed dates)
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State structure | Store raw select values, compute dates on the fly | Simplifies state updates in the UI and keeps dates in sync with selects |
| Date boundary mapping | Use date-fns to format quarter and month bounds | Robust and simple month/quarter start/end calculations |
| Year range | currentYear - 5 to currentYear + 1 | Covers historical data and future projections safely |

## Files Impact

### FE (modify)
| File | Action | Description |
|------|--------|-------------|
| `features/reports/components/reports-filter-bar.tsx` | REWRITE | Implement the Year/Quarter/Month select controls and dynamic visibility |
| `features/reports/components/reports-page.tsx` | MODIFY | Update filters state structure, defaults, and API date parameters mapper |

---

## Related Code Files
- [reports-filter-bar.tsx](file:///home/vif/qlnp-ttcds/packages/web/src/features/reports/components/reports-filter-bar.tsx)
- [reports-page.tsx](file:///home/vif/qlnp-ttcds/packages/web/src/features/reports/components/reports-page.tsx)
