---
phase: 3
title: "Create Endpoint — POST /api/leave-requests"
status: complete
priority: P0
effort: "45m"
dependencies: [1]
---

# Phase 3: Create Endpoint

## Overview

Implement `POST /api/leave-requests` với FluentValidation đầy đủ: dates, business days, overlap detection. Roles được tạo đơn: CB.PCM và LD.PCM.

## Requirements

- Functional (FR-041, BRULE-001, BRULE-002, BRULE-007):
  - `StartDate >= today` (UTC+7 hoặc server local)
  - `StartDate <= EndDate`
  - `Reason` non-empty, max 500
  - `LeaveTypeId` phải tồn tại và `IsActive=true`
  - `TotalDays` = `BusinessDayCalculator.Count(StartDate, EndDate)` ≥ 1
  - Overlap: không tạo nếu có đơn của user với status IN ('approved_leader','approved_director') trùng ngày
  - `RequestedApproverId` nullable, không validate FK
- Non-functional: roles cho phép = `CB.PCM`, `LD.PCM` (theo BRD §2.2)

## Architecture

```
Features/LeaveRequests/Create/
├── Endpoint.cs
├── Mapper.cs
├── Data.cs
└── Models.cs      ← Request + Validator + Response
```

## Related Code Files

- Create: `packages/api/Features/LeaveRequests/Create/Endpoint.cs`
- Create: `packages/api/Features/LeaveRequests/Create/Mapper.cs`
- Create: `packages/api/Features/LeaveRequests/Create/Data.cs`
- Create: `packages/api/Features/LeaveRequests/Create/Models.cs`
- Reference: `packages/api/Features/LeaveTypes/Create/` (Validator pattern)
- Use: `BusinessDayCalculator` (Phase 1)

## Implementation Steps

1. **Models.cs**:
   ```csharp
   namespace QLNP.Api.Features.LeaveRequests.Create;

   internal sealed record Request(
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

   namespace QLNP.Api.Features.LeaveRequests.Create;

   internal sealed class Mapper : Mapper<Request, Response, LeaveRequest>
   {
       public override LeaveRequest ToEntity(Request r) => new()
       {
           LeaveTypeId = r.LeaveTypeId,
           StartDate = r.StartDate,
           EndDate = r.EndDate,
           Reason = r.Reason,
           RequestedApproverId = r.RequestedApproverId,
           Status = "pending",
           CreatedAt = DateTime.UtcNow
       };

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
   // HasOverlapAsync: kiểm tra overlap với approved requests của cùng UserId
   // Status IN ('approved_leader', 'approved_director')
   // AND StartDate <= req.EndDate AND EndDate >= req.StartDate

   // CreateAsync: tính TotalDays = BusinessDayCalculator.Count(start, end)
   // set UserId = currentUser.UserId, CreatedAt = DateTime.UtcNow, Status = "pending"
   ```

4. **Endpoint.cs**:
   ```csharp
   public override void Configure()
   {
       Post("/api/leave-requests");
       Roles("CB.PCM", "LD.PCM");
   }

   public override async Task HandleAsync(Request r, CancellationToken ct)
   {
       // 1. Business days check
       var totalDays = BusinessDayCalculator.Count(r.StartDate, r.EndDate);
       if (totalDays < 1)
       {
           AddError("Khoảng thời gian không có ngày làm việc");
           await Send.ErrorsAsync(422, ct);
           return;
       }

       // 2. Overlap check
       var currentUser = _currentUser.GetCurrentUser();
       if (await _data.HasOverlapAsync(currentUser.UserId, r.StartDate, r.EndDate, ct))
       {
           AddError("Trùng lịch với đơn đã được duyệt");
           await Send.ErrorsAsync(409, ct);
           return;
       }

       // 3. Create
       var entity = Map.ToEntity(r);
       entity.UserId = currentUser.UserId;
       entity.TotalDays = totalDays;
       await _data.CreateAsync(entity, ct);

       // 4. Load nav props for DTO mapping
       var loaded = await _data.GetByIdAsync(entity.Id, ct);
       await Send.CreatedAtAsync($"/api/leave-requests/{entity.Id}",
           Map.FromEntity(loaded!), cancellation: ct);
   }
   ```

## Success Criteria

- [x] POST với request hợp lệ → 201 Created
- [x] StartDate quá khứ → 400 validation error
- [x] EndDate < StartDate → 400
- [x] Reason rỗng → 400
- [x] LeaveTypeId không tồn tại → 400
- [x] Toàn T7/CN giữa start-end → 422 (no business days)
- [x] Trùng với đơn approved → 409
- [x] TotalDays tính đúng (server-side)

## Risk Assessment

- `DateTime.Today` là UTC hay local → cần nhất quán với prod server timezone; dùng `DateTimeOffset.UtcNow.Date` nếu cần
- Role strings phải khớp JWT claims — `CurrentUserProvider` đọc từ `ClaimTypes.Role`, cần đảm bảo gateway inject đúng `CB.PCM`, `LD.PCM`
- Mapper.cs pattern nhất quán với LeaveTypes Create (FastEndpoints `Mapper<Request, Response, Entity>`)
