---
title: "Channel Service for Config-Triggered Leave Balance Recalculation"
type: brainstorm
date: "2026-05-28"
plan: "260528-0409-simplify-leave-balance"
status: approved
---

# Brainstorm: Channel Service — Config-Triggered Leave Balance Recalculation

## Problem Statement

When admin updates `SystemConfigs` (especially `max_annual_leave` or `default_days_{role}`), all users' `LeaveBalance.TotalDays` for the current year must be recalculated using `min(max_annual_leave, default_days_{role})`. Currently there is no mechanism to propagate config changes to existing balances — they are only set during seed and never updated.

## Key Decisions (from Discovery)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Plan integration | Supplement simplify-leave-balance plan | Keep (UserId, Year) model, add min() logic + channel service |
| TotalDays formula | `min(max_annual_leave, default_days_{role})` | Cap per-role default by global max; role default takes effect only when lower |
| Channel type | Service Interface (ILeaveBalanceService) | KISS — one handler, no pub/sub needed, no new dependency |
| Over-limit handling | Reduce TotalDays, keep UsedDays unchanged | Remaining can go negative; no data loss |
| Scope | Current year only | Admin changes should not retroactively alter past years |
| Role storage | New `UserRoles` table (UserId, Role, UpdatedAt) | Role not in DB (JWT-only); needed for batch recalculation of all users |
| Role sync | Update on login (DevLogin + SSO) | Keeps UserRoles current without admin intervention |

## Current System Analysis

### SystemConfigs (current values)
- `max_annual_leave` = 12
- `default_days_CB.PCM` = 14 → min(12, 14) = **12**
- `default_days_LD.PCM` = 14 → min(12, 14) = **12**
- `default_days_GD.PGD` = 16 → min(12, 16) = **12**
- `default_days_QTHT` = 12 → min(12, 12) = **12**

Currently all roles resolve to 12. The min() formula matters when:
- Admin increases `max_annual_leave` above a role's default (e.g., 15 → CB.PCM gets 14)
- Admin decreases a role's default below `max_annual_leave` (e.g., GD.PGD drops to 10 → gets 10)

### Role Resolution Problem

**Critical gap:** User roles exist only in JWT claims, not in the database. `UserMaster` is scaffolded from external DB (`ExcludeFromMigrations`) and has no Role column. Batch recalculation requires per-user role resolution → must persist roles.

**Solution:** New `UserRoles` table in app-managed schema, updated when users log in.

## Recommended Solution: Service Interface Pattern

### Architecture

```
SystemConfigs/Update/Endpoint
    │
    ├── _data.ReplaceAllAsync(req, ct)     // Save configs
    │
    └── _balanceService.RecalculateCurrentYearAsync(ct)  // Notify channel
                    │
                    ├── Read max_annual_leave from SystemConfigs
                    ├── Read all default_days_{role} from SystemConfigs
                    ├── Read all UserRoles for current-year balance users
                    ├── For each LeaveBalance (current year):
                    │   └── TotalDays = min(max_annual_leave, default_days[userRole])
                    └── SaveChangesAsync()
```

### New Files

| File | Purpose |
|------|---------|
| `Services/ILeaveBalanceService.cs` | Interface with `RecalculateCurrentYearAsync()` |
| `Services/LeaveBalanceService.cs` | Implementation: batch recalculation logic |
| `Entities/UserRole.cs` | Entity: UserId (PK), Role, UpdatedAt |
| `Features/Auth/DevLogin/Endpoint.cs` | Modified: upsert UserRole on login |
| `Features/Auth/Me/Endpoint.cs` | Modified: upsert UserRole on token validation (if exists) |
| `Data/Migrations/<ts>_AddUserRoles.cs` | Migration: create UserRoles table |

### Modified Files

| File | Change |
|------|--------|
| `Data/AppDbContext.cs` | Add DbSet<UserRole>, seed, register |
| `Features/SystemConfigs/Update/Endpoint.cs` | Inject ILeaveBalanceService, call after save |
| `Features/LeaveBalances/Seed/Data.cs` | Remove per-LeaveType loop, use min() formula, write UserRole |
| `Features/LeaveBalances/My/Data.cs` | Remove CorrectNpnBalanceAsync, simplify to single record |
| `Features/LeaveBalances/My/Endpoint.cs` | Remove userRole param from GetByUserIdAsync |
| `Features/LeaveRequests/Approve/Data.cs` | Update UpsertBalanceAsync for (UserId, Year) lookup |
| `Features/LeaveBalances/List/Data.cs` | Remove LeaveType references |
| `Features/LeaveBalances/LeaveBalanceDto.cs` | Remove LeaveTypeId, LeaveTypeName; add Role |
| `Entities/LeaveBalance.cs` | Remove LeaveTypeId, LeaveType navigation; add Role column |
| `Data/SeedHelper.cs` | Update for simplified balance model |
| `Program.cs` | Register ILeaveBalanceService in DI |

### Database Changes

**UserRoles table (new):**
```sql
CREATE TABLE UserRoles (
    UserId BIGINT PRIMARY KEY,
    Role NVARCHAR(50) NOT NULL,
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_UserRoles_UserMaster_UserId FOREIGN KEY (UserId) 
        REFERENCES USER_MASTER(User_MasterID)
);
```

**LeaveBalance changes:**
- Remove `LeaveTypeId` column
- Remove `LeaveType` navigation property
- Add `Role` column (NVARCHAR(50), nullable for migration safety)
- Change unique index from `(UserId, LeaveTypeId, Year)` to `(UserId, Year)`

**Migration strategy for existing data:**
1. Create UserRoles from DevLogin hardcoded mapping (dev) / JWT claims (prod)
2. Consolidate LeaveBalances: SUM(UsedDays) per (UserId, Year), TotalDays = min(max_annual_leave, default_days_{role})
3. Drop LeaveTypeId column and old index
4. Create new unique index on (UserId, Year)

### Recalculation Logic (LeaveBalanceService)

```csharp
public async Task RecalculateCurrentYearAsync(CancellationToken ct)
{
    var year = DateTime.UtcNow.Year;
    
    // Read configs
    var configs = await _db.SystemConfigs.ToDictionaryAsync(
        c => c.ConfigKey, c => c.ConfigValue, ct);
    
    if (!configs.TryGetValue("max_annual_leave", out var maxStr))
        maxStr = "12";
    var maxAnnual = decimal.Parse(maxStr);
    
    // Build role → default_days map
    var roleDefaults = new Dictionary<string, decimal>();
    foreach (var role in new[] { "CB.PCM", "LD.PCM", "GD.PGD", "QTHT" })
    {
        if (configs.TryGetValue($"default_days_{role}", out var val))
            roleDefaults[role] = decimal.Parse(val);
    }
    
    // Get all current-year balances with their roles
    var balances = await _db.LeaveBalances
        .Where(b => b.Year == year)
        .Join(_db.UserRoles, b => b.UserId, r => r.UserId, (b, r) => new { Balance = b, r.Role })
        .ToListAsync(ct);
    
    foreach (var item in balances)
    {
        var suffix = item.Role.Replace("QLNP.", "");
        var roleDefault = roleDefaults.GetValueOrDefault(suffix, maxAnnual);
        item.Balance.TotalDays = Math.Min(maxAnnual, roleDefault);
        // UsedDays unchanged — remaining can go negative
    }
    
    await _db.SaveChangesAsync(ct);
}
```

### Role Sync on Login

```csharp
// In DevLogin/Endpoint.cs (and equivalent SSO endpoint):
// After user validation, upsert UserRole
var existingRole = await _db.UserRoles.FindAsync(new object[] { user.UserMasterId }, ct);
if (existingRole is null)
    _db.UserRoles.Add(new UserRole { UserId = user.UserMasterId, Role = role });
else if (existingRole.Role != role)
    existingRole.Role = role;
await _db.SaveChangesAsync(ct);
```

## Integration with Simplify Plan

This brainstorm **supplements** the existing simplify-leave-balance plan. Changes to each phase:

| Phase | Original | Supplement |
|-------|----------|------------|
| **Phase 1** | Remove LeaveTypeId, consolidate data | Add UserRoles table, add Role to LeaveBalance, update migration SQL to populate Role from UserRoles |
| **Phase 2** | Refactor backend logic | Add ILeaveBalanceService + implementation, update Seed to use min(), update SystemConfigs/Update to call recalculate, update DevLogin to sync UserRole, remove CorrectNpnBalanceAsync |
| **Phase 3** | Frontend updates | Show role on balance display (optional), update ConfigPage to show per-role defaults with min() preview |
| **Phase 4** | Verification | Test recalculate endpoint, verify TotalDays = min(), verify over-limit (remaining negative), verify UserRole sync on login |

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| UserRoles table empty on first run | High (dev) | Seed from DevLogin mapping; production SSO writes on login |
| Role mismatch between JWT and DB | Medium | My endpoint checks and updates UserRole; recalculate uses DB as source of truth |
| Performance: recalculate all users | Low | Single batch query, in-memory computation. At <100 users, instant. Optimize later if needed |
| Concurrent config update + balance access | Low | EF Core handles row-level concurrency; recalculate runs synchronously after config save |

## Resolved Questions

1. **Role sync via GET /me**: UserRole upsert happens in the `/me` endpoint. If UserRole row missing → create from JWT claim. If exists but role claim differs → update. This ensures role stays current for all active users (called on every page load). DevLogin also writes to UserRoles.
2. **Users without UserRole**: Fallback to `max_annual_leave` (most permissive). No user gets 0 days due to missing role data.

## Next Steps

User approved → proceed to `/ck:plan` to update the simplify-leave-balance plan phases with these supplements.