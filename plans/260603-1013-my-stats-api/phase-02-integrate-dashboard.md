---
phase: 2
title: "Integrate Dashboard"
status: pending
priority: P2
effort: "30m"
dependencies: [1]
---

# Phase 2: Integrate Dashboard

## Overview

Replace client-side metric computation in `DashboardPage` with `useMyStats` hook. Keep `useRecentRequests` for activity feed; simplify `useDashboardStats` or inline remaining logic.

## Requirements

- Functional: 4 metric cards populated from server-side `GET /api/my-stats` instead of client aggregation
- Non-functional: Reduce API calls from 3+ to 1 for metrics, dashboard loads faster

## Architecture

**Before** (current):
```
useDashboardStats()  → leave-balances/my + leave-types + config  → client-compute remainingDays
useRecentRequests()  → leave-requests/my                              → client-filter pending/approved/usedDays
DashboardPage        → combine both hooks for 4 metrics
```

**After**:
```
useMyStats()         → GET /api/my-stats (1 call)        → remainingDays, pendingCount, approvedCount, usedDays
useRecentRequests()  → leave-requests/my (keep for activity feed only)
useDashboardStats()  → keep for leaveTypes + approvalConfigs (activity feed needs them)
DashboardPage        → useMyStats for metrics, useDashboardStats for types only
```

## Related Code Files

- Modify: `packages/web/src/features/dashboard/components/dashboard-page.tsx`
- Modify: `packages/web/src/features/dashboard/hooks/use-dashboard-stats.ts`
- Modify: `packages/web/src/features/dashboard/hooks/use-recent-requests.ts`
- Read: `packages/web/src/features/dashboard/index.ts` (barrel exports)

## Implementation Steps

1. **Update `dashboard-page.tsx`** — Replace metrics data source:
   - Import `useMyStats` instead of deriving metrics from `useDashboardStats` + `useRecentRequests`
   - Replace `metrics` array values with `useMyStats()` fields
   - Keep `useDashboardStats` for `leaveTypes` + `maxLevelByType` (activity feed needs them)
   - Keep `useRecentRequests` for `recentRequests` (activity feed) and `pendingApproval.length` (CTA button)
   - Combine loading: `statsLoading || myStatsLoading || requestsLoading`

2. **Simplify `use-dashboard-stats.ts`** — Remove metric computation:
   - Remove `remainingDays` / `totalDaysAllowed` computed values
   - Keep: `leaveTypes`, `approvalConfigs`, `maxLevelByType` (still needed for activity feed badges)
   - Keep `balancesQuery` only if other consumers need it; otherwise remove

3. **Simplify `use-recent-requests.ts`** — Remove metric computation:
   - Remove `approvedCount`, `totalDaysUsed` computed values
   - Keep: `pendingApproval` (for CTA button count), `recentRequests` (activity feed)
   - Keep `myRequests` only if other consumers need it

4. **Update `dashboard/index.ts`** — Add `useMyStats` export

## Success Criteria

- [ ] Dashboard 4 metric cards use `useMyStats()` data (server-computed)
- [ ] Activity feed still works (leave type labels, status badges)
- [ ] CTA buttons still show correct pending count
- [ ] No redundant client-side filtering for metrics
- [ ] `bun run build` passes with no errors

## Risk Assessment

Medium — modifying existing hooks may affect other consumers. Mitigate by checking all imports of `useDashboardStats` / `useRecentRequests` before removing exports.

## Security Considerations

None — same auth context, just different data source (server-computed vs client-computed).