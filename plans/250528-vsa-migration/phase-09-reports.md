---
phase: 9
title: "Reports"
status: completed
priority: P2
effort: "30m"
dependencies: [1, 2, 8]
---

# Phase 9: Reports

## Overview

Migrate reports feature (ReportsPage) into `features/reports/`. Director-only page with charts and CSV export for leave statistics.

## Requirements

- Functional: Charts and CSV export work unchanged
- Non-functional: Uses TanStack Query for data fetching

## Architecture

```
features/reports/
├── components/
│   ├── reports-page.tsx      # From src/pages/ReportsPage.tsx (112 lines)
│   ├── dept-bar-chart.tsx    # Extracted bar chart
│   └── type-pie-chart.tsx    # Extracted pie chart
└── index.ts
```

## Related Code Files

- Move: `src/pages/ReportsPage.tsx` → `features/reports/components/reports-page.tsx`
- Create: Extracted components, `index.ts`

## Implementation Steps

1. Create directory:
   ```bash
   mkdir -p src/features/reports/components
   ```

2. Move ReportsPage:
   ```bash
   mv src/pages/ReportsPage.tsx src/features/reports/components/reports-page.tsx
   ```

3. Extract sub-components from ReportsPage (112 lines):
   - `dept-bar-chart.tsx`: Department bar chart
   - `type-pie-chart.tsx`: Leave type pie chart

4. Update imports:
   - `@/store/useStore` → TanStack Query hooks
   - `@/contexts/AuthContext` → `@/features/auth`
   - `@/api/*` → appropriate feature APIs
   - `@/components/ui/*` → `@/shared/ui/*`

5. Create barrel export:
   ```typescript
   // features/reports/index.ts
   export { ReportsPage } from './components/reports-page';
   ```

6. Update `app/router.tsx` imports

7. Delete old file

8. Build and verify: `bun run build`

## Success Criteria

- [x] Reports feature self-contained in `features/reports/`
- [x] Charts extracted into separate components (dept-bar-chart, type-pie-chart)
- [x] CSV export logic preserved
- [x] No Zustand store usage — replaced with TanStack Query via useReportsData hook
- [x] `bun run build` passes
