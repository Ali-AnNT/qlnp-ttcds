---
phase: 2
title: "FE: Reports Page Integration"
status: completed
priority: P1
effort: "1h"
dependencies: [1]
---

# Phase 2: FE: Reports Page Integration

## Overview

Update [reports-page.tsx](file:///home/vif/qlnp-ttcds/packages/web/src/features/reports/components/reports-page.tsx) to manage the new `FilterState` and compute the correct date parameters (`from` and `to`) dynamically to pass to the query hook and Excel export API call.

## Requirements

- **Functional:**
  - Define initial state matching defaults:
    - Type: `year`
    - Year: current year (e.g. `2026`)
    - Quarter: current quarter (calculated from current date: `Math.floor(date.getMonth() / 3) + 1`)
    - Month: current month (calculated: `date.getMonth() + 1`)
    - Status: `undefined`
  - Compute `from` and `to` date boundaries:
    - **Year ($Y$):** `from` = `${Y}-01-01`, `to` = `${Y}-12-31`
    - **Quarter ($Q$ in $Y$):**
      - Q1: `from` = `${Y}-01-01`, `to` = `${Y}-03-31`
      - Q2: `from` = `${Y}-04-01`, `to` = `${Y}-06-30`
      - Q3: `from` = `${Y}-07-01`, `to` = `${Y}-09-30`
      - Q4: `from` = `${Y}-10-01`, `to` = `${Y}-12-31`
    - **Month ($M$ in $Y$):**
      - `from` = first day of the month format `yyyy-MM-dd`
      - `to` = last day of the month format `yyyy-MM-dd`
  - Pass mapped params `{ from, to, status, period: filters.type }` to the statistics hook.
  - Pass mapped params to `reportsApi.exportUrl(params)` for Excel export.
- **Non-functional:**
  - Use `date-fns` for last day of month calculation (e.g. `lastDayOfMonth`).
  - Maintain the loading/error/statistics layout states.

## Implementation Steps

1. In `reports-page.tsx`, import `lastDayOfMonth`, `format`, `parse` if needed from `date-fns`.
2. Implement utility functions to calculate the current quarter and month.
3. Replace the `filters` state from `ReportsFilterParams` to the new `FilterState` structure with default values.
4. Implement a helper to map `FilterState` to `ReportsFilterParams` containing `from`, `to`, `status`, and `period` (type).
5. Pass the computed params to the query hook:
   ```typescript
   const apiParams = mapFiltersToParams(filters);
   const { data, isLoading, isError, error } = useReportsStatistics(apiParams);
   ```
6. In `handleExport`, use the same `apiParams` for export URL generation.
7. Run builds and verify all tests pass.

## Success Criteria

- [x] Filters initialize to current year, quarter, month, and Type = `year`.
- [x] Changing selects correctly triggers data refetch with matching date ranges.
- [x] Export Excel downloads report files matching selected period.
- [x] TypeScript compiles cleanly without errors.
- [x] Linter is happy (0 errors).
- [x] Frontend tests all pass.
