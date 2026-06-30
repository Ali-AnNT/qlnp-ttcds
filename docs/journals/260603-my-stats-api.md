# My Stats API — Server-Side Aggregation Replaces Client-Side Dashboard Chatter

**Date**: 2026-06-03 03:46
**Severity**: Low
**Component**: API / Dashboard
**Status**: Resolved

## What Happened

Added `GET /api/my-stats` endpoint returning 4 aggregated numbers (`remainingDays`, `pendingCount`, `approvedCount`, `usedDays`) for the authenticated user, current year only. Three new files: `MyStatsEndpoint.cs`, `MyStatsResponse.cs`, `MyStatsGroup.cs`. Purely additive — no existing code modified.

## The Brutal Truth

The dashboard was making 3+ client-side API calls to assemble what is effectively 4 numbers. Classic N+1-over-HTTP pattern. Every dashboard load meant multiple round trips for data that should have been a single server-side aggregation. Not a crisis, but a slow death by a thousand requests.

## Technical Details

- **Endpoint**: `GET /api/my-stats` under `MyStatsGroup` (prefix `api/my-stats`, separate from `LeaveBalanceGroup` because response shape differs)
- **2 DB queries max**: (1) `SUM(TotalDays), SUM(UsedDays)` from `LeaveBalances` filtered by UserId+Year, (2) `GROUP BY Status` count from `LeaveRequests` filtered by UserId
- **Auto-seed**: Reuses `LeaveBalanceSeeding.EnsureBalancesAsync` — lazy-seeds balance row if missing for user+year, same pattern as `MyLeaveBalanceEndpoint`
- **Auth**: `ICurrentUserProvider` from JWT claims, `RequireAuthorization()` on endpoint
- **Null safety**: `balanceAgg?.TotalDays ?? 0` for no-balance users, `GetValueOrDefault("pending")` for no-request users
- **Year filter**: Current year only. YAGNI — dashboard does not need historical years

## What We Tried

Straightforward implementation. No alternatives needed. The only real decision was whether to cram this into the existing `LeaveBalanceGroup` or give it its own group. Chose separate `MyStatsGroup` because the response shape is fundamentally different (flat aggregates vs. list of balance objects).

## Root Cause Analysis

No failure mode — this was proactive optimization. The root cause of the problem being solved: client-side dashboard was issuing multiple API calls to compute what a single SQL query pair can return. Server-side aggregation is the correct fix.

## Lessons Learned

- When a UI needs aggregated summary numbers, aggregate on the server. Do not ship raw data over the wire for client-side reduction.
- Separate FastEndpoints groups when response shapes differ, even if the domain overlaps. Keeps Swagger docs clean and avoids confusing consumers.
- Reuse seeding logic (`EnsureBalancesAsync`) rather than duplicating it. The existing pattern in `MyLeaveBalanceEndpoint` made this a 2-line call instead of a 20-line reimplementation.
- Year scoping to current year only is sufficient for a dashboard. Do not over-generalize until someone actually asks for historical stats.

## Next Steps

- Frontend should wire dashboard to `GET /api/my-stats` and retire the 3+ individual calls
- Consider caching this response (short TTL) if dashboard traffic becomes hot
- If historical stats are ever needed, extend with optional `?year=2025` query param rather than returning all years by default