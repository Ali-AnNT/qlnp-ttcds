---
phase: 3
title: "Frontend Fallback"
status: pending
priority: P3
effort: "1h"
dependencies: [1]
---

# Phase 3: Frontend Fallback

## Overview

With Phase 1 (lazy seed) in place, the API will always return balance data. The frontend changes are minimal — just ensure graceful display when API returns empty (edge case: new user before first API call, network issues) and show balances clearly on Dashboard + LeaveMyPage.

## Requirements

- Functional: Dashboard "Ngày phép còn lại" shows actual remaining days per leave type, not aggregate 0.
- Non-functional: No loading flash — show skeleton or "—" while fetching.

## Architecture

### Current behavior

`DashboardPage.tsx` line 43-45:
```tsx
const remainingDays = leaveBalances
  .filter((b) => b.userId === user?.userId)
  .reduce((s, b) => s + b.remainingDays, 0);
```
If `leaveBalances` is `[]` → result is `0`.

### After lazy seed

API returns balances → `reduce` works correctly. But we should also display per-type breakdown instead of just a total aggregate number. The `LeaveBalanceCard` component already exists and handles per-type display.

### Changes

1. **DashboardPage.tsx** — Replace single aggregate metric with per-type `LeaveBalanceCard` components. Show "Đang tải..." while `leaveBalances` is loading.
2. **LeaveMyPage.tsx** — No change needed (it shows requests, not balances). But could add a balance summary section at top.
3. **LeaveBalanceCard.tsx** — Already handles per-type display. No change needed.

## Related Code Files

- Modify: `packages/web/src/pages/DashboardPage.tsx`
- Read: `packages/web/src/components/LeaveBalanceCard.tsx`
- Read: `packages/web/src/api/leave-balances.api.ts`
- Read: `packages/web/src/store/useStore.ts`

## Implementation Steps

1. **Modify `DashboardPage.tsx`** — Replace the single `remainingDays` aggregate with per-type `LeaveBalanceCard` grid:
   - Remove the aggregate `remainingDays` calculation
   - Add a "Ngày phép" section below metrics grid that renders `LeaveBalanceCard` for each balance
   - While `leaveBalances` is empty/loading, show placeholder cards with "—" for remaining
   - Filter balances for current user + current year

2. **Add year filter to `leaveBalancesApi.my()`** — The API already supports `?year=YYYY`. Update `useStore.loadData` or Dashboard to fetch current year balances specifically.

3. **Keep aggregate metric in summary** — The top metrics grid keeps "Ngày phép còn lại" as sum of all `remainingDays`, but now it's correctly populated by lazy-seeded data instead of being 0.

## Success Criteria

- [ ] Dashboard shows "Ngày phép còn lại" with correct non-zero value for users with balances
- [ ] Per-leave-type cards show (e.g., "Nghỉ phép năm: 0/12", "Ốm đau: 0/0", "Việc riêng: 0/3")
- [ ] Loading state shows gracefully (no flash of 0)
- [ ] Dashboard works for all 4 roles (CB.PCM, LD.PCM, GD.PGD, QTHT)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| API returns empty on first load | Low | Low | Lazy seed (Phase 1) ensures data; add loading state as safety net |
| Performance with many leave types | Low | Low | Only 3 types currently; card grid is lightweight |

## Security Considerations

- Frontend only displays data from authenticated API calls — no direct DB access
- Year filter prevents displaying stale data from previous years