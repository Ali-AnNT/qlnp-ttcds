---
phase: 1
title: "Setup: Migration + Shared Utilities"
status: complete
priority: P0
effort: "30m"
dependencies: []
---

# Phase 1: Setup — Migration + Shared Utilities

## Overview

Thêm `RequestedApproverId` vào entity `LeaveRequest`, tạo EF migration, và viết `BusinessDayCalculator` dùng chung cho Create/Update.

## Requirements

- Functional:
  - `LeaveRequest.RequestedApproverId` nullable long
  - Business days = Mon–Fri inclusive giữa StartDate và EndDate
- Non-functional:
  - Migration clean (no data loss)
  - Calculator là static utility, không có DI dependency

## Architecture

```
Entities/LeaveRequest.cs          ← thêm property
Features/LeaveRequests/
└── BusinessDayCalculator.cs      ← static class, CountBusinessDays()
Data/Migrations/
└── YYYYMMDD_AddRequestedApproverIdToLeaveRequests.cs
```

## Related Code Files

- Modify: `packages/api/Entities/LeaveRequest.cs` — thêm `RequestedApproverId` + nav prop
- Modify: `packages/api/Entities/UserMaster.cs` — thêm `DonVi` nav prop
- Modify: `packages/api/Data/AppDbContext.cs` — FK configs + seed role data
- Modify: `packages/api/Features/LeaveTypes/Create/Endpoint.cs` — `Roles("QTHT")` (từ "quantri")
- Modify: `packages/api/Features/LeaveTypes/Update/Endpoint.cs` — `Roles("QTHT")`
- Modify: `packages/api/Features/LeaveTypes/Delete/Endpoint.cs` — `Roles("QTHT")`
- Create: `packages/api/Features/LeaveRequests/BusinessDayCalculator.cs`
- Create: EF migration (auto-generated)

## Implementation Steps

1. **Modify entity** — thêm vào `LeaveRequest.cs`:
   ```csharp
   public long? RequestedApproverId { get; set; }
   public virtual UserMaster? RequestedApprover { get; set; }
   ```

2. **Modify UserMaster entity** — thêm nav prop đến DmDonvi:
   ```csharp
   public virtual DmDonvi? DonVi { get; set; }
   ```

3. **Update AppDbContext.OnModelCreating** — thêm FK configs:
   ```csharp
   // LeaveRequest.RequestedApproverId → UserMaster
   modelBuilder.Entity<LeaveRequest>(entity =>
   {
       // ... existing config ...
       entity.HasOne(e => e.RequestedApprover)
             .WithMany()
             .HasForeignKey(e => e.RequestedApproverId)
             .OnDelete(DeleteBehavior.SetNull);
   });

   // UserMaster.DonViId → DmDonvi
   modelBuilder.Entity<UserMaster>(entity =>
   {
       // ... existing config ...
       entity.HasOne(e => e.DonVi)
             .WithMany()
             .HasForeignKey(e => e.DonViId)
             .OnDelete(DeleteBehavior.Restrict);
   });
   ```

4. **Update seed data** — thêm role entries theo BRD:
   ```csharp
   modelBuilder.Entity<UserRole>().HasData(
       new UserRole { UserId = 1, Role = "QTHT" },       // đổi "quantri" → "QTHT"
       new UserRole { UserId = 2, Role = "CB.PCM" },      // seed dev user
       new UserRole { UserId = 3, Role = "LD.PCM" },      // seed dev user
       new UserRole { UserId = 4, Role = "GD.PGD" }       // seed dev user
   );
   ```
   > **Note:** Cần update LeaveTypes endpoints `Roles("QTHT")` (đổi từ `"quantri"`).

5. **Tạo migration**:
   ```bash
   cd packages/api
   dotnet ef migrations add AddRequestedApproverIdAndNavProps
   dotnet ef database update
   ```

6. **Viết BusinessDayCalculator**:
   ```csharp
   namespace QLNP.Api.Features.LeaveRequests;

   internal static class BusinessDayCalculator
   {
       /// <summary>Tính số ngày làm việc (T2–T6) giữa start và end, inclusive.</summary>
       internal static decimal Count(DateTime start, DateTime end)
       {
           if (start > end) return 0;
           var count = 0;
           for (var d = start.Date; d <= end.Date; d = d.AddDays(1))
               if (d.DayOfWeek != DayOfWeek.Saturday && d.DayOfWeek != DayOfWeek.Sunday)
                   count++;
           return count;
       }
   }
   ```

7. **dotnet build** — 0 errors

## Success Criteria

- [x] `LeaveRequest.RequestedApproverId` nullable long + nav prop `RequestedApprover` tồn tại
- [x] `UserMaster.DonVi` nav prop → `DmDonvi` tồn tại
- [x] AppDbContext FK configs cho cả 2 nav props
- [x] Seed data: `QTHT`, `CB.PCM`, `LD.PCM`, `GD.PGD` trong `UserRoles`
- [x] LeaveTypes endpoints đổi `Roles("quantri")` → `Roles("QTHT")`
- [x] Migration chạy thành công
- [x] `BusinessDayCalculator.Count(Mon, Fri)` = 5
- [x] `dotnet build` 0 errors

## Risk Assessment

- Migration fail nếu DB có constraint → kiểm tra nullable trước khi chạy
- Đổi "quantri" → "QTHT" có thể break existing tokens → cần re-generate hoặc middleware map cả 2 string trong giai đoạn chuyển đổi
