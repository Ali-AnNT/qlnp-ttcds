# Brainstorm: LeaveConfig (ApprovalConfig) Seed Data

**Date:** 2026-05-27  
**Status:** Approved  
**Related Plan:** `plans/260527-0317-update-leave-type-seed-data/`

## Problem Statement

LeaveConfig table has no seed data. When the app starts fresh, approval configs are empty — leave requests default to 2-level approval (hardcoded fallback in `Approve/Endpoint.cs:39`). Need default configs so each leave type has a defined approval flow from first run.

## Requirements

- NKL (Nghỉ không lương) = 1-level approval (PCM only)
- NPN, NO, NVR, NTS = 2-level approval (PCM → PGD)
- Seed data must be idempotent (EF HasData)
- Combined with existing LeaveType update migration
- Admins can override at runtime via `PUT /api/config`

## Current State Analysis

### Entity Model

```csharp
public class LeaveConfig
{
    public long Id { get; set; }           // Auto-increment
    public long LeaveTypeId { get; set; }  // FK to LeaveType
    public int ApprovalLevel { get; set; } // 1 or 2
    public string ApproverRole { get; set; } // "LD.PCM" or "GD.PGD"
    public LeaveType LeaveType { get; set; } // Navigation
}
```

### Approval Flow Logic (Approve/Endpoint.cs)

- `GetApprovalLevelsAsync(leaveTypeId)` queries `LeaveConfigs` for the given leave type
- If no configs found → defaults to `maxLevel = 2` (2-level)
- If `maxLevel <= 1` → 1-level: pending → approved
- If `maxLevel > 1` → 2-level: pending → approved_leader → approved

### Existing LeaveType Seed (AppDbContext.cs:153-157)

Currently 3 leave types (annual/sick/personal). Plan `260527-0317` updates to 5 Vietnamese-code types (NPN/NO/NVR/NKL/NTS).

## Proposed Approach: HasData in AppDbContext

Add `modelBuilder.Entity<LeaveConfig>().HasData(...)` alongside the existing LeaveType HasData block.

### Seed Data Mapping

| Config Id | LeaveTypeId | LeaveType | ApprovalLevel | ApproverRole | Flow |
|-----------|------------|-----------|---------------|--------------|------|
| 1 | 1 | NPN (Nghỉ phép năm) | 1 | LD.PCM | 2-level |
| 2 | 1 | NPN | 2 | GD.PGD | ↑ |
| 3 | 2 | NO (Nghỉ ốm) | 1 | LD.PCM | 2-level |
| 4 | 2 | NO | 2 | GD.PGD | ↑ |
| 5 | 3 | NVR (Nghỉ việc riêng) | 1 | LD.PCM | 2-level |
| 6 | 3 | NVR | 2 | GD.PGD | ↑ |
| 7 | 4 | NKL (Nghỉ không lương) | 1 | LD.PCM | **1-level** |
| 8 | 5 | NTS (Nghỉ thai sản) | 1 | LD.PCM | 2-level |
| 9 | 5 | NTS | 2 | GD.PGD | ↑ |

### Why HasData over SeedHelper

| Criteria | HasData | SeedHelper |
|----------|---------|------------|
| Idempotent | Yes — EF manages | Manual upsert logic needed |
| Migration-tracked | Yes — changes in migration files | No — runtime only |
| Consistent with LeaveType pattern | Yes | No |
| Override at runtime | Still possible via PUT /api/config | Same |
| Risk | Low — standard EF pattern | Medium — race conditions possible |

### Implementation Plan

1. **Update `AppDbContext.OnModelCreating`**: Add `LeaveConfig` HasData block after LeaveType HasData
2. **Update LeaveType HasData**: Already planned in phase-01 of `260527-0317`
3. **Generate single migration**: `dotnet ef migrations add UpdateLeaveTypeAndConfigSeedData`
4. **Verify**: Migration includes InsertData for both LeaveType updates and LeaveConfig inserts
5. **Test**: App starts, configs seeded, approval flow works for all 5 leave types

### Files to Modify

- `packages/api/Data/AppDbContext.cs` — Add LeaveConfig HasData, update LeaveType HasData
- `packages/api/Data/Migrations/` — New migration (auto-generated)

### Risk Assessment

- **Low risk**: Seed data only, no business logic change
- **EF HasData with Identity column**: Works correctly — EF inserts with explicit Ids for seed rows
- **FK consistency**: LeaveConfig.LeaveTypeId references LeaveType.Id which are seeded in the same migration
- **Runtime override**: Admins can still use `PUT /api/config` to change configs after seed

## Alternatives Considered

1. **SeedHelper runtime seed** — More flexible but requires upsert logic, not migration-tracked
2. **SQL script** — Bypasses EF, harder to maintain
3. **Config API default seeding** — Already possible but requires manual setup after each DB reset

## Open Questions

None — all clarified.