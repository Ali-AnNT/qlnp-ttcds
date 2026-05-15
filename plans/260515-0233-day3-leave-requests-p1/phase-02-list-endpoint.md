---
phase: 2
title: "List Endpoint — GET /api/leave-requests"
status: complete
priority: P0
effort: "30m"
dependencies: [1]
---

# Phase 2: List Endpoint

## Overview

Implement `GET /api/leave-requests` với role-based filtering. CB.PCM thấy đơn của mình, LD.PCM thấy toàn phòng, GD.PGD/QTHT thấy tất cả.

## Requirements

- Functional (FR-040, BRULE-004):
  - CB.PCM → `WHERE lr.UserId = currentUser.UserId`
  - LD.PCM → `WHERE um.PhongBanId = currentUser.PhongBanId` (join UserMaster)
  - GD.PGD / QTHT → no filter
- Non-functional: tất cả roles đều phải authenticated

## Architecture

```
Features/LeaveRequests/
├── LeaveRequestDto.cs        ← shared DTO (tạo ở phase này)
└── List/
    ├── Endpoint.cs
    ├── Data.cs
    └── Models.cs             ← Response record
```

## Related Code Files

- Create: `packages/api/Features/LeaveRequests/LeaveRequestDto.cs`
- Create: `packages/api/Features/LeaveRequests/List/Endpoint.cs`
- Create: `packages/api/Features/LeaveRequests/List/Data.cs`
- Create: `packages/api/Features/LeaveRequests/List/Models.cs`
- Reference: `packages/api/Features/LeaveTypes/List/` (pattern)
- Reference: `packages/api/Auth/CurrentUserProvider.cs`

## Implementation Steps

1. **LeaveRequestDto.cs**:
   ```csharp
   namespace QLNP.Api.Features.LeaveRequests;

   internal sealed record LeaveRequestDto(
       long Id,
       long UserId,
       string UserName,
       string DonViName,        // DmDonvi.TenDonVi (join qua UserMaster.DonViId)
       long LeaveTypeId,
       string LeaveTypeName,
       DateTime StartDate,
       DateTime EndDate,
       decimal TotalDays,
       string? Reason,
       string Status,
       long? RequestedApproverId,
       long? ApprovedBy,
       DateTime? ApprovedAt,
       string? RejectedReason,
       DateTime CreatedAt
   );
   ```

2. **Models.cs**:
   ```csharp
   namespace QLNP.Api.Features.LeaveRequests.List;
   internal sealed record Response(List<LeaveRequestDto> Items);
   ```

3. **Data.cs** — inject `AppDbContext` + `ICurrentUserProvider`:
   ```csharp
   // Query với Include(lr => lr.User), Include(lr => lr.LeaveType)
   // + Include(lr => lr.User.DonVi) để lấy TenDonVi từ DmDonvi
   // Filter theo role (BRD §2.2):
   //   "CB.PCM" / default    → lr.UserId == currentUser.UserId
   //   "LD.PCM"              → lr.User.PhongBanId == currentUser.PhongBanId
   //   "GD.PGD" / "QTHT"    → no filter
   // Role check: currentUser.Roles.Contains("...")
   //
   // Note: PhongBanId nullable — users có PhongBanId=null sẽ không hiện
   //        trong LD.PCM view (accepted per validation)
   ```

4. **Endpoint.cs**:
   ```csharp
   public override void Configure()
   {
       Get("/api/leave-requests");
       Options(x => x.RequireAuthorization());
   }
   ```
   Inject `Data`, gọi query, map sang `LeaveRequestDto`, trả `OkAsync`.

5. **Mapping** (inline trong Endpoint hoặc Data):
   ```csharp
   new LeaveRequestDto(
       lr.Id, lr.UserId, lr.User.HoTen ?? "",
       lr.User.DonVi?.TenDonVi ?? "",   // join qua UserMaster.DonViId → DmDonvi
       lr.LeaveTypeId, lr.LeaveType.Name,
       lr.StartDate, lr.EndDate, lr.TotalDays,
       lr.Reason, lr.Status, lr.RequestedApproverId,
       lr.ApprovedBy, lr.ApprovedAt, lr.RejectedReason, lr.CreatedAt)
   ```

   > **Prerequisite**: Cần thêm nav prop `public virtual DmDonvi? DonVi { get; set; }` vào `UserMaster` + FK config trong `AppDbContext.OnModelCreating` (Phase 1).

## Success Criteria

- [x] `GET /api/leave-requests` trả 200 với list (có thể rỗng)
- [x] CB.PCM chỉ thấy đơn của mình
- [x] LD.PCM thấy tất cả đơn cùng phòng ban
- [x] GD.PGD thấy tất cả
- [x] Unauthenticated → 401

## Risk Assessment

- `UserMaster` không có `TenPhongBan` → join qua `DonViId → DmDonvi.TenDonVi` (validated)
- `PhongBanId` nullable → users có null sẽ bị miss trong LD.PCM view (accepted)
