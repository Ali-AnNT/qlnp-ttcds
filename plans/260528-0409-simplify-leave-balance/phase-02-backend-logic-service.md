---
phase: 2
title: "Backend Logic + Service"
status: pending
priority: P1
effort: "5h"
dependencies: [1]
---

# Phase 2: Backend Logic + Service

## Overview

Update all backend code that references LeaveTypeId on LeaveBalance: DTOs, seeding, balance retrieval, approval balance upsert, startup seed. Add `ILeaveBalanceService` for recalculation on config change. Update GET /me and DevLogin to sync UserRole. Wire SystemConfigs Update endpoint to call recalculate after save.

## Requirements

- Functional: All API endpoints return LeaveBalance data without LeaveTypeId; TotalDays = min(max_annual_leave, default_days_{role}); approval flow deducts from single balance; config update triggers recalculation; GET /me syncs UserRole
- Non-functional: No compiler warnings; consistent error messages; recalculation runs synchronously after config save

## Architecture

```
LeaveBalanceDto (after):
  Id, UserId, Year, TotalDays, UsedDays, RemainingDays, Role
  (removed: LeaveTypeId, LeaveTypeName)

ILeaveBalanceService (new):
  RecalculateCurrentYearAsync(CancellationToken ct)
    → reads max_annual_leave, all default_days_{role} from SystemConfigs
    → joins LeaveBalances(UserId, Year) with UserRoles(UserId, Role)
    → for each balance: TotalDays = min(max_annual_leave, default_days_{role})
    → fallback: max_annual_leave when no UserRole entry

SystemConfigs/Update/Endpoint (modified):
  await _data.ReplaceAllAsync(req, ct);
  await _balanceService.RecalculateCurrentYearAsync(ct);  // channel service call

GET /me (modified):
  upsert UserRole from JWT claim (create if missing, update if changed)

DevLogin/Endpoint (modified):
  upsert UserRole from dev role mapping
```

## Related Code Files

- Create: `packages/api/Services/ILeaveBalanceService.cs`
- Create: `packages/api/Services/LeaveBalanceService.cs`
- Modify: `packages/api/Features/LeaveBalances/LeaveBalanceDto.cs`
- Modify: `packages/api/Features/LeaveBalances/My/Data.cs`
- Modify: `packages/api/Features/LeaveBalances/My/Endpoint.cs`
- Modify: `packages/api/Features/LeaveBalances/List/Data.cs`
- Modify: `packages/api/Features/LeaveBalances/List/Endpoint.cs`
- Modify: `packages/api/Features/LeaveBalances/Seed/Data.cs`
- Modify: `packages/api/Features/LeaveRequests/Approve/Data.cs`
- Modify: `packages/api/Features/LeaveRequests/Approve/Endpoint.cs`
- Modify: `packages/api/Features/SystemConfigs/Update/Endpoint.cs`
- Modify: `packages/api/Features/Auth/DevLogin/Endpoint.cs`
- Modify: `packages/api/Features/Auth/Me/Endpoint.cs` (or create if not exists)
- Modify: `packages/api/Data/SeedHelper.cs`
- Modify: `packages/api/Program.cs`

## Implementation Steps

1. **Create ILeaveBalanceService** — interface with `Task RecalculateCurrentYearAsync(CancellationToken ct)`

2. **Create LeaveBalanceService** — implementation:
   - Inject `AppDbContext`
   - `RecalculateCurrentYearAsync`:
     - Read `max_annual_leave` from SystemConfigs (fallback 12)
     - Build roleDefaults map from `default_days_{suffix}` configs (CB.PCM, LD.PCM, GD.PGD, QTHT)
     - Query all LeaveBalances for current year, join with UserRoles
     - For each balance: `TotalDays = Math.Min(maxAnnual, roleDefaults.GetValueOrDefault(userRole, maxAnnual))`
     - If no UserRole entry: TotalDays = maxAnnual (fallback)
     - SaveChangesAsync

3. **Register in DI** — `Program.cs`: `services.AddScoped<ILeaveBalanceService, LeaveBalanceService>()`

4. **Update SystemConfigs/Update/Endpoint** — inject `ILeaveBalanceService`, call `await _balanceService.RecalculateCurrentYearAsync(ct)` after `ReplaceAllAsync`

5. **Update LeaveBalanceDto** — remove `LeaveTypeId` and `LeaveTypeName`, add `Role`. Change to: `(long Id, long UserId, int Year, decimal TotalDays, decimal UsedDays, decimal RemainingDays, string? Role)`

6. **Update Seed/Data.cs — EnsureBalancesAsync** — rewrite:
   - Check if balance exists for (UserId, Year)
   - Read `max_annual_leave` and `default_days_{role}` from SystemConfigs
   - Compute TotalDays = min(max_annual_leave, default_days_{role})
   - Create LeaveBalance with Role from userRole param, TotalDays from min() formula, UsedDays = 0
   - Remove all LeaveTypeId logic
   - Remove `ResolveTotalDays` helper method entirely

7. **Update Seed/Data.cs — EnsureBalancesForUsersAsync** — rewrite batch version:
   - For each user, check if (UserId, Year) balance exists
   - Read UserRoles for batch of users
   - Compute TotalDays per user using min() formula with their role
   - Fallback to max_annual_leave when no UserRole entry

8. **Update My/Data.cs** — remove `CorrectNpnBalanceAsync` entirely; simplify `GetByUserIdAsync`:
   - Remove LeaveType include
   - Remove LeaveTypeId from query
   - Remove LeaveTypeName from DTO projection
   - RemainingDays = TotalDays - UsedDays

9. **Update My/Endpoint.cs** — remove `userRole` parameter from `GetByUserIdAsync` call (no longer needed for NPN correction)

10. **Update List/Data.cs** — simplify query:
    - Remove LeaveType include
    - Remove LeaveTypeId from DTO projection
    - Return single record per user per year

11. **Update Approve/Data.cs — UpsertBalanceAsync** — rewrite:
    - Lookup by `(UserId, Year)` instead of `(UserId, LeaveTypeId, Year)`
    - If balance not found, create with TotalDays from min() formula (read config + UserRole)
    - Remove over-limit check (display-only enforcement)
    - Still increment `balance.UsedDays += entity.TotalDays`

12. **Update Auth/DevLogin/Endpoint.cs** — after user validation, upsert UserRole:
    - `var existing = await _db.UserRoles.FindAsync([user.UserMasterId], ct)`
    - If null: add new UserRole { UserId, Role }
    - If exists and Role differs: update Role

13. **Update or create Auth/Me endpoint** — after returning user info, upsert UserRole from JWT claim:
    - Read role from `CurrentUser.Roles.FirstOrDefault()`
    - Upsert UserRole same pattern as DevLogin

14. **Update SeedHelper.cs — SeedLeaveBalancesAsync** — simplify to use new EnsureBalancesForUsersAsync

15. **Build and verify** — `dotnet build`

## Success Criteria

- [ ] ILeaveBalanceService created and registered in DI
- [ ] LeaveBalanceService.RecalculateCurrentYearAsync correctly computes min() for all users
- [ ] SystemConfigs/Update endpoint calls RecalculateCurrentYearAsync after save
- [ ] LeaveBalanceDto has no LeaveTypeId/LeaveTypeName, has Role
- [ ] Seed creates single balance per (UserId, Year) with min() formula
- [ ] My endpoint returns single balance per year without LeaveTypeId
- [ ] List endpoint returns single balance per user per year
- [ ] Approve UpsertBalanceAsync looks up by (UserId, Year) and uses min() formula
- [ ] CorrectNpnBalanceAsync and ResolveTotalDays removed
- [ ] DevLogin upserts UserRole on login
- [ ] GET /me upserts UserRole from JWT claims
- [ ] `dotnet build` succeeds with zero errors

## Risk Assessment

- **Approve flow regression**: Medium — UpsertBalanceAsync change is critical; must verify approved requests still deduct days correctly
- **Seed data mismatch**: Low — reading configs from SystemConfigs is straightforward; fallback 12 covers missing config
- **Admin List endpoint**: Low — simplification removes per-type breakdown but LeaveRequests can still be queried
- **Recalculation performance**: Low — batch query for <100 users is instant; optimize later if needed
- **UserRole stale data**: Low — GET /me syncs role on every page load; recalculate uses DB role