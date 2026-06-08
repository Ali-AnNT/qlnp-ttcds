---
phase: 3
title: "FE: Reports Page Refactor"
status: completed
priority: P1
effort: "1.5h"
dependencies: [2]
---

# Phase 3: FE: Reports Page Refactor

## Overview

Rewrite `reports-page.tsx` to use the new `useReportsStatistics` hook instead of client-side computation. Add a filter bar for date range, status, and period selection. Replace CSV export with backend .xlsx download.

## Requirements

- Functional:
  - Replace 3 API calls + useMemo aggregation with 1 `useReportsStatistics` call
  - Add filter bar: From date, To date, Status dropdown, Period dropdown
  - Filter params drive both statistics display AND .xlsx export
  - Export button downloads .xlsx from backend (not CSV blob)
  - Charts render from `byDept` and `byType` arrays directly
  - Loading and error states displayed
- Non-functional:
  - Follow existing UI patterns (shadcn/ui components, lma- prefix for Tailwind)
  - Responsive layout maintained
  - Date picker uses existing `shared/ui` date picker component if available

## Architecture

```
ReportsPage
  ├── ReportsFilterBar          (NEW)
  │     ├── From: DatePicker
  │     ├── To: DatePicker
  │     ├── Status: Select (All/Pending/Approved/Rejected/Cancelled)
  │     ├── Period: Select (None/Month/Quarter/Year)
  │     └── Export: Button → window.open(exportUrl) or fetch+download
  │
  ├── Stats Cards (3x)
  │     ├── Total Days (approved)
  │     ├── Approval Ratio (%)
  │     └── Rejected Count
  │
  ├── DeptBarChart              (data from byDept[])
  └── TypePieChart              (data from byType[])
```

## Related Code Files

- Modify: `packages/web/src/features/reports/components/reports-page.tsx`
- Create: `packages/web/src/features/reports/components/reports-filter-bar.tsx`
- Modify: `packages/web/src/features/reports/components/dept-bar-chart.tsx`
- Modify: `packages/web/src/features/reports/components/type-pie-chart.tsx`
- Reference: `packages/web/src/shared/ui/` (shadcn components)
- Reference: `packages/web/src/shared/lib/date-utils.ts` (date formatting)

## Implementation Steps

1. **Create `reports-filter-bar.tsx`** — Filter controls component
   - From/To date inputs (HTML date input or shadcn DatePicker)
   - Status select: All (empty) / Chờ duyệt (pending) / Đã duyệt (approved) / Từ chối (rejected) / Đã hủy (cancelled)
   - Period select: Không (none) / Tháng (month) / Quý (quarter) / Năm (year)
   - Export button: calls `reportsApi.exportUrl(filterParams)` and triggers download
   - Props: `filters: ReportsFilterParams`, `onFiltersChange: (filters) => void`, `onExport: () => void`

2. **Rewrite `reports-page.tsx`** — Replace client-side logic with hook
   - Remove: `useReportsData` import, all `useMemo` computations, CSV blob logic
   - Add: `useReportsStatistics(filters)` hook
   - Add: `ReportsFilterBar` with state management
   - Stats cards render from `data.totalDays`, `data.approvedRatio`, `data.rejectedCount`
   - Charts receive `data.byDept` and `data.byType` directly
   - Export handler: build URL with `reportsApi.exportUrl(filters)` → `window.open(url)` with auth token
   - Loading state: show skeleton/spinner while query is loading
   - Error state: show error message if query fails

3. **Update chart components** if prop shape differs:
   - `DeptBarChart`: currently accepts `{ name: string; days: number }[]` — matches `DeptStat` exactly
   - `TypePieChart`: currently accepts `{ name: string; value: number }[]` — matches `TypeStat` exactly
   - Verify no changes needed; adjust if BE response shape differs slightly

4. **Handle .xlsx export with auth token**:
   - Option A: `window.open(exportUrl)` — works if API uses cookie auth or token in query
   - Option B: `fetch` with Authorization header → blob → download — works with Bearer token
   - Current auth uses Bearer token in `Authorization` header → Option B required
   - Implementation:
     ```typescript
     const handleExport = async () => {
       const url = reportsApi.exportUrl(filters);
       const token = getAccessToken();
       const res = await fetch(url, {
         headers: { Authorization: `Bearer ${token}` }
       });
       const blob = await res.blob();
       const a = document.createElement("a");
       a.href = URL.createObjectURL(blob);
       a.download = `bao-cao-nghi-phep.xlsx`;
       a.click();
     };
     ```

5. **Build & verify** — Run `pnpm build` to confirm no compile errors

## Success Criteria

- [x] Reports page fetches data from `/api/reports/statistics` (single call)
- [x] Filter bar renders with date inputs, status select, period select
- [x] Changing filters refetches statistics data
- [x] Stats cards display correct values from API response
- [x] Charts render from `byDept` and `byType` arrays
- [x] Export button downloads .xlsx file (not CSV)
- [x] Export uses same filter params as statistics display
- [x] Loading state shown while data is fetching
- [x] Error state shown if API call fails
- [x] Responsive layout maintained (1 col mobile, 2 col desktop)
- [x] No import from leave-requests, layout, or config features in reports page

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Auth token for file download | Use fetch+Authorization header + blob download (Option B) |
| Date picker component availability | Use HTML date input as fallback; check shared/ui for DatePicker |
| Filter state resets on page reload | Acceptable for v1; could add URL params later |
| Chart data shape mismatch | Verify DeptStat/TypeStat match existing chart prop shapes |