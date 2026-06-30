---
phase: 1
title: "FE: Reports Filter Bar Redesign"
status: completed
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: FE: Reports Filter Bar Redesign

## Overview

Rewrite [reports-filter-bar.tsx](file:///home/vif/qlnp-ttcds/packages/web/src/features/reports/components/reports-filter-bar.tsx) to support dynamic dropdown selectors for Period Type (year/quarter/month), Year, Quarter, and Month instead of simple start/end dates.

## Requirements

- **Functional:**
  - Dropdown selector for period Type ("Loại") with options: Year ("Theo năm"), Quarter ("Theo quý"), Month ("Theo tháng").
  - Dropdown selector for Year ("Năm") ranging from `currentYear - 5` to `currentYear + 1`.
  - Dropdown selector for Quarter ("Quý") with options: Q1, Q2, Q3, Q4. Shown only when period Type is "Theo quý".
  - Dropdown selector for Month ("Tháng") with options: 1 to 12. Shown only when period Type is "Theo tháng".
  - Dropdown selector for Status ("Trạng thái") remains (Tất cả, Chờ duyệt, Đã duyệt, Từ chối, Đã hủy).
  - Export Button calls the same `onExport` trigger.
- **Props interface:**
  ```typescript
  export interface FilterState {
    type: "year" | "quarter" | "month";
    year: string;
    quarter: string;
    month: string;
    status?: string;
  }

  interface ReportsFilterBarProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    onExport: () => void;
    isExporting?: boolean;
  }
  ```

## Implementation Steps

1. Update `FilterState` and `ReportsFilterBarProps` interfaces in the component file.
2. Build lists of options:
   - Years: current year - 5 to current year + 1.
   - Quarters: Q1 (1), Q2 (2), Q3 (3), Q4 (4).
   - Months: 1 to 12.
3. Update component layout to align elements in a row:
   - Select: period Type (values: `year`, `quarter`, `month`).
   - Select: Year (values: string years).
   - Select: Quarter (values: `1`, `2`, `3`, `4`), conditionally rendered: `filters.type === "quarter"`.
   - Select: Month (values: string months `1` to `12`), conditionally rendered: `filters.type === "month"`.
   - Select: Status (values: `all`, `pending`, `approved`, `rejected`, `cancelled`).
   - Button: Export Excel.
4. Call `onFiltersChange` when any selector changes.

## Success Criteria

- [x] Select options show correct labels in Vietnamese (Theo năm, Theo quý, Theo tháng, Q1..Q4, Tháng 1..12).
- [x] Year select contains current year and historical/future years.
- [x] Quarter selector is shown only when Type is "Theo quý".
- [x] Month selector is shown only when Type is "Theo tháng".
- [x] Status dropdown functions correctly.
- [x] Linter is happy (0 errors).
