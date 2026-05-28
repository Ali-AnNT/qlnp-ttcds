---
phase: 3
title: "Frontend Updates"
status: pending
priority: P1
effort: "2h"
dependencies: [2]
---

# Phase 3: Frontend Updates

## Overview

Update frontend API types, dashboard display, and config page to match the simplified single-record LeaveBalance model. ConfigPage keeps `default_days_{role}` configs visible (they affect TotalDays via min formula).

## Requirements

- Functional: Dashboard displays "Ngày phép còn lại" from single balance record; config page shows all configs including role-specific defaults; API types match new DTO
- Non-functional: No TypeScript errors; existing functionality preserved

## Architecture

```
LeaveBalanceDto (frontend, after):
  id, userId, year, totalDays, usedDays, remainingDays, role
  (removed: leaveTypeId, leaveTypeName)

DashboardPage: myBalances is now an array of 1 item (per year)
  remainingDays = myBalances[0]?.remainingDays ?? 0
  totalDays = myBalances[0]?.totalDays ?? 0

ConfigPage: show all configs including default_days_*
  Group display: "General" tab + "Per-role defaults" section
  Add preview: min(max_annual_leave, default_days_{role}) per role
```

## Related Code Files

- Modify: `packages/web/src/api/leave-balances.api.ts`
- Modify: `packages/web/src/pages/DashboardPage.tsx`
- Modify: `packages/web/src/pages/ConfigPage.tsx`
- Modify: `packages/web/src/components/LeaveBalanceCard.tsx`
- Modify: `packages/web/src/store/useStore.ts` (if leaveBalances type is defined here)

## Implementation Steps

1. **Update leave-balances.api.ts** — remove `leaveTypeId` and `leaveTypeName` from `LeaveBalanceDto` type definition; add `role` field

2. **Update DashboardPage.tsx** — simplify balance display:
   - `remainingDays = myBalances[0]?.remainingDays ?? 0` (was: reduce across all types)
   - `totalDaysUsed` stays as-is (from approved requests sum)
   - Update LeaveBalanceCard to use single balance
   - Remove multi-type reduce logic

3. **Update ConfigPage.tsx** — keep `default_days_*` configs visible:
   - Do NOT filter out `default_days_*` configs
   - Group configs: general settings (max_annual_leave, min_request_days, etc.) + per-role defaults
   - Optionally add a preview table showing `min(max_annual_leave, default_days_{role})` per role
   - Labels for role defaults: CB.PCM → "Mặc định Cán bộ", LD.PCM → "Mặc định Lãnh đạo", GD.PGD → "Mặc định Giám đốc", QTHT → "Mặc định Quản trị"

4. **Update LeaveBalanceCard.tsx** — simplify props for single balance display

5. **Update useStore.ts** — check if LeaveBalance type is defined in store; update if it references leaveTypeId/leaveTypeName

6. **Build and verify** — `pnpm build`

## Success Criteria

- [ ] `leave-balances.api.ts` has no `leaveTypeId` or `leaveTypeName` in DTO type; has `role`
- [ ] Dashboard "Ngày phép còn lại" displays value from single balance record
- [ ] ConfigPage shows `default_days_*` configs with descriptive labels
- [ ] ConfigPage optionally shows min() preview per role
- [ ] No TypeScript compilation errors
- [ ] `pnpm build` succeeds

## Risk Assessment

- **Store type mismatch**: Low — TypeScript will catch at compile time
- **Other pages referencing leaveTypeId**: Low — search codebase for `leaveTypeId` in balance context
- **ConfigPage regression**: Low — keeping all configs visible, just reorganizing display