# Brainstorm: Reports Statistics API — Move Logic to BE

**Date:** 2026-06-08
**Branch:** feat/aspose-cells-smart-markers-export
**Decision:** Approach A — Separate statistics endpoint + shared mapper pattern

---

## Problem

Current reports page (`thong-ke-bao-cao`) computes ALL statistics client-side:

1. **3 API calls**: fetch ALL leave requests, ALL departments, ALL leave types
2. **Client-side aggregation**: useMemo filters, groups, reduces — O(n×m) joins
3. **No filtering**: loads everything regardless of date/status
4. **CSV export**: "Xuất Excel" button creates CSV blob client-side, ignoring backend .xlsx endpoint
5. **No pagination**: will break as data grows

Backend already has `GET /api/reports/export` (Aspose.Cells Smart Markers) but UI never calls it.

---

## Solution: `GET /api/reports/statistics`

### BE — New endpoint

```
Features/Reports/Statistics/
├── StatisticsRequest.cs        — query params: from, to, status, period
├── StatisticsResponse.cs       — DTO response
├── StatisticsMapper.cs         — compute stats from LeaveRequests
├── StatisticsValidator.cs      — validate params (reuse ExportReportValidator pattern)
└── StatisticsEndpoint.cs       — GET /api/reports/statistics, Role: Director
```

#### Request params (same as export endpoint)

| Param    | Type       | Default  | Values                              |
|----------|------------|----------|--------------------------------------|
| `from`   | DateOnly?  | null     | Filter startDate >= from              |
| `to`     | DateOnly?  | null     | Filter endDate <= to                |
| `status`  | string?    | null     | pending/approved/rejected/cancelled  |
| `period` | string     | "none"   | none/month/quarter/year              |

#### Response shape (`Result<StatisticsResponse>`)

```json
{
  "success": true,
  "data": {
    "totalDays": 45.0,
    "approvedRatio": 75,
    "rejectedCount": 5,
    "pendingCount": 10,
    "cancelledCount": 2,
    "byDept": [
      { "name": "Phòng Kế toán", "days": 15.0 },
      { "name": "Phòng Nhân sự", "days": 30.0 }
    ],
    "byType": [
      { "name": "Nghỉ phép năm", "value": 30.0 },
      { "name": "Nghỉ ốm", "value": 15.0 }
    ],
    "byPeriod": [
      { "period": "2026-01", "totalDays": 10.0, "employeeCount": 5 }
    ]
  }
}
```

- `byPeriod` is `null` when `period = "none"`, populated otherwise
- `byDept` and `byType` always based on approved requests (matching current UI logic)
- `totalDays`, `approvedRatio`, `rejectedCount` always computed from ALL statuses for overview cards
- Status counts (`pendingCount`, `cancelledCount`) added for future use (currently unused in UI but trivial to compute)

#### StatisticsMapper logic

Reuses same patterns as `ExportDataMapper`:

1. Query `LeaveRequests` with EF filters (status, from, to) — same as export endpoint
2. `LeaveRequestUserLookup.LoadUserInfoBatchAsync` for user/dept names — same as export endpoint
3. Compute: totalDays (approved), approvedRatio, status counts
4. Group by department → `byDept[]`
5. Group by leave type → `byType[]`
6. Group by period (if requested) → `byPeriod[]`
7. Return `StatisticsResponse`

### BE — Export endpoint (existing, no changes needed)

`GET /api/reports/export` stays as-is. FE will now call it for .xlsx download.

### FE — Changes

| Before | After |
|--------|-------|
| `useReportsData()` — 3 API calls + client compute | `useReportsStatistics()` — 1 API call |
| `reports.api.ts` — re-exports from other features | `reports.api.ts` — own `statistics()` + `exportUrl()` |
| `reports-page.tsx` — useMemo heavy computation | `reports-page.tsx` — direct render from API response |
| CSV blob export | `window.open(exportUrl)` or fetch+download .xlsx |
| No filter UI | Filter bar: date range, status, period selector |

#### New `useReportsStatistics` hook

```typescript
function useReportsStatistics(params: {
  from?: string;
  to?: string;
  status?: string;
  period?: string;
}) {
  return useQuery({
    queryKey: ["reports-statistics", params],
    queryFn: async () => {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v != null) as [string, string][]
      ).toString();
      return reportsApi.statistics(qs);
    },
  });
}
```

#### New `reports.api.ts`

```typescript
export const reportsApi = {
  statistics: (qs: string) => api.get<StatisticsResponse>(`/reports/statistics?${qs}`),
  exportUrl: (qs: string) => `${API_URL}/reports/export?${qs}`,  // for direct download
};
```

#### Filter bar in `reports-page.tsx`

- Date range: From/To date pickers
- Status: Select dropdown (All / Pending / Approved / Rejected / Cancelled)
- Period: Select dropdown (None / Month / Quarter / Year)
- When filters change → refetch statistics with new params
- Export button passes same filters to export endpoint

#### Remove from reports module

- Dependency on `leave-requests`, `layout`, `config` API modules
- `useReportsData` hook (replaced by `useReportsStatistics`)
- CSV blob logic in `handleExport`
- Client-side useMemo computations

### Files to modify/create

**BE (new):**
- `Features/Reports/Statistics/StatisticsRequest.cs`
- `Features/Reports/Statistics/StatisticsResponse.cs`
- `Features/Reports/Statistics/StatisticsMapper.cs`
- `Features/Reports/Statistics/StatisticsValidator.cs`
- `Features/Reports/Statistics/StatisticsEndpoint.cs`

**BE (no changes):**
- `Features/Reports/Export/*` — unchanged

**FE (modify):**
- `features/reports/hooks/use-reports-data.ts` → rename/replace with `use-reports-statistics.ts`
- `features/reports/api/reports.api.ts` → new content (statistics + exportUrl)
- `features/reports/components/reports-page.tsx` → add filter bar, use new hook, replace CSV export
- `features/reports/components/dept-bar-chart.tsx` → minor: adjust data shape if needed
- `features/reports/components/type-pie-chart.tsx` → minor: adjust data shape if needed
- `features/reports/index.ts` → update exports

**FE (remove dependency):**
- No longer import from `@/features/leave-requests`, `@/features/layout`, `@/features/config`

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Separate endpoint, not merged with export | SRP: JSON statistics vs file stream have different contracts |
| Same filter params as export | DRY: shared UX, consistent data between stats & export |
| `byPeriod` only when period != "none" | YAGNI: don't compute when not requested |
| Reuse `LeaveRequestUserLookup` | DRY: same user info batch loading as export |
| Status counts for all statuses | Future-proof: trivial to compute, useful for expanding cards |
| Director role only | Consistent with export endpoint access control |

## Risks

| Risk | Mitigation |
|------|-----------|
| Statistics & export data inconsistency | Same EF query base + same mapper patterns; integration test covers both |
| Large dataset performance | Server-side filter (from/to/status) limits query scope; pagination not needed yet |
| New API call adds latency | Single call replaces 3 calls; TanStack Query caches; network latency actually decreases |

---

## Unresolved Questions

None — all decisions confirmed.