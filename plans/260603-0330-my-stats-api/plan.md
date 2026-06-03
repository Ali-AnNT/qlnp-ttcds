---
title: "My Stats API"
description: "Add GET /api/my-stats endpoint returning 4 aggregate numbers for the current user: remainingDays, pendingCount, approvedCount, usedDays. Server-side aggregation replaces client-side dashboard computation."
status: completed
priority: P2
branch: "feat/update-deploy-cjs-ttcds-preset"
tags: [api, feature, dashboard]
blockedBy: []
blocks: []
created: "2026-06-03T03:39:03.269Z"
completed: "2026-06-03T03:46:00.000Z"
createdBy: "ck:plan"
source: skill
---

# My Stats API

## Overview

Add `GET /api/my-stats` endpoint returning 4 aggregated numbers for the authenticated user (current year):
1. `remainingDays` — SUM(TotalDays - UsedDays) from LeaveBalances
2. `pendingCount` — COUNT of LeaveRequests WHERE Status=pending
3. `approvedCount` — COUNT of LeaveRequests WHERE Status=approved
4. `usedDays` — SUM(UsedDays) from LeaveBalances

Replaces 3+ client-side API calls with a single server-side aggregation.

**Brainstorm report**: `plans/reports/brainstorm-260603-my-stats-api-report.md`

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Implement MyStatsEndpoint](./phase-01-implement-mystatsendpoint.md) | Completed |
| 2 | [Test & Verify](./phase-02-test-verify.md) | Completed |

## Key Design Decisions

- **Route**: `GET /api/my-stats` with own `MyStatsGroup` (separate from LeaveBalances — different response shape)
- **Auth**: Uses `ICurrentUserProvider` to get UserId from JWT claims
- **Auto-seed**: Balance rows lazy-seeded via `LeaveBalanceSeeding.EnsureBalancesAsync` (same pattern as `MyLeaveBalanceEndpoint`)
- **Year filter**: Current year only (YAGNI — dashboard only needs current year)
- **2 DB queries**: (1) SUM from LeaveBalances, (2) GROUP BY Status from LeaveRequests

## Dependencies

No cross-plan dependencies.