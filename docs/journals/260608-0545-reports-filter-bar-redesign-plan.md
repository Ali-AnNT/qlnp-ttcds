---
title: Reports Filter Bar Redesign Plan
date: 2026-06-08
branch: feat/reports-filter-redesign
plan: plans/260608-0542-reports-filter-bar-redesign/plan.md
---

## What was planned

- **BE:** No changes required. The backend API parameters (`from`, `to`, `status`, `period`) remain clean.
- **FE:**
  - Redesign [reports-filter-bar.tsx](file:///home/vif/qlnp-ttcds/packages/web/src/features/reports/components/reports-filter-bar.tsx) to render dynamic period selectors for Year, Quarter, and Month based on the selected period Type ("Loại").
  - Update [reports-page.tsx](file:///home/vif/qlnp-ttcds/packages/web/src/features/reports/components/reports-page.tsx) to manage a new select-based `FilterState`, calculate dynamic date ranges (using `date-fns` for month/quarter boundaries) on the fly, and map them to API arguments.
- **Verification:** Runs build, linter, and Vitest suite to ensure no regressions.

## Selected Approach

- **Frontend Date Mapping:** Map selected options to exact dates (`from`/`to`) on the client side. This isolates UI state from API request boundaries and preserves database query simplicity.
- **Dynamic Layout:** Hide/show selectors rather than disabling them, optimizing layout screen space and avoiding confusion.
