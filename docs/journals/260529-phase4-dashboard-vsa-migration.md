# Phase 4: Dashboard VSA Migration

**Date**: 2026-05-29
**Severity**: Medium
**Component**: packages/web -- features/dashboard
**Status**: Resolved

## What Happened

Completed Phase 4 of the 12-phase VSA migration for `packages/web`. Migrated the dashboard feature from layered architecture (`src/pages/DashboardPage.tsx`, `src/components/LeaveBalanceCard.tsx`) to a self-contained VSA slice at `src/features/dashboard/`. Replaced Zustand store usage with two TanStack Query hooks. Deleted unused `LeaveHistory.tsx`. Build passes with zero errors.

## The Brutal Truth

This was the first feature where Zustand store decoupling was the primary challenge rather than just file moves. DashboardPage consumed `useStore` for `leaveRequests`, `leaveBalances`, `leaveTypes`, and `departments` -- four separate data domains funneled through a single store. Extracting those into focused TanStack Query hooks required understanding the exact query shapes the dashboard needed.

The `useDashboardStats` hook combines three parallel queries (leave balances, leave types, approval configs) and computes derived state (myBalances, maxLevelByType, remainingDays). The `useRecentRequests` hook handles role-based query key differentiation (staff see only their own requests, managers see all). Both patterns are reusable for other features during later phases.

LeaveHistory.tsx was a dead stub -- unused component with zero importers. Easy delete, but it highlights the cleanup benefit of VSA migration: you see exactly what's connected and what's not.

## Technical Details

**Files created:**
- `src/features/dashboard/components/dashboard-page.tsx` (moved from `src/pages/DashboardPage.tsx`)
- `src/features/dashboard/components/leave-balance-card.tsx` (moved from `src/components/LeaveBalanceCard.tsx`)
- `src/features/dashboard/hooks/use-dashboard-stats.ts` -- TanStack Query hook combining 3 parallel queries
- `src/features/dashboard/hooks/use-recent-requests.ts` -- TanStack Query hook with role-based query key
- `src/features/dashboard/api/dashboard.api.ts` -- Re-exports API types needed by hooks
- `src/features/dashboard/index.ts` -- Barrel export

**Files deleted:**
- `src/pages/DashboardPage.tsx` (moved to feature)
- `src/components/LeaveBalanceCard.tsx` (moved to feature)
- `src/components/LeaveHistory.tsx` (unused stub, deleted)

**Files updated:**
- `src/app/router.tsx` -- Import changed from `@/pages/DashboardPage` to `@/features/dashboard`

**Key pattern changes:**
- `useStore((s) => s.leaveRequests)` replaced by `useRecentRequests()` hook
- `useStore((s) => s.leaveBalances)` replaced by `useDashboardStats()` hook
- `useStore((s) => s.loadData())` (useEffect) replaced by automatic TanStack Query fetching
- `useStore((s) => s.leaveTypes)` replaced by `useDashboardStats().leaveTypes`
- All `@/components/ui/*` imports replaced with `@/shared/ui/*`
- All `@/lib/*` imports replaced with `@/shared/lib/*` or `@/features/shared-reference-data`

## What We Tried

1. **Two focused hooks instead of one** -- Considered a single `useDashboard()` hook but split into `useDashboardStats` (balance/config data) and `useRecentRequests` (request list) to keep query key granularity. This lets the recent requests list refetch independently from the stats cards.
2. **API re-export module** -- Created `dashboard.api.ts` that re-exports types from `@/api/leave-balances.api`, `@/api/leave-requests.api`, `@/api/leave-types.api`, and `@/api/config.api`. This gives the feature a local import surface while keeping the actual API modules in their original location (they will be relocated during later phases).
3. **Role-based query key** -- `useRecentRequests` uses `["leave-requests", isStaff ? "my" : "all"]` as query key, so staff and manager queries cache independently.

## Root Cause Analysis

The Zustand store was the right choice for the initial prototype -- it got the app working quickly with a single `loadData()` call. But it created a coupling problem: every page that needed any piece of data had to import the entire store, and every data mutation had to be coordinated through `set()` calls. TanStack Query solves this by making each data domain independent with its own cache key, automatic background refetching, and built-in loading/error states.

## Lessons Learned

1. **TanStack Query hooks need careful key design.** Using `["leave-requests", "my"]` vs `["leave-requests", "all"]` ensures staff and manager views don't share stale cache. Wrong key = wrong data shown.
2. **Re-export modules are a stepping stone, not the final state.** The `dashboard.api.ts` re-exports will be replaced when the API modules migrate into their respective feature slices (Phase 5 onward).
3. **Dead stub components should be deleted during migration, not deferred.** LeaveHistory.tsx was zero-cost to delete and one less file to think about during later phases.
4. **Derived state in hooks beats derived state in components.** Moving `myBalances`, `maxLevelByType`, `pendingApproval` into hooks keeps the component JSX clean and makes the logic testable in isolation.

## Next Steps

- Phase 5 (Leave Requests): Migrate LeaveNewPage and LeaveMyPage -- the two pages most tightly coupled to Zustand store mutations (`addLeaveRequest`, `updateLeaveRequest`).
- After Phase 5, the Zustand store's mutation actions can start being removed.
- Phase 12 (Cleanup) will delete `useStore.ts` entirely once all 7 remaining pages are migrated.