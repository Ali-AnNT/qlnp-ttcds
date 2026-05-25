---
phase: 1
title: "Seed Logic"
status: pending
priority: P1
effort: "2h"
dependencies: []
---

# Phase 1: Seed Logic

## Overview

Add lazy-seed logic to LeaveBalances queries. When fetching balances for a user, auto-create missing `LeaveBalance` records for active `LeaveType`s in the current year with `TotalDays = LeaveType.DefaultDays`, `UsedDays = 0`.

## Requirements

- Functional: API `/leave-balances/my` and `/leave-balances` must return complete balance data for all active leave types, even when no `LeaveBalance` row exists yet.
- Non-functional: Lazy seed must be idempotent (safe to call multiple times), must not break existing approval flow (`UpsertBalanceAsync` in Approve/Data.cs).

## Architecture

### Current flow (broken)

```
GET /leave-balances/my?year=2026
→ My/Data.GetByUserIdAsync() → SELECT from LeaveBalances
→ Empty result → Frontend shows 0
```

### New flow (lazy seed)

```
GET /leave-balances/my?year=2026
→ My/Data.GetByUserIdAsync()
  1. Get existing balances for user+year
  2. Get active LeaveTypes
  3. For each LeaveType without a balance → insert new LeaveBalance(TotalDays=DefaultDays, UsedDays=0)
  4. Return complete list (existing + newly seeded)
```

### Shared seed method

Extract `EnsureBalancesAsync()` into a shared `Data` class at `Features/LeaveBalances/Seed/Data.cs` to avoid duplicating logic between `My/Data` and `List/Data`.

## Related Code Files

- Create: `packages/api/Features/LeaveBalances/Seed/Data.cs`
- Modify: `packages/api/Features/LeaveBalances/My/Data.cs`
- Modify: `packages/api/Features/LeaveBalances/My/Endpoint.cs`
- Modify: `packages/api/Features/LeaveBalances/List/Data.cs`
- Modify: `packages/api/Features/LeaveBalances/List/Endpoint.cs`
- Modify: `packages/api/Program.cs` — register Seed.Data DI

## Implementation Steps

1. **Create `Seed/Data.cs`** — shared `EnsureBalancesAsync(AppDbContext db, long userId, int year, CancellationToken ct)` method:
   - Query `LeaveBalances` for `userId` + `year`
   - Query `LeaveTypes` where `IsActive == true`
   - Find missing `LeaveTypeId`s (LeaveType IDs not in existing balances)
   - For each missing type, create `new LeaveBalance { UserId, LeaveTypeId, Year, TotalDays = leaveType.DefaultDays, UsedDays = 0 }`
   - `AddRange` + `SaveChangesAsync` (catch `DbUpdateException` for duplicate key race condition — unique index on `(UserId, LeaveTypeId, Year)` protects us; on conflict, just skip)
   - Return full list of balances for user+year (re-query after seed to include newly created rows)

2. **Modify `My/Data.cs`** — inject `Seed.Data` or call `EnsureBalancesAsync` before the existing query:
   ```csharp
   public async Task<List<LeaveBalanceDto>> GetByUserIdAsync(long userId, int? year, CancellationToken ct)
   {
       var effectiveYear = year ?? DateTime.UtcNow.Year;
       await SeedData.EnsureBalancesAsync(_db, userId, effectiveYear, ct);
       // existing query...
   }
   ```

3. **Modify `My/Endpoint.cs`** — inject `Seed.Data` (or just use `AppDbContext` directly since `Seed.Data` is stateless helper). Prefer passing `AppDbContext` to `Seed.Data` method to keep it simple.

4. **Modify `List/Data.cs`** — for each user in the result set, call `EnsureBalancesAsync`. Since `List` returns all users' balances (for admin view), need to seed for all users with QLNP roles:
   ```csharp
   // Get all userIds that appear in result or have QLNP roles
   // Call EnsureBalancesAsync for each unique userId
   ```
   **Performance note**: For admin `List` endpoint, batch-seed all relevant users in one round trip rather than N calls.

5. **Modify `List/Endpoint.cs`** — inject `Seed.Data` if needed, or rely on `Data.cs` internal call.

6. **Modify `Program.cs`** — register `Seed.Data` in DI if it uses DI. If `EnsureBalancesAsync` is a static method taking `AppDbContext`, no DI registration needed.

7. **Verify `Approve/Data.cs:UpsertBalanceAsync`** — confirm it still works correctly. If a balance already exists (seeded), it should just do `balance.UsedDays += entity.TotalDays` without re-creating. If seeded balance has `UsedDays = 0`, this is correct. The existing `if (balance is null)` branch will rarely trigger after lazy seed, but must remain as safety net.

## Success Criteria

- [ ] `GET /leave-balances/my?year=2026` returns balances for all active leave types, even for users with zero prior records
- [ ] `GET /leave-balances?year=2026` returns seeded balances for all QLNP users
- [ ] Approval flow (`UpsertBalanceAsync`) still works — `UsedDays` increments correctly on director approval
- [ ] Idempotent — calling the same endpoint twice doesn't create duplicate balances (unique index protection)
- [ ] Race-condition safe — concurrent requests don't crash on duplicate key

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Race condition on concurrent seed | Low | Low | Unique index `(UserId, LeaveTypeId, Year)` catches duplicates; catch `DbUpdateException` and re-query |
| Performance on `List` endpoint (N users × M types) | Medium | Medium | Batch insert all missing balances in one `SaveChangesAsync` call |
| `UpsertBalanceAsync` conflict with pre-seeded balances | Low | High | Test explicitly: seeded balance + approve = UsedDays increments correctly |

## Security Considerations

- Lazy seed only creates balances for the authenticated user (My) or for users visible to the admin (List with role filter)
- No privilege escalation — seed respects existing role-based access control