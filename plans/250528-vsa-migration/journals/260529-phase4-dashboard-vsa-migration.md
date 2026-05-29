# Phase 4: Dashboard VSA Migration

**Date**: 2026-05-29 06:30
**Severity**: Medium
**Component**: packages/web -- features/dashboard
**Status**: Resolved

## What Happened

Completed Phase 4 of the 12-phase VSA migration. Dashboard feature moved from scattered layered architecture into a self-contained `src/features/dashboard/` slice. Replaced 4 Zustand store selectors (`leaveRequests`, `leaveTypes`, `leaveBalances`, `loadData`) with 2 TanStack Query hooks (`useDashboardStats`, `useRecentRequests`). Deleted `LeaveHistory.tsx` (unused stub, zero importers). Created `dashboard.api.ts` barrel that re-exports from existing API modules rather than duplicating types. Updated router import. Build passes clean.

## The Brutal Truth

This was the first phase where Zustand decoupling was the real challenge -- not file moves. DashboardPage consumed `useStore` for four data domains (`leaveRequests`, `leaveBalances`, `leaveTypes`, plus `loadData()` in a useEffect). Every piece of dashboard data was funneled through one global store. Pulling that apart without breaking the UI required understanding exactly what data shapes the dashboard rendered and rebuilding them as independent query caches.

The `leaveBalancesApi.my()` vs `list()` decision was the moment that mattered. The old store called `list()` and then the component filtered client-side with `b.userId === user?.userId`. That means every staff dashboard was loading the entire company's leave balances and throwing away 99% of the response. Switching to `my()` for staff users is a genuine API efficiency win, not just a refactor -- it changed the network request shape.

LeaveHistory.tsx was a dead stub. Zero importers. Easy delete, but it highlights the real value of VSA migration: you are forced to trace every import of every file you touch, and dead code surfaces immediately.

## Technical Details

**Files created (6):**
- `features/dashboard/components/dashboard-page.tsx` -- moved from `src/pages/DashboardPage.tsx`, all store selectors replaced
- `features/dashboard/components/leave-balance-card.tsx` -- moved from `src/components/LeaveBalanceCard.tsx`
- `features/dashboard/hooks/use-dashboard-stats.ts` -- TanStack Query hook combining 3 parallel queries (leaveBalances, leaveTypes, approvalConfigs)
- `features/dashboard/hooks/use-recent-requests.ts` -- TanStack Query hook with role-based query key
- `features/dashboard/api/dashboard.api.ts` -- re-exports types/APIs from `@/api/leave-balances.api`, `@/api/leave-requests.api`, `@/api/leave-types.api`, `@/api/config.api`
- `features/dashboard/index.ts` -- barrel export

**Files deleted (3):**
- `src/pages/DashboardPage.tsx` (moved)
- `src/components/LeaveBalanceCard.tsx` (moved)
- `src/components/LeaveHistory.tsx` (unused stub, zero importers)

**Files updated (1):**
- `app/router.tsx` -- import changed from `@/pages/DashboardPage` to `@/features/dashboard`

**Key pattern changes:**
- `useStore((s) => s.leaveRequests)` replaced by `useRecentRequests()` hook
- `useStore((s) => s.leaveBalances)` replaced by `useDashboardStats()` hook
- `useStore((s) => s.leaveTypes)` replaced by `useDashboardStats().leaveTypes`
- `useStore((s) => s.loadData())` in useEffect replaced by automatic TanStack Query fetching
- All `@/components/ui/*` replaced with `@/shared/ui/*`
- All `@/lib/*` replaced with `@/shared/lib/*` or `@/features/shared-reference-data`

## What We Tried

1. **Two focused hooks instead of one.** Considered a single `useDashboard()` hook but split into `useDashboardStats` (balance/config data) and `useRecentRequests` (request list). Separate query keys let the recent requests list refetch independently from the stats cards. Dashboard currently does not refetch on user action, but this split sets up future granularity without restructuring.

2. **`leaveBalancesApi.my()` instead of `list()` for user-scoped data.** The old store called `list()` and filtered client-side: `leaveBalances.filter(b => b.userId === user?.userId)`. For staff users, this loaded the entire company's balances and discarded everything not belonging to the current user. `my()` hits `/my` and returns only the authenticated user's data. For managers who need all balances, we still call `list()`. Role-based query key (`["leave-balances", "my", currentYear]`) ensures independent cache entries.

3. **API re-export module as stepping stone.** `dashboard.api.ts` re-exports from `@/api/leave-balances.api`, `@/api/leave-requests.api`, etc. This gives the feature a local import surface without moving the API modules yet. They will be relocated into their own feature slices during later phases (5+). Not duplicating types now avoids merge conflicts later.

4. **Left recent requests inline in dashboard-page.tsx.** The plan called for extracting a `recent-requests-list.tsx` component, but after moving the data fetching into hooks, the dashboard page stayed under 200 lines (161 lines). Extracting a separate component would add a file for no real readability gain. Applied YAGNI.

5. **Role-based query key strategy.** `useRecentRequests` uses `["leave-requests", isStaff ? "my" : "all"]` so staff and manager queries cache independently. If a staff user's role changes mid-session, TanStack's key change triggers a fresh fetch automatically.

## Root Cause Analysis

The Zustand store was the right choice for the initial prototype -- `loadData()` and `useStore` got the dashboard working quickly. But it created a coupling problem: every page that needed any piece of data imported the entire store, and every data mutation had to be coordinated through `set()` calls. The store became a god object. Dashboard consumed four different selectors from it, meaning it depended on four unrelated data domains through a single import.

TanStack Query solves this by making each data domain independent with its own cache key, automatic background refetching, and built-in loading/error states. The cost is more hooks, but each hook is testable in isolation and has a clear data contract.

The dead `LeaveHistory.tsx` existed because at some point the dashboard was redesigned without it, but nobody deleted the file. Classic dead code accumulation: you do not touch imports you are not actively debugging.

## Lessons Learned

1. **Role-based query keys prevent stale data cross-contamination.** `["leave-requests", "my"]` vs `["leave-requests", "all"]` ensures staff and manager views never share stale cache. Wrong key = wrong data shown to wrong role. This pattern must be applied consistently in Phase 5 (Leave Requests) and Phase 6 (Approval).

2. **API re-export modules are a stepping stone, not the final state.** `dashboard.api.ts` re-exports will be replaced when the API modules migrate into their respective feature slices. Do not get attached to the re-export pattern; it is scaffolding, not architecture.

3. **Delete dead code during migration, not later.** LeaveHistory.tsx was zero-cost to delete and one fewer file to think about. "Later cleanup" never comes. Migration is the only time you trace every import of every file.

4. **Derived state in hooks beats derived state in components.** `myBalances`, `maxLevelByType`, `pendingApproval` all live in hooks now. The component JSX stays clean and the logic is testable in isolation. This is the pattern for all remaining phases.

5. **File under 200 lines = do not extract.** DashboardPage is 161 lines after hook extraction. A `recent-requests-list.tsx` would add indirection without readability gain. YAGNI applies to component extraction too.

6. **Review catches are worth acting on immediately.** Code review flagged unused imports (`useMemo`, `LeaveBalanceCard`) and missing JSDoc on `leaveBalances`. Both were fixed before merge. Small things, but unused imports confuse future developers and missing JSDoc on user-scoped data is a real footgun -- someone will try to use it for all-users queries.

## Risks Remaining

- **No error state exposed from hooks.** Neither `useDashboardStats` nor `useRecentRequests` expose `error` from TanStack Query. The component shows `"--"` when loading but has no error UI. This is not a regression (the old Zustand version had no error handling either), but it should be addressed in a future pass. TanStack Query provides `error` for free; we just are not wiring it up yet.

- **7 pages still using Zustand store.** The store remains the source of truth for leave requests, approval, director features, calendar, reports, violations, and config. Each phase removes one slice. The store cannot be deleted until Phase 12 (Cleanup). Until then, the app has dual data fetching: some features use TanStack Query, some still use the store. This is intentional and documented, but it means state synchronization bugs are possible if a store-mutating action and a TanStack Query cache update race.

- **`leaveBalancesApi.my()` returns data scoped to the current user.** The JSDoc on `useDashboardStats` notes this, but downstream consumers must not assume `leaveBalances` contains all users' data. If a future feature needs all balances, it must call `leaveBalancesApi.list()` directly or create its own hook.

## Next Steps

- **Phase 5 (Leave Requests):** Migrate LeaveNewPage and LeaveMyPage. These are the two pages most tightly coupled to Zustand store mutations (`addLeaveRequest`, `updateLeaveRequest`). After Phase 5, the store's mutation actions can start being removed.
- **Phase 6 (Approval):** Will exercise the role-based query key pattern established here.
- **Phase 12 (Cleanup):** Will delete `useStore.ts` entirely and add ESLint `no-restricted-imports` rules for old paths.
- **Future improvement:** Add error state UI to dashboard hooks. TanStack Query exposes `error` and `isError` -- wire them up when doing a design pass.