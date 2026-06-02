---
phase: 10
title: "Violations"
status: completed
priority: P2
effort: "1h"
dependencies: [1, 2, 9]
---

# Phase 10: Violations

## Overview

Migrate violations feature (ViolationsPage) into `features/violations/`. Director-only page tracking over-limit users and departments. This is the largest page at 439 lines — requires significant component extraction.

## Requirements

- Functional: Violation metrics, department table, employee table, charts, detail dialogs all work
- Non-functional: Well-decomposed into focused components under 200 lines each

## Architecture

```
features/violations/
├── api/
│   └── types.ts               # Violation-specific types
├── components/
│   ├── violations-page.tsx     # From src/pages/ViolationsPage.tsx (439 lines → thin shell)
│   ├── violation-metrics.tsx   # Summary metrics cards
│   ├── violation-dept-table.tsx # Department violations table
│   ├── violation-emp-table.tsx  # Employee violations table
│   ├── violation-chart.tsx      # Charts (bar/pie)
│   ├── emp-detail-dialog.tsx    # Employee detail dialog
│   └── dept-detail-dialog.tsx   # Department detail dialog
├── hooks/
│   ├── use-employee-violations.ts  # TanStack Query for employee data
│   └── use-department-violations.ts # TanStack Query for department data
└── index.ts
```

## Related Code Files

- Move: `src/pages/ViolationsPage.tsx` → `features/violations/components/violations-page.tsx`
- Create: Extracted components (6), hooks (2), types, `index.ts`

## Implementation Steps

1. Create directory:
   ```bash
   mkdir -p src/features/violations/{api,components,hooks}
   ```

2. Move ViolationsPage:
   ```bash
   mv src/pages/ViolationsPage.tsx src/features/violations/components/violations-page.tsx
   ```

3. Extract violation types into `api/types.ts`

4. Extract sub-components from ViolationsPage (439 lines → 7 files):
   - `violation-metrics.tsx`: Top-level metric cards
   - `violation-dept-table.tsx`: Department-level violations
   - `violation-emp-table.tsx`: Employee-level violations
   - `violation-chart.tsx`: Charts section
   - `emp-detail-dialog.tsx`: Employee drill-down dialog
   - `dept-detail-dialog.tsx`: Department drill-down dialog

5. Create TanStack Query hooks:
   - `use-employee-violations.ts`: Employee violation data
   - `use-department-violations.ts`: Department violation data

6. Rewrite violations-page.tsx as thin shell composing extracted components

7. Update imports:
   - `@/store/useStore` → local hooks
   - `@/contexts/AuthContext` → `@/features/auth`
   - `@/api/*` → appropriate feature APIs
   - `@/components/ui/*` → `@/shared/ui/*`

8. Create barrel export:
   ```typescript
   // features/violations/index.ts
   export { ViolationsPage } from './components/violations-page';
   ```

9. Update `app/router.tsx` imports

10. Delete old file

11. Build and verify: `bun run build`

## Success Criteria

- [x] Violations feature self-contained in `features/violations/`
- [x] All 7 components render correctly
- [x] Metrics, tables, charts, dialogs all functional
- [x] Each component file under 200 lines
- [x] No Zustand store usage
- [x] `bun run build` passes

## Risk Assessment

- **High complexity**: 439 lines split into 7 components requires careful extraction.
- **Shared chart patterns**: Recharts usage may overlap with summary/reports. If pattern repeats in 3+ features, extract to shared.
- **Mitigation**: Extract one component at a time, build after each.
