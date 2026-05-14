---
day: 3
title: QLNP Entities and Migration
status: completed
priority: P0
effort: 1 day
date: 2026-05-13
---

# Day 3: QLNP Entities and Migration

## Context Links

- `docs/vision/srs.md`
- `packages/api/Entities`
- `packages/api/Data/Migrations/20260513062929_InitialCreate.cs`

## Overview

Create QLNP-owned Code First entities and initial migration. Keep schema minimal and aligned with BRD/SRS.

## Key Insights

- App-owned tables: `UserRoles`, `LeaveTypes`, `LeaveBalances`, `LeaveRequests`, `LeaveConfigs`.
- Use bigint IDs to align with system tables.
- Seed minimum data only.

## Requirements

- Define relationships to `UserMaster` and `DmDonvi`.
- Add unique constraints where required.
- Add seed data for leave types and admin role.

## Architecture

`AppDbContext` owns QLNP tables and references read-only system tables.

## Related Code Files

| Action | File |
|--------|------|
| Created | `packages/api/Entities/UserRole.cs` |
| Created | `packages/api/Entities/LeaveType.cs` |
| Created | `packages/api/Entities/LeaveBalance.cs` |
| Created | `packages/api/Entities/LeaveRequest.cs` |
| Created | `packages/api/Entities/LeaveConfig.cs` |
| Created | `packages/api/Data/Migrations/20260513062929_InitialCreate.cs` |

## Implementation Steps

1. Add entity classes.
2. Configure relationships in `OnModelCreating`.
3. Add indexes and constraints.
4. Seed default leave types and admin role.
5. Generate and review initial migration.

## Todo List

- [x] Five QLNP entities created.
- [x] Relationships configured.
- [x] Initial migration created.
- [x] Seed data added.

## Success Criteria

- Migration creates only QLNP tables.
- EF model snapshot matches expected schema.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Wrong FK type | Keep bigint for all system-table references |

## Security Considerations

- Enforce authorization in endpoints, not DB RLS.

## Next Steps

- Add current-user middleware and feature folders.
