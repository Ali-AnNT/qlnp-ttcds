---
phase: 2
title: "Generate migration"
status: pending
priority: P1
effort: "15m"
dependencies: [1]
---

# Phase 2: Generate migration

## Overview

Generate a single EF Core migration that updates 3 existing LeaveType rows, inserts 2 new LeaveType rows, and inserts 9 LeaveConfig seed rows.

## Requirements

- Migration must produce UpdateData for Id=1,2,3 (code/name/days/description changes)
- Migration must produce InsertData for Id=4,5 (new LeaveType rows)
- Migration must produce InsertData for Id=1-9 (new LeaveConfig rows)
- Migration must be reversible (Down method restores old data)

## Related Code Files

- Create: `packages/api/Data/Migrations/{timestamp}_UpdateLeaveTypeAndConfigSeedData.cs`
- Create: `packages/api/Data/Migrations/{timestamp}_UpdateLeaveTypeAndConfigSeedData.Designer.cs`
- Modify: `packages/api/Data/Migrations/AppDbContextModelSnapshot.cs`

## Implementation Steps

1. Navigate to `packages/api/`
2. Run: `dotnet ef migrations add UpdateLeaveTypeAndConfigSeedData`
3. Inspect generated migration — verify it contains:
   - `UpdateData` for LeaveType Id=1: Code "annual"→"NPN", DefaultDays 12→12 (unchanged), Description added
   - `UpdateData` for LeaveType Id=2: Code "sick"→"NO", Name "Ốm đau"→"Nghỉ ốm", DefaultDays 0→30, Description added
   - `UpdateData` for LeaveType Id=3: Code "personal"→"NVR", Name "Việc riêng"→"Nghỉ việc riêng", Description added
   - `InsertData` for LeaveType Id=4 (NKL) and Id=5 (NTS)
   - `InsertData` for LeaveConfig Id=1 through Id=9
4. Verify Down method reverses all changes (deletes configs 1-9, deletes types 4-5, restores types 1-3)

## Success Criteria

- [ ] Migration generated without errors
- [ ] Up method updates 3 LeaveType rows + inserts 2 LeaveType rows + inserts 9 LeaveConfig rows
- [ ] Down method reverses all changes
- [ ] `dotnet build` succeeds

## Risk Assessment

Low risk — standard EF migration. The migration is reversible. DefaultDays change (0→30) only affects new LeaveBalances. LeaveConfig seed is new data with no existing rows to conflict.