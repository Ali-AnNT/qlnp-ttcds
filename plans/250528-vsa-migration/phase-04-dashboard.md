---
phase: 4
title: "Dashboard"
status: pending
priority: P2
effort: "30m"
dependencies: [1, 2, 3]
---

# Phase 4: Dashboard

## Overview

Migrate dashboard feature (DashboardPage, LeaveBalanceCard, LeaveHistory) into `features/dashboard/`. Dashboard shows user metrics and recent leave activity.

## Requirements

- Functional: Dashboard metrics, balance cards, recent requests list all work unchanged
- Non-functional: Dashboard uses TanStack Query for server state instead of global Zustand store

## Architecture

```
features/dashboard/
├── components/
│   ├── dashboard-page.tsx      # From src/pages/DashboardPage.tsx (205 lines)
│   ├── leave-balance-card.tsx  # From src/components/LeaveBalanceCard.tsx
│   └── recent-requests-list.tsx # Extracted from DashboardPage
├── hooks/
│   ├── use-dashboard-stats.ts  # Data fetching logic from store usage
│   └── use-recent-requests.ts  # Recent requests query
└── index.ts
```

## Related Code Files

- Move: `src/pages/DashboardPage.tsx` → `features/dashboard/components/dashboard-page.tsx`
- Move: `src/components/LeaveBalanceCard.tsx` → `features/dashboard/components/leave-balance-card.tsx`
- Evaluate: `src/components/LeaveHistory.tsx` — appears unused, verify then delete
- Create: hooks for data fetching, `index.ts`

## Implementation Steps

1. Create directory:
   ```bash
   mkdir -p src/features/dashboard/{components,hooks}
   ```

2. Move dashboard page:
   ```bash
   mv src/pages/DashboardPage.tsx src/features/dashboard/components/dashboard-page.tsx
   ```

3. Move LeaveBalanceCard:
   ```bash
   mv src/components/LeaveBalanceCard.tsx src/features/dashboard/components/leave-balance-card.tsx
   ```

4. Check LeaveHistory usage — if unused, delete `src/components/LeaveHistory.tsx`

5. Extract data fetching hooks from DashboardPage:
   - `use-dashboard-stats.ts`: Wraps leave balances and stats queries
   - `use-recent-requests.ts`: Fetches recent leave requests
   - Replace Zustand `useStore` selectors with TanStack Query hooks

6. Update imports in dashboard components:
   - `@/contexts/AuthContext` → `@/features/auth`
   - `@/store/useStore` → local hooks
   - `@/components/ui/*` → `@/shared/ui/*`
   - `@/lib/*` → `@/shared/lib/*` or `@/features/shared-reference-data`

7. Create barrel export:
   ```typescript
   // features/dashboard/index.ts
   export { DashboardPage } from './components/dashboard-page';
   export { LeaveBalanceCard } from './components/leave-balance-card';
   ```

8. Update `app/router.tsx` to import DashboardPage from features

9. Delete old files

10. Build and verify: `bun run build`

## Success Criteria

- [ ] Dashboard feature self-contained in `features/dashboard/`
- [ ] Dashboard renders correctly with user metrics
- [ ] Balance cards display correct data
- [ ] No Zustand store usage in dashboard (replaced with hooks)
- [ ] `bun run build` passes

## Risk Assessment

- **Store decoupling**: Dashboard currently uses `useStore` for leaveRequests, leaveBalances. Must replace with direct API calls or TanStack Query hooks.
- **LeaveHistory**: Verify it's unused before deleting.
