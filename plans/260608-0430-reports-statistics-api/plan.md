---
title: "Reports Statistics API — Move Logic to BE"
description: >-
  Move report statistics computation from client-side to a new BE endpoint.
  Add GET /api/reports/statistics with filter params (from, to, status, period).
  Replace CSV client-side export with backend .xlsx download.
  Add filter bar UI for date range, status, and period selection.
status: completed
priority: P2
branch: feat/aspose-cells-smart-markers-export
tags:
  - reports
  - statistics-api
  - backend
  - frontend-refactor
blockedBy: []
blocks: []
created: '2026-06-08T04:36:40.193Z'
createdBy: 'ck:plan'
source: skill
---

# Reports Statistics API — Move Logic to BE

## Overview

Current reports page (`thong-ke-bao-cao`) computes all statistics client-side: 3 API calls → fetch ALL data → useMemo aggregation → Recharts display. This is inefficient, doesn't scale, and the "Xuất Excel" button creates a CSV blob instead of calling the existing backend .xlsx endpoint.

**Solution**: New `GET /api/reports/statistics` endpoint handles all computation server-side. FE calls 1 API with filter params and renders directly. Export button calls existing `GET /api/reports/export` for .xlsx download.

**Reference**: [Brainstorm Report](../../reports/brainstorm-260608-0430-reports-statistics-api-design.md)

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 1 | [BE: Statistics Endpoint](./phase-01-be-statistics-endpoint.md) | Completed | 2h |
| 2 | [FE: API Layer and Hook](./phase-02-fe-api-layer-and-hook.md) | Completed | 30min |
| 3 | [FE: Reports Page Refactor](./phase-03-fe-reports-page-refactor.md) | Completed | 1.5h |
| 4 | [FE: Cleanup Old Dependencies](./phase-04-fe-cleanup-old-dependencies.md) | Completed | 30min |

## Dependencies

- Phase 2 depends on Phase 1 (API must exist before hook can call it)
- Phase 3 depends on Phase 2 (hook must exist before page can use it)
- Phase 4 depends on Phase 3 (page must stop using old deps before removing them)

## Architecture

```
FE (reports-page.tsx)
  │ useReportsStatistics({ from, to, status, period })
  │   → GET /api/reports/statistics?from=...&to=...&status=...&period=...
  │
  ▼
StatisticsEndpoint (BE)
  │ Query LeaveRequests with EF filters (status, from, to)
  │ LeaveRequestUserLookup.LoadUserInfoBatchAsync → user/dept names
  │ StatisticsMapper.Compute() → StatisticsResponse
  │
  ▼
StatisticsResponse JSON:
  { totalDays, approvedRatio, rejectedCount, pendingCount, cancelledCount,
    byDept[], byType[], byPeriod? }

─── Export ───

FE (reports-page.tsx)
  │ window.open(GET /api/reports/export?from=...&to=...&status=...&period=...)
  │
  ▼
ExportReportEndpoint (existing, unchanged)
  │ → .xlsx file download
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Endpoint approach | Separate statistics endpoint | SRP: JSON stats vs file stream have different contracts |
| Filter params | Same as export endpoint (from, to, status, period) | DRY: shared UX, consistent data between stats & export |
| byPeriod | Only computed when period != "none" | YAGNI: don't compute when not requested |
| User/dept lookup | Reuse LeaveRequestUserLookup | DRY: same batch loading pattern as export endpoint |
| Period grouping | Reuse ExportDataMapper.GetPeriodKey pattern | DRY: same month/quarter/year logic |
| Role access | Director only | Consistent with export endpoint |
| FE state | TanStack Query with queryKey including params | Standard pattern, auto-caching, refetch on filter change |

## Files Impact

### BE (new)
| File | Action | Description |
|------|--------|-------------|
| `Features/Reports/Statistics/StatisticsRequest.cs` | CREATE | Query params: from, to, status, period |
| `Features/Reports/Statistics/StatisticsResponse.cs` | CREATE | DTO: stats + byDept + byType + byPeriod |
| `Features/Reports/Statistics/StatisticsMapper.cs` | CREATE | Compute statistics from LeaveRequests |
| `Features/Reports/Statistics/StatisticsValidator.cs` | CREATE | Validate params (same rules as export) |
| `Features/Reports/Statistics/StatisticsEndpoint.cs` | CREATE | GET /api/reports/statistics, Role: Director |

### BE (no changes)
| File | Action |
|------|--------|
| `Features/Reports/Export/*` | NO CHANGE |
| `Features/LeaveRequests/LeaveRequestUserLookup.cs` | NO CHANGE |

### FE (modify)
| File | Action | Description |
|------|--------|-------------|
| `features/reports/api/reports.api.ts` | REWRITE | New: statistics() + exportUrl(), remove re-exports |
| `features/reports/hooks/use-reports-statistics.ts` | CREATE | TanStack Query hook with filter params |
| `features/reports/components/reports-page.tsx` | REWRITE | Add filter bar, use new hook, replace CSV export |
| `features/reports/components/reports-filter-bar.tsx` | CREATE | Filter UI: date range, status, period |
| `features/reports/components/dept-bar-chart.tsx` | MODIFY | Adjust data shape prop if needed |
| `features/reports/components/type-pie-chart.tsx` | MODIFY | Adjust data shape prop if needed |
| `features/reports/index.ts` | MODIFY | Update exports |

### FE (remove)
| File | Action |
|------|--------|
| `features/reports/hooks/use-reports-data.ts` | DELETE |
| `features/reports/api/reports.api.ts` old re-exports | REMOVE |

## Cross-Plan Relationship

- **Depends on**: `260608-0332-aspose-cells-smart-markers-export` (export endpoint must work for .xlsx download)
- **Blocks**: None