# T-08: Lazy Seed LeaveBalances -- Phuong an C

**Date**: 2026-05-25 04:30
**Severity**: Medium
**Component**: LeaveBalances API + Dashboard
**Status**: Resolved

## What Happened

"Ngay phep con lai" (remaining leave days) always displayed 0 for every user. The `LeaveBalances` table was completely empty because records were only created when a director approved a request (`UpsertBalanceAsync` in `Approve/Data.cs`). Before any approval happened, users saw zero remaining days -- a showstopper for a leave management system.

## The Brutal Truth

This is a classic "works on paper, fails in practice" bug. The approval flow creates balances on first approval, which means the very first user to log in sees nothing. The design assumed balances would exist before they were queried, but nobody created them. It is maddening because the math was correct (`RemainingDays = TotalDays - UsedDays`) -- the data simply was not there. We should have caught this the moment we seeded `LeaveType` and `UserRole` without `LeaveBalance`. The P2 journal entry even called this out: "Lazy-init of aggregates (LeaveBalance on first approval) avoids migration debt but defers the schema constraint problem." That deferral came due.

## Technical Details

Root cause: `My/Data.GetByUserIdAsync` queried `LeaveBalances` directly with no fallback. Empty table = empty result = frontend `reduce(0)`. The `UpsertBalanceAsync` in `Approve/Data.cs` was the only insertion point, and it only fired on director approval.

Fix: Phuong an C (lazy seed + frontend fallback) -- three new/modified files on the backend, one on the frontend.

### Backend changes

1. **`Features/LeaveBalances/Seed/Data.cs`** (NEW) -- Static class with two methods:
   - `EnsureBalancesAsync(db, userId, year, ct)` -- queries existing balances for a single user+year, finds active LeaveTypes missing from those balances, inserts them with `TotalDays = LeaveType.DefaultDays, UsedDays = 0`. Catches `DbUpdateException` to handle race conditions (concurrent requests hitting the unique index on `(UserId, LeaveTypeId, Year)`). On conflict, detaches tracked entities so the caller can re-query cleanly.
   - `EnsureBalancesForUsersAsync(db, userIds, year, ct)` -- batch version for the admin `List` endpoint. Queries existing `(UserId, LeaveTypeId)` composite keys for all requested users at once, then bulk-inserts missing combinations. Same `DbUpdateException` catch + detach pattern.

2. **`My/Data.cs`** -- `GetByUserIdAsync` now calls `Seed.Data.EnsureBalancesAsync` before the query. Uses `namespace-qualified` call (`Seed.Data.EnsureBalancesAsync`) to avoid collision with the local `Data` class in the `My` namespace.

3. **`List/Data.cs`** -- `GetAllAsync` seeds for a single user (if `userId` filter) or all QLNP-role users (admin view with no filter) before querying.

4. **`Data/SeedHelper.cs`** (NEW) -- One-time startup seed. Called after `Database.Migrate()` in `Program.cs`. Delegates to `EnsureBalancesForUsersAsync` for all users found in `UserRoles`. Idempotent -- safe on every app start, handles new years automatically.

5. **`Program.cs`** -- Added `await SeedHelper.SeedLeaveBalancesAsync(db)` after `db.Database.Migrate()`.

### Frontend changes

6. **`DashboardPage.tsx`** -- Replaced single aggregate metric with per-type `LeaveBalanceCard` grid. Filters `leaveBalances` by `currentYear`. Shows `"--"` placeholder while loading. The aggregate metric ("Ngay phep con lai") in the top metrics grid still sums all `remainingDays`, now correctly populated by lazy-seeded data.

### Design decisions

- **Static helper class** (`Seed.Data`) rather than DI-injected -- no DI registration needed, no constructor ceremony, stateless methods just take `AppDbContext`. Namespace-qualified calls prevent collision with local `Data` classes.
- **Return type `Task`** instead of `Task<List<LeaveBalance>>` -- callers always re-query after seeding, so returning the seeded list would be wasteful double-query. Reviewer flagged this (H2), and it was the right call.
- **`DbUpdateException` catch + detach pattern** -- the unique index `(UserId, LeaveTypeId, Year)` is the real safety net. When two concurrent requests race to insert the same balance row, one wins and one hits the constraint. The loser catches the exception, detaches tracked entities (so EF does not throw on the re-query), and the caller re-queries to get all rows including the winning insert. A comment was added to explain this per review feedback (M2).
- **No `.Distinct()` on `UserRoles.UserId`** -- removed per review feedback (L3). `UserRole.UserId` is part of a composite PK, so it is already unique in the join table context. Adding `.Distinct()` would have added a redundant SQL `DISTINCT`.

## Root Cause Analysis

The root cause was an implicit assumption that `LeaveBalance` rows would exist before being queried. The approval flow created them as a side effect of director approval, but nobody considered what happens before any approval occurs. This is a data lifecycle gap: we seeded reference data (`LeaveType`, `UserRole`) but not transactional data (`LeaveBalance`). The P2 journal even noted this smelled but called it "acceptable for MVP." It was not -- users seeing zero days is an MVP-blocking bug.

## Lessons Learned

1. **Seed transactional data, not just reference data.** If a calculation depends on rows existing, those rows must exist before the calculation runs. Period.
2. **Lazy seed is a safety net, not the primary mechanism.** The startup seed (`SeedHelper`) handles the bulk case. The lazy seed (`EnsureBalancesAsync`) handles edge cases (new users, new leave types, year transitions). Both are needed.
3. **Race conditions are real in web APIs.** Two users hitting `/leave-balances/my` simultaneously will both try to seed. The unique index + `DbUpdateException` catch is not paranoia -- it is necessary.
4. **Namespace collisions are a C# pitfall with vertical slice architecture.** Having a `Data` class in every feature namespace means `Seed.Data` must be namespace-qualified when called from `My/Data.cs` or `List/Data.cs`. The compiler error would be confusing if you miss this.

## Next Steps

- None -- this task is complete. The lazy seed + startup seed + frontend fallback covers all cases: new users, new leave types, year transitions, and concurrent requests.
- Future consideration: add a periodic job (hangfire/quartz) to seed balances for new years if the app runs continuously without restarts across year boundaries. The lazy seed covers this case, but a scheduled seed would be cleaner for large user counts.