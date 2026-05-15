---
phase: 4
title: "Update Endpoint — PUT /api/leave-requests/{id}"
status: complete
priority: P0
effort: "30m"
dependencies: [1, 3]
---

# Phase 4: Update Endpoint

## Overview

Implement `PUT /api/leave-requests/{id}`. Chỉ cho sửa khi `status=pending` và người gọi là owner. Re-validate toàn bộ business rules, tính lại `TotalDays`.

## Requirements

- Functional (FR-04.3, BRULE-007):
  - Guard: `status != "pending"` → 409 / 400
  - Guard: `UserId != currentUser.UserId` → 403
  - Fields được sửa: `StartDate`, `EndDate`, `LeaveTypeId`, `Reason`, `RequestedApproverId`
  - Re-validate: dates, LeaveTypeId active, business days ≥ 1
  - Overlap check: giống Create nhưng **exclude** chính đơn đang sửa (`Id != entity.Id`)
  - `TotalDays` tính lại server-side
  - `UpdatedAt = DateTime.UtcNow`
- Non-functional: authenticated, owner only

## Architecture

```
Features/LeaveRequests/Update/
├── Endpoint.cs
├── Mapper.cs
├── Data.cs
└── Models.cs      ← Request + Validator + Response
```

## Related Code Files

- Create: `packages/api/Features/LeaveRequests/Update/Endpoint.cs`
- Create: `packages/api/Features/LeaveRequests/Update/Mapper.cs`
- Create: `packages/api/Features/LeaveRequests/Update/Data.cs`
- Create: `packages/api/Features/LeaveRequests/Update/Models.cs`
- Reference: `packages/api/Features/LeaveTypes/Update/Endpoint.cs` (pattern)
- Use: `BusinessDayCalculator` (Phase 1)

## Implementation Steps

1. **Models.cs**:
   ```csharp
   namespace QLNP.Api.Features.LeaveRequests.Update;

   internal sealed record Request(
       long Id,
       long LeaveTypeId,
       DateTime StartDate,
       DateTime EndDate,
       string Reason,
       long? RequestedApproverId
   );

   internal sealed class Validator : Validator<Request>
   {
       public Validator(AppDbContext db)
       {
           RuleFor(x => x.LeaveTypeId)
               .MustAsync(async (id, ct) =>
                   await db.LeaveTypes.AnyAsync(t => t.Id == id && t.IsActive, ct))
               .WithMessage("Loại nghỉ không tồn tại hoặc không còn hiệu lực");

           RuleFor(x => x.StartDate)
               .GreaterThanOrEqualTo(DateTime.Today)
               .WithMessage("Ngày bắt đầu không được là ngày quá khứ");

           RuleFor(x => x.EndDate)
               .GreaterThanOrEqualTo(x => x.StartDate)
               .WithMessage("Ngày kết thúc phải sau ngày bắt đầu");

           RuleFor(x => x.Reason)
               .NotEmpty().WithMessage("Lý do không được trống")
               .MaximumLength(500);
       }
   }

   internal sealed record Response(LeaveRequestDto LeaveRequest);
   ```

2. **Mapper.cs**:
   ```csharp
   using FastEndpoints;
   using QLNP.Api.Entities;

   namespace QLNP.Api.Features.LeaveRequests.Update;

   internal sealed class Mapper : Mapper<Request, Response, LeaveRequest>
   {
       public override Response FromEntity(LeaveRequest e) => new(MapToDto(e));

       internal LeaveRequestDto MapToDto(LeaveRequest e) => new(
           e.Id, e.UserId, e.User?.HoTen ?? "",
           e.User?.DonVi?.TenDonVi ?? "",
           e.LeaveTypeId, e.LeaveType?.Name ?? "",
           e.StartDate, e.EndDate, e.TotalDays,
           e.Reason, e.Status, e.RequestedApproverId,
           e.ApprovedBy, e.ApprovedAt, e.RejectedReason, e.CreatedAt
       );
   }
   ```

3. **Data.cs**:
   ```csharp
   // GetByIdAsync: load entity kèm Include(User.DonVi, LeaveType)
   // HasOverlapAsync: giống Create nhưng thêm điều kiện AND Id != excludeId
   // SaveAsync: gọi SaveChangesAsync
   ```

4. **Endpoint.cs**:
   ```csharp
   public override void Configure()
   {
       Put("/api/leave-requests/{id}");
       Roles("CB.PCM", "LD.PCM");
   }

   public override async Task HandleAsync(Request r, CancellationToken ct)
   {
       var id = Route<long>("id");

       var entity = await _data.GetByIdAsync(id, ct);
       if (entity is null) { await Send.NotFoundAsync(ct); return; }

       var currentUser = _currentUser.GetCurrentUser();

       // Owner check
       if (entity.UserId != currentUser.UserId)
       { await Send.ForbiddenAsync(ct); return; }

       // Status check
       if (entity.Status != "pending")
       {
           AddError("Chỉ có thể sửa đơn đang chờ duyệt");
           await Send.ErrorsAsync(409, ct);
           return;
       }

       // Business days
       var totalDays = BusinessDayCalculator.Count(r.StartDate, r.EndDate);
       if (totalDays < 1)
       {
           AddError("Khoảng thời gian không có ngày làm việc");
           await Send.ErrorsAsync(422, ct);
           return;
       }

       // Overlap (exclude self)
       if (await _data.HasOverlapAsync(currentUser.UserId, r.StartDate, r.EndDate, id, ct))
       {
           AddError("Trùng lịch với đơn đã được duyệt");
           await Send.ErrorsAsync(409, ct);
           return;
       }

       // Apply changes
       entity.LeaveTypeId = r.LeaveTypeId;
       entity.StartDate = r.StartDate;
       entity.EndDate = r.EndDate;
       entity.TotalDays = totalDays;
       entity.Reason = r.Reason;
       entity.RequestedApproverId = r.RequestedApproverId;
       entity.UpdatedAt = DateTime.UtcNow;

       await _data.SaveAsync(ct);
       await Send.OkAsync(Map.FromEntity(entity), ct);
   }
   ```

## Success Criteria

- [x] PUT với đơn pending + owner → 200 Updated
- [x] `status != "pending"` → 409
- [x] User khác owner → 403
- [x] Dates không hợp lệ → 400
- [x] Overlap (exclude self) → 409
- [x] `TotalDays` + `UpdatedAt` được cập nhật

## Risk Assessment

- `HasOverlapAsync` phải exclude `excludeId` đúng; nếu quên sẽ luôn báo overlap với chính đơn đang sửa
