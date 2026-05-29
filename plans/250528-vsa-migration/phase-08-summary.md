---
phase: 8
title: "Summary"
status: pending
priority: P2
effort: "45m"
dependencies: [1, 2, 5, 7]
---

# Phase 8: Summary

## Overview

Migrate summary feature (SummaryPage) into `features/summary/`. Director-only page showing department leave summary with pie charts. Depends on leave-requests for data and calendar for similar patterns.

## Requirements

- Functional: Department summary table, pie chart by leave type all work unchanged
- Non-functional: Uses TanStack Query for data fetching

## Architecture

```
features/summary/
├── components/
│   ├── summary-page.tsx        # From src/pages/SummaryPage.tsx (328 lines)
│   ├── dept-summary-table.tsx  # Extracted department table
│   └── type-pie-chart.tsx      # Extracted pie chart
├── hooks/
│   └── use-dept-summary.ts     # TanStack Query for summary data
└── index.ts
```

## Related Code Files

- Move: `src/pages/SummaryPage.tsx` → `features/summary/components/summary-page.tsx`
- Create: Extracted components, hook, `index.ts`

## Implementation Steps

1. Create directory:
   ```bash
   mkdir -p src/features/summary/{components,hooks}
   ```

2. Move SummaryPage:
   ```bash
   mv src/pages/SummaryPage.tsx src/features/summary/components/summary-page.tsx
   ```

3. Extract sub-components from SummaryPage (328 lines):
   - `dept-summary-table.tsx`: Department summary table with aggregation
   - `type-pie-chart.tsx`: Pie chart by leave type (recharts)

4. Create `use-dept-summary.ts` hook for data fetching

5. Update imports:
   - `@/store/useStore` → local hooks
   - `@/contexts/AuthContext` → `@/features/auth`
   - `@/api/*` → `@/features/leave-requests` for leave-request types, `@/features/config` for LeaveTypeDto
   - `@/components/ui/*` → `@/shared/ui/*`
   - `@/lib/*` → `@/shared/lib/*`

6. Create barrel export:
   ```typescript
   // features/summary/index.ts
   export { SummaryPage } from './components/summary-page';
   ```

7. Update `app/router.tsx` imports

8. Delete old file

9. Build and verify: `bun run build`

## Success Criteria

- [ ] Summary feature self-contained in `features/summary/`
- [ ] Department summary table renders with correct data
- [ ] Pie chart by leave type works
- [ ] No Zustand store usage
- [ ] `bun run build` passes

## Risk Assessment

- **Recharts**: Summary uses recharts for pie charts. Ensure recharts imports resolve correctly.
- **Data aggregation**: Summary may aggregate data from multiple sources — ensure data fetching hook handles this.
