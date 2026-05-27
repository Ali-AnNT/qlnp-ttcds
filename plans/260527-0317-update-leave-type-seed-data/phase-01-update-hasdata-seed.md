---
phase: 1
title: "Update HasData seed (LeaveType + LeaveConfig)"
status: pending
priority: P1
effort: "30m"
dependencies: []
---

# Phase 1: Update HasData seed (LeaveType + LeaveConfig)

## Overview

Replace 3 LeaveType HasData rows with 5 Vietnamese-code rows and add 9 LeaveConfig HasData rows in `AppDbContext.OnModelCreating`.

## Requirements

### LeaveType
- Replace codes: annual→NPN, sick→NO, personal→NVR
- Add 2 new types: NKL (Nghỉ không lương, 0 days), NTS (Nghỉ thai sản, 180 days)
- Update Name for Id=2: "Ốm đau" → "Nghỉ ốm"
- Update DefaultDays for Id=2: 0 → 30
- Add Description to all 5 rows

### LeaveConfig
- NKL (Id=4) = 1-level approval (LD.PCM only)
- NPN (Id=1), NO (Id=2), NVR (Id=3), NTS (Id=5) = 2-level approval (LD.PCM → GD.PGD)
- 9 config rows total with explicit Ids (1-9)
- Config Ids must be stable for EF HasData migration tracking

## Architecture

LeaveConfig entity FK → LeaveType.Id. Both seeded in same OnModelCreating block ensures FK consistency at migration time.

## Related Code Files

- Modify: `packages/api/Data/AppDbContext.cs` (lines 129-157)

## Implementation Steps

1. Open `packages/api/Data/AppDbContext.cs`
2. Replace the `modelBuilder.Entity<LeaveType>().HasData(...)` block (lines 153-157) with 5 Vietnamese-code entries
3. Add `modelBuilder.Entity<LeaveConfig>().HasData(...)` block after LeaveType HasData with 9 config entries:

```csharp
modelBuilder.Entity<LeaveType>().HasData(
    new LeaveType { Id = 1, Name = "Nghỉ phép năm", Code = "NPN", DefaultDays = 12, Description = "Nghỉ phép năm theo quy định", IsActive = true },
    new LeaveType { Id = 2, Name = "Nghỉ ốm", Code = "NO", DefaultDays = 30, Description = "Nghỉ ốm đau có giấy xác nhận", IsActive = true },
    new LeaveType { Id = 3, Name = "Nghỉ việc riêng", Code = "NVR", DefaultDays = 3, Description = "Nghỉ việc riêng có lương", IsActive = true },
    new LeaveType { Id = 4, Name = "Nghỉ không lương", Code = "NKL", DefaultDays = 0, Description = "Nghỉ không hưởng lương", IsActive = true },
    new LeaveType { Id = 5, Name = "Nghỉ thai sản", Code = "NTS", DefaultDays = 180, Description = "Nghỉ thai sản", IsActive = true }
);

modelBuilder.Entity<LeaveConfig>().HasData(
    new LeaveConfig { Id = 1, LeaveTypeId = 1, ApprovalLevel = 1, ApproverRole = "LD.PCM" },
    new LeaveConfig { Id = 2, LeaveTypeId = 1, ApprovalLevel = 2, ApproverRole = "GD.PGD" },
    new LeaveConfig { Id = 3, LeaveTypeId = 2, ApprovalLevel = 1, ApproverRole = "LD.PCM" },
    new LeaveConfig { Id = 4, LeaveTypeId = 2, ApprovalLevel = 2, ApproverRole = "GD.PGD" },
    new LeaveConfig { Id = 5, LeaveTypeId = 3, ApprovalLevel = 1, ApproverRole = "LD.PCM" },
    new LeaveConfig { Id = 6, LeaveTypeId = 3, ApprovalLevel = 2, ApproverRole = "GD.PGD" },
    new LeaveConfig { Id = 7, LeaveTypeId = 4, ApprovalLevel = 1, ApproverRole = "LD.PCM" },
    new LeaveConfig { Id = 8, LeaveTypeId = 5, ApprovalLevel = 1, ApproverRole = "LD.PCM" },
    new LeaveConfig { Id = 9, LeaveTypeId = 5, ApprovalLevel = 2, ApproverRole = "GD.PGD" }
);
```

4. Verify `LeaveType` entity has `Description` property (nullable string) — confirmed: `public string? Description { get; set; }`
5. Verify `LeaveConfig` entity matches expected shape — confirmed: `Id`, `LeaveTypeId`, `ApprovalLevel`, `ApproverRole`
6. Run `dotnet build` to verify compilation

## Success Criteria

- [ ] HasData block has 5 LeaveType entries with Vietnamese codes
- [ ] HasData block has 9 LeaveConfig entries (NKL=1-level, others=2-level)
- [ ] All 5 LeaveType entries have Description field
- [ ] Ids 1-3 updated, Ids 4-5 new for LeaveType
- [ ] Config Id 7 (NKL) has only 1 level entry
- [ ] Code compiles without errors

## Risk Assessment

Low risk — seed data only, no business logic change. Existing FK references use Id, not Code. LeaveConfig seed provides defaults; runtime Config API overrides remain functional.