---
phase: 1
title: "Entity & Migration"
status: pending
priority: P1
effort: "4h"
dependencies: []
---

# Phase 1: Entity & Migration

## Overview

Remove `LeaveTypeId` from `LeaveBalance` entity, add `Role` column, create `UserRole` entity, change unique index to `(UserId, Year)`, and create EF Core migrations that: (1) create UserRoles table, (2) consolidate existing per-leave-type LeaveBalances into single records with summed `UsedDays` and `TotalDays` = `min(max_annual_leave, default_days_{role})`.

## Requirements

- Functional: LeaveBalance stores 1 record per (UserId, Year) with Role column; UserRoles table stores (UserId, Role, UpdatedAt)
- Non-functional: Migrations must be idempotent, reversible, and preserve existing UsedDays data

## Architecture

```
Before:
  LeaveBalance (UserId, LeaveTypeId, Year) — unique index on all 3
  No UserRoles table

After:
  LeaveBalance (UserId, Year, Role) — unique index on (UserId, Year)
          LeaveTypeId column removed, LeaveType navigation removed
          Role column added (nvarchar(50), nullable for migration safety)
  UserRole (UserId PK, Role nvarchar(50), UpdatedAt datetime2)
          FK → USER_MASTER(User_MasterID)
```

Migration SQL strategy:
1. Create UserRoles table with FK to USER_MASTER
2. Populate UserRoles from DevLogin hardcoded mapping (dev) or leave empty (production will populate via /me)
3. Create temp table with consolidated data:
   - UserId, Year, SUM(UsedDays)
   - TotalDays = min(max_annual_leave, default_days_{role}) using UserRole join
   - Role from UserRole (NULL if no UserRole entry)
4. Truncate old LeaveBalances
5. Insert consolidated rows
6. Drop LeaveTypeId column and old index
7. Add Role column (nullable initially)
8. Create new unique index on (UserId, Year)

## Related Code Files

- Modify: `packages/api/Entities/LeaveBalance.cs`
- Create: `packages/api/Entities/UserRole.cs`
- Modify: `packages/api/Data/AppDbContext.cs`
- Create: `packages/api/Data/Migrations/<timestamp>_AddUserRolesAndSimplifyLeaveBalance.cs`

## Implementation Steps

1. **Create UserRole entity** — `UserRole.cs` with UserId (long, PK), Role (string, required), UpdatedAt (DateTime, default SYSUTCDATETIME)

2. **Update LeaveBalance entity** — remove `LeaveTypeId` property, remove `LeaveType` navigation property, add `Role` property (string, nullable)

3. **Update AppDbContext** — add `DbSet<UserRole>`, configure UserRole with PK UserId, FK to USER_MASTER, configure LeaveBalance: change unique index from `(UserId, LeaveTypeId, Year)` to `(UserId, Year)`, remove LeaveType relationship, remove LeaveTypeId configuration

4. **Create EF Core migration** — `dotnet ef migrations add AddUserRolesAndSimplifyLeaveBalance`

5. **Edit migration Up() method** — add raw SQL to:
   - Create UserRoles table
   - Insert default UserRoles from DevLogin mapping (quantri→QTHT, etc.) for dev environments
   - Consolidate LeaveBalances: SELECT UserId, Year, SUM(UsedDays), Role from UserRole join, compute TotalDays = min(max_annual_leave, default_days_{role})
   - Fallback TotalDays = max_annual_leave when no UserRole entry exists
   - Drop old IX index on (UserId, LeaveTypeId, Year)
   - Drop LeaveTypeId column
   - Add Role column (nullable)
   - Create new IX index on (UserId, Year)

6. **Edit migration Down() method** — reverse: add LeaveTypeId column back, recreate old index, drop UserRoles table, restore per-type rows from LeaveRequest data (best-effort)

7. **Update SeedHelper.cs** — remove LeaveBalances.HasData if it references LeaveTypeId

8. **Build and verify** — `dotnet build`

## Success Criteria

- [ ] UserRole entity created with UserId, Role, UpdatedAt
- [ ] LeaveBalance entity has no LeaveTypeId or LeaveType property, has Role property
- [ ] AppDbContext has UserRole DbSet and unique index on LeaveBalance(UserId, Year)
- [ ] Migration Up() creates UserRoles table, consolidates LeaveBalances with correct TotalDays
- [ ] Migration Down() provides reasonable rollback
- [ ] `dotnet build` succeeds with zero errors

## Risk Assessment

- **Data loss**: Low — migration uses SUM(UsedDays) to preserve all used days
- **UserRole population**: Medium — dev mapping covers test users; production relies on GET /me to populate
- **Rollback complexity**: Medium — restoring per-type rows requires LeaveRequest data or backup; Down() warns about limited restoration
- **Concurrent access**: Low — migration runs at app startup; document that app should be offline during migration