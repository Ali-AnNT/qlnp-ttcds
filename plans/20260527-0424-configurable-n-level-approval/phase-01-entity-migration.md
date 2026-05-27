---
phase: 1
title: "Entity & Migration"
status: pending
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Entity & Migration

## Overview

Add `ApprovedLevel` column to `LeaveRequest`, update `LeaveRequestDto` and mapping, create migration. Migrate existing `approved_leader` status rows.

## Requirements

- Functional: Add `ApprovedLevel` (int, default 0) to `LeaveRequest` entity
- Functional: Update DTO and mapping to include `approvedLevel`
- Functional: Migrate existing `approved_leader` rows: set `ApprovedLevel = 1`, change status to `pending` (they're still in progress)
- Non-functional: Migration must be idempotent and safe for production data

## Architecture

**Entity change:**
```
LeaveRequest.ApprovedLevel (int, default 0, NOT NULL)
```
- `ApprovedLevel = 0` → no approvals yet (status = pending)
- `ApprovedLevel = 1` → level 1 approved (still pending if maxLevel > 1)
- `ApprovedLevel = maxLevel` → fully approved (status = approved)

**Status transition:**
- `approved_leader` rows → `ApprovedLevel = 1`, status stays `pending` (they're awaiting next level)
- `approved` rows → `ApprovedLevel` calculated from LeaveConfig max level (they're done)
- `rejected` / `cancelled` rows → `ApprovedLevel` stays at whatever level they were at

**LeaveConfig change:**
- Remove `CK_LeaveConfig_ApprovalLevel` check constraint (currently `ApprovalLevel >= 1`)
- Keep it — the constraint `ApprovalLevel >= 1` is still valid and desired

## Related Code Files

- Modify: `packages/api/Entities/LeaveRequest.cs` — add `ApprovedLevel` property
- Modify: `packages/api/Features/LeaveRequests/LeaveRequestDto.cs` — add `ApprovedLevel` field
- Modify: `packages/api/Features/LeaveRequests/LeaveRequestMapping.cs` — map `ApprovedLevel`
- Modify: `packages/api/Data/AppDbContext.cs` — add column configuration
- Modify: `packages/api/Data/SeedHelper.cs` — add migration for `approved_leader` → recalculate
- Create: `packages/api/Data/Migrations/{timestamp}_AddApprovedLevel.cs`

## Implementation Steps

1. Add `ApprovedLevel` property to `LeaveRequest.cs`:
   ```csharp
   public int ApprovedLevel { get; set; } = 0;
   ```

2. Update `LeaveRequestDto.cs` — add `int ApprovedLevel` field after `Status`

3. Update `LeaveRequestMapping.cs` — add `e.ApprovedLevel` to mapping

4. Update `AppDbContext.cs` — add column config in `OnModelCreating`:
   ```csharp
   entity.Property(e => e.ApprovedLevel).HasDefaultValue(0);
   ```

5. Update `LeaveRequestAudit` — also track `ApprovedLevel` changes in audit (FieldName = "ApprovedLevel")

6. Create EF Core migration:
   ```bash
   cd packages/api && dotnet ef migrations add AddApprovedLevel
   ```

7. Add migration step to `SeedHelper.cs` — a new method `MigrateApprovedLeaderStatusAsync`:
   - For rows with `Status = "approved_leader"`: set `ApprovedLevel = 1`, `Status = "pending"`
   - For rows with `Status = "approved"`: set `ApprovedLevel` to max LeaveConfig level for that LeaveType (they were fully approved)
   - Call this method from `Program.cs` startup alongside existing `MigrateApprovedDirectorStatusAsync`

8. Remove `MigrateApprovedDirectorStatusAsync` (or merge into the new migration) — `approved_director` was already migrated to `approved`, now we consolidate both legacy statuses

9. Verify migration with `dotnet ef database update` and test with existing data

## Success Criteria

- [ ] `LeaveRequest` entity has `ApprovedLevel` column with default 0
- [ ] `LeaveRequestDto` includes `approvedLevel` field
- [ ] `LeaveRequestMapping` maps `ApprovedLevel` correctly
- [ ] Migration adds column and migrates `approved_leader` rows correctly
- [ ] Existing `approved` rows get `ApprovedLevel` set to max config level for their LeaveType
- [ ] No `approved_leader` or `approved_director` status values remain in database after migration
- [ ] `dotnet build` succeeds with no errors

## Validation Decisions

- **approved_leader migration**: Convert to `status = "pending", ApprovedLevel = 1` (still awaiting next level)
- **ApprovedBy field**: Keep as last approver only (each level's approver tracked via LeaveRequestAudit)
- **Cancel logic**: Cannot cancel fully approved requests (status = "approved"). Only pending and partially approved (ApprovedLevel < maxLevel) are cancellable.

## Risk Assessment

- **Data loss**: None — migration adds column with default, updates existing rows
- **Backward compat**: Frontend still sending/receiving `approved_leader` will break after this change. Deploy backend first, then frontend.
- **ApprovedLevel for approved rows**: Need to calculate from LeaveConfig. If no config exists, default to `ApprovedLevel = 1`

## Next Steps

- Phase 2 depends on this phase being complete