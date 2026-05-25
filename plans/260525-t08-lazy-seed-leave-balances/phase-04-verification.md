---
phase: 4
title: "Verification"
status: pending
priority: P2
effort: "1h"
dependencies: [1, 2, 3]
---

# Phase 4: Verification

## Overview

End-to-end testing: verify lazy seed works correctly, balances display properly, and the approval flow still increments `UsedDays` without issues.

## Requirements

- Functional: "Ngày phép còn lại" shows correct values on Dashboard for all roles. Approval flow increments `UsedDays`. Cancel/reject does not affect balance.
- Non-functional: API response time remains under 500ms for `/leave-balances/my` with lazy seed.

## Implementation Steps

1. **Startup seed verification** — Start the API, confirm 4 users × 3 leave types = 12 `LeaveBalance` rows created for current year:
   ```sql
   SELECT * FROM LeaveBalances WHERE Year = YEAR(GETDATE())
   ```
   Expected: 12 rows (4 users × 3 types: annual=12, sick=0, personal=3).

2. **API verification** — Call endpoints and check responses:
   - `GET /api/leave-balances/my?year=2026` — returns 3 balance objects with correct `remainingDays`
   - `GET /api/leave-balances?year=2026` (as QTHT) — returns all users' balances
   - Call `/my` twice — confirm idempotent (no duplicates in DB)

3. **Frontend verification** — Open Dashboard:
   - "Ngày phép còn lại" shows non-zero value (e.g., 15 = 12 annual + 0 sick + 3 personal)
   - Per-type cards show correct data: "Nghỉ phép năm: 0/12", "Việc riêng: 0/3"
   - Login as different roles (CB.PCM, LD.PCM, GD.PGD) — each sees their own balances

4. **Approval flow verification** — Create a leave request as CB.PCM, approve as LD.PCM, then approve as GD.PGD:
   - After director approval, `UsedDays` increments by `totalDays`
   - `RemainingDays` decreases accordingly
   - Balance in DB reflects the change

5. **Cancel/reject verification** — Create request, approve to leader level, then cancel or reject:
   - Cancel: `UsedDays` unchanged (cancel doesn't affect balance for `pending` or `approved_leader` status)
   - Reject by director: `UsedDays` unchanged (reject at `approved_leader` stage, balance not yet incremented)

6. **Performance check** — Measure `/leave-balances/my` response time. Expected < 200ms with lazy seed (1 extra round trip only on first call).

## Success Criteria

- [ ] 12 balance rows seeded in DB for 4 QLNP users × 3 leave types
- [ ] Dashboard "Ngày phép còn lại" shows correct aggregate (15 for fresh user: 12+0+3)
- [ ] Per-type balance cards show correct individual values
- [ ] Approval increments `UsedDays` and decrements `RemainingDays`
- [ ] Cancel/reject does NOT affect balance
- [ ] API `/my` idempotent — no duplicate balances on repeated calls
- [ ] API response time < 500ms

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Seed creates duplicates on concurrent requests | Low | Medium | Unique index + `DbUpdateException` catch in Phase 1 |
| Frontend cache shows stale 0 after seed | Low | Low | `loadData()` fetches fresh data; refresh page clears cache |
| Year boundary — balances not created for new year | Low | Medium | Startup seed (Phase 2) creates on app start; lazy seed (Phase 1) creates on first API call |