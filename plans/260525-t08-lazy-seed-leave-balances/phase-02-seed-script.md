---
phase: 2
title: "Seed Script"
status: pending
priority: P2
effort: "1h"
dependencies: [1]
---

# Phase 2: Seed Script

## Overview

Create a one-time script to seed `LeaveBalance` records for existing QLNP users who already have roles but no balances. Also add yearly auto-seed at app startup for the current year.

## Requirements

- Functional: All 4 users with QLNP roles must have `LeaveBalance` rows for 2026 with correct `TotalDays` per `LeaveType.DefaultDays`.
- Non-functional: Seed script must be idempotent (safe to run multiple times). Startup seed must not slow down app boot noticeably.

## Architecture

### One-time seed for existing users

EF Core `HasData` already seeds `LeaveType` and `UserRole` but NOT `LeaveBalance` (because balances depend on runtime data — which users exist, which year). Use a startup seed that runs after migrations.

### Approach

Add a `SeedLeaveBalances` method in `Program.cs` startup, after `db.Database.Migrate()`. This method:

1. Gets all `UserRoles` (users with QLNP roles)
2. Gets all active `LeaveTypes`
3. For each user × leave type, checks if a `LeaveBalance` exists for current year
4. Creates missing balances with `TotalDays = DefaultDays`, `UsedDays = 0`

This also serves as yearly auto-seed — when the year changes, new balances are created on first app start.

## Related Code Files

- Modify: `packages/api/Program.cs` — add seed logic after migration
- Read: `packages/api/Data/AppDbContext.cs` — reference seed data for LeaveType IDs and UserRole IDs

## Implementation Steps

1. **Create `packages/api/Data/SeedHelper.cs`** — static class with `SeedLeaveBalancesAsync(AppDbContext db)` method:
   ```csharp
   public static class SeedHelper
   {
       public static async Task SeedLeaveBalancesAsync(AppDbContext db)
       {
           var year = DateTime.UtcNow.Year;
           var activeLeaveTypes = await db.LeaveTypes
               .Where(lt => lt.IsActive)
               .ToListAsync();
           var userIds = await db.UserRoles
               .Select(ur => ur.UserId)
               .Distinct()
               .ToListAsync();

           foreach (var userId in userIds)
           {
               foreach (var lt in activeLeaveTypes)
               {
                   var exists = await db.LeaveBalances
                       .AnyAsync(b => b.UserId == userId && b.LeaveTypeId == lt.Id && b.Year == year);
                   if (!exists)
                   {
                       db.LeaveBalances.Add(new LeaveBalance
                       {
                           UserId = userId,
                           LeaveTypeId = lt.Id,
                           Year = year,
                           TotalDays = lt.DefaultDays,
                           UsedDays = 0
                       });
                   }
               }
           }
           await db.SaveChangesAsync();
       }
   }
   ```

2. **Modify `Program.cs`** — call seed after migration:
   ```csharp
   // After db.Database.Migrate()
   await SeedHelper.SeedLeaveBalancesAsync(db);
   ```

3. **Add `using QLNP.Api.Data;`** if needed for `SeedHelper` resolution.

4. **Test manually** — verify all 4 QLNP users now have 3 `LeaveBalance` rows each (annual=12, sick=0, personal=3 for 2026).

## Success Criteria

- [ ] All 4 QLNP-role users have `LeaveBalance` rows for current year with correct `TotalDays`
- [ ] Seed is idempotent — running twice doesn't create duplicates
- [ ] Seed runs on every app start — new year auto-creates balances
- [ ] Seed completes in < 2 seconds for 82 users × 3 leave types

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Large user count slows startup | Low | Medium | Batch insert; only check current year; early-exit if all balances exist |
| New LeaveType added later | Low | Low | Lazy seed (Phase 1) covers this case; startup seed only fills current gaps |
| Duplicate key violation on concurrent startup | Low | Low | `AnyAsync` check before insert; unique index as safety net |

## Security Considerations

- Startup seed runs with app identity — no privilege escalation
- Only seeds for users that already have QLNP roles (no data leakage)