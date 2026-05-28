---
phase: 4
title: "Verification"
status: pending
priority: P1
effort: "1h"
dependencies: [1, 2, 3]
---

# Phase 4: Verification

## Overview

Verify the complete implementation: build both backend and frontend, apply migration, test key flows (seed, balance retrieval, approval, config update recalculation, dashboard display).

## Requirements

- Functional: All changes work end-to-end; dashboard shows correct remaining days; config update triggers recalculation
- Non-functional: No compiler errors, no runtime exceptions

## Architecture

```
Verification flow:
1. dotnet build → zero errors
2. dotnet ef database update → migration applied
3. pnpm build → zero errors
4. Manual test: seed → balance creation → approval deduction → dashboard display
5. Config update test: change max_annual_leave → verify all balances recalculated
6. Role sync test: login → verify UserRole populated/updated
```

## Implementation Steps

1. **Backend build** — `cd packages/api && dotnet build` — verify zero errors
2. **Migration apply** — `dotnet ef database update` — verify migration runs successfully
3. **Frontend build** — `cd packages/web && pnpm build` — verify zero errors
4. **Verify seed logic** — start API, check that LeaveBalances table has 1 row per (UserId, Year) with TotalDays = min(max_annual_leave, default_days_{role})
5. **Verify balance retrieval** — call GET `/api/leave-balances/my` — verify single balance object returned without leaveTypeId, with role field
6. **Verify approval flow** — approve a leave request — verify UsedDays increments on single balance record
7. **Verify dashboard** — check that "Ngày phép còn lại" shows `TotalDays - UsedDays`
8. **Verify config page** — check that `default_days_*` configs are visible with labels
9. **Verify recalculation** — update SystemConfigs via PUT `/api/system-configs` (change max_annual_leave from 12 to 15) — verify all current-year LeaveBalances have TotalDays = min(15, default_days_{role})
10. **Verify role sync** — login as different user — verify UserRoles table has correct role entry
11. **Verify over-limit** — set max_annual_leave to lower value than some UsedDays — verify TotalDays decreases but UsedDays unchanged (remaining can be negative)

## Success Criteria

- [ ] `dotnet build` succeeds with zero errors
- [ ] `dotnet ef database update` succeeds
- [ ] `pnpm build` succeeds with zero errors
- [ ] LeaveBalances table has 1 row per (UserId, Year)
- [ ] Each row has TotalDays = min(max_annual_leave, default_days_{role})
- [ ] GET `/api/leave-balances/my` returns single balance without leaveTypeId, with role
- [ ] Approving a request increments UsedDays on single balance
- [ ] Dashboard "Ngày phép còn lại" = TotalDays - UsedDays
- [ ] ConfigPage shows `default_days_*` configs with labels
- [ ] Updating SystemConfigs recalculates all current-year balances
- [ ] UserRoles table populated on login via GET /me
- [ ] When TotalDays < UsedDays, remaining is negative (not blocked)

## Risk Assessment

- **Migration failure on existing data**: Low — SQL consolidation carefully designed; backup DB before running
- **Frontend runtime errors**: Low — TypeScript compilation catches type mismatches at build time
- **Recalculation not triggering**: Medium — verify SystemConfigs/Update endpoint calls ILeaveBalanceService
- **Stale UserRole data**: Low — GET /me syncs on every page load