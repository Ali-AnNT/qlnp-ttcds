---
day: 2
title: Scaffold System Tables
status: completed
priority: P0
effort: 0.5 day
date: 2026-05-13
---

# Day 2: Scaffold System Tables

## Context Links

- `docs/vision/brd.md`
- `docs/vision/srs.md`
- `packages/api/Entities/UserMaster.cs`
- `packages/api/Entities/DmDonvi.cs`

## Overview

Scaffold existing SQL Server tables for users and departments. These tables are authoritative system data and must stay read-only from QLNP migrations.

## Key Insights

- `USER_MASTER` has existing users.
- `DM_DONVI` has existing department structure.
- Do not create replacement `employees` or `departments` tables.

## Requirements

- Map `USER_MASTER` to `UserMaster`.
- Map `DM_DONVI` to `DmDonvi`.
- Exclude both from EF migrations.

## Architecture

QLNP tables reference system tables by bigint IDs. API joins system tables for display/filtering.

## Related Code Files

| Action | File |
|--------|------|
| Created | `packages/api/Entities/UserMaster.cs` |
| Created | `packages/api/Entities/DmDonvi.cs` |
| Modified | `packages/api/Data/AppDbContext.cs` |

## Implementation Steps

1. Scaffold or create entity classes matching SQL Server columns.
2. Register DbSet properties in `AppDbContext`.
3. Configure table names and keys.
4. Call `ExcludeFromMigrations()` for system tables.
5. Verify no migration tries to create or alter system tables.

## Todo List

- [x] `UserMaster` mapped.
- [x] `DmDonvi` mapped.
- [x] System tables excluded from migrations.

## Success Criteria

- EF model builds.
- Initial migration excludes `USER_MASTER` and `DM_DONVI`.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| EF migration touches system tables | Keep `ExcludeFromMigrations()` and review migration diffs |

## Security Considerations

- Never expose password-like fields. Current auth is gateway-driven.

## Next Steps

- Add QLNP-owned entities and migration.
