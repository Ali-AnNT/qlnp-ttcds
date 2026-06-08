---
title: Reports Filter Bar Redesign — Dynamic Period Selection
date: 2026-06-08
branch: feat/reports-filter-redesign
plan: plans/260608-0542-reports-filter-bar-redesign/plan.md
---

## What changed

- **FE:**
  - Rewrote `reports-filter-bar.tsx` to support dynamic period selectors. Exposes a `Loại` (Type) select (Year, Quarter, Month). Conditionally renders Quarter select (Q1-Q4) when type is "quarter" and Month select (1-12) when type is "month". Renders Year select (from currentYear - 5 to currentYear + 1) and Status select (Tất cả, Chờ duyệt, Đã duyệt, Từ chối, Đã hủy).
  - Modified `reports-page.tsx` to store selector-based `FilterState` (initialized to current date values) and mapped it to date ranges (`from` and `to`) on the fly using `date-fns/lastDayOfMonth` helper. Pass mapped arguments to both the statistics query hook and Excel export API call.
  - Strict preservation of the project's styling conventions (prefix `lma-` for all Tailwind CSS classes).

## Wins

- **Improved UX:** User can now naturally select Year, Quarter, or Month rather than manually entering date bounds using pickers, with appropriate dropdown filters appearing dynamically.
- **Client-Side Calculation isolation:** Clean mapping between simple select dropdowns and date-based database queries keeps API signature clean and stable.
- **Zero Errors:** Production build, linter, and all unit/integration tests run successfully with zero errors.

## Trade-offs accepted

- None.

## Reviewer findings (all resolved)

- **L (resolved):** UTC timezone format handled correctly through local client date initialization.

## Verification

- **FE:** `pnpm build` → success
- **FE:** `pnpm lint` → 0 errors, 14 warnings (pre-existing)
- **FE:** `pnpm test --run` → 40/40 tests passed

## Files

```
MOD  packages/web/src/features/reports/components/reports-filter-bar.tsx
MOD  packages/web/src/features/reports/components/reports-page.tsx
```
