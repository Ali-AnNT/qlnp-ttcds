---
phase: 2
title: "Reject Endpoint"
status: complete
priority: P1
effort: "1.5h"
dependencies: [1]
---

# Phase 2: Reject Endpoint

## Overview

Implement `PUT /api/leave-requests/{id}/reject`. LD.PCM reject khi status=pending; GD.PGD reject khi status=approved_leader. Ghi rejected_reason bắt buộc.

## Requirements

- Functional:
  - LD.PCM: chỉ reject khi status=pending → rejected
  - GD.PGD: chỉ reject khi status=approved_leader → rejected
  - `rejected_reason` bắt buộc (FluentValidation NotEmpty)
  - Ghi `ApprovedBy` KHÔNG thay đổi (chỉ set khi approve); `RejectedReason` set từ request
  - `UpdatedAt = DateTime.UtcNow`
- Non-functional: không roll back UsedDays (chỉ approved_director mới tăng, nên chưa tăng thì không cần rollback)

## Architecture

```
PUT /api/leave-requests/{id}/reject
  Body: { rejectedReason: string }
→ Validator: rejectedReason NotEmpty
→ Endpoint.HandleAsync()
  → Data.GetByIdAsync(id)
  → State machine check theo role
  → entity.Status = "rejected"
  → entity.RejectedReason = request.RejectedReason
  → entity.UpdatedAt = now
  → Data.SaveAsync()
  → Response: LeaveRequestDto
```

## Related Code Files

- Create: `packages/api/Features/LeaveRequests/Reject/Endpoint.cs`
- Create: `packages/api/Features/LeaveRequests/Reject/Data.cs`
- Create: `packages/api/Features/LeaveRequests/Reject/Models.cs`

## Implementation Steps

### Models.cs

```csharp
using FastEndpoints;
using FluentValidation;

namespace QLNP.Api.Features.LeaveRequests.Reject;

internal sealed record Request(string RejectedReason);
internal sealed record Response(LeaveRequestDto Item);

internal sealed class Validator : Validator<Request>
{
    public Validator()
    {
        RuleFor(x => x.RejectedReason)
            .NotEmpty().WithMessage("Phải nhập lý do từ chối");
    }
}
```

### Data.cs

```csharp
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveRequests.Reject;

internal sealed class Data
{
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task<LeaveRequest?> GetByIdAsync(long id, CancellationToken ct) =>
        await _db.LeaveRequests
            .Include(lr => lr.User).ThenInclude(u => u!.DonVi)
            .Include(lr => lr.LeaveType)
            .FirstOrDefaultAsync(lr => lr.Id == id, ct);

    public async Task SaveAsync(CancellationToken ct) =>
        await _db.SaveChangesAsync(ct);
}
```

### Endpoint.cs

```csharp
using FastEndpoints;
using QLNP.Api.Auth;
using QLNP.Api.Features.LeaveRequests;

namespace QLNP.Api.Features.LeaveRequests.Reject;

internal sealed class Endpoint : Endpoint<Request, Response>
{
    private readonly Data _data;
    private readonly ICurrentUserProvider _currentUser;

    public Endpoint(Data data, ICurrentUserProvider currentUser)
    {
        _data = data;
        _currentUser = currentUser;
    }

    public override void Configure()
    {
        Put("/api/leave-requests/{id}/reject");
        Roles("QLNP.LD.PCM", "QLNP.GD.PGD");
    }

    public override async Task HandleAsync(Request r, CancellationToken ct)
    {
        var id = Route<long>("id");
        var currentUser = _currentUser.GetCurrentUser();

        var entity = await _data.GetByIdAsync(id, ct);
        if (entity is null) { await Send.NotFoundAsync(ct); return; }

        var isLeader = currentUser.Roles.Contains("QLNP.LD.PCM");
        var isDirector = currentUser.Roles.Contains("QLNP.GD.PGD");

        // State machine — isDirector priority for dual-role users
        var canReject = (isDirector && entity.Status == "approved_leader") ||
                        (isLeader && !isDirector && entity.Status == "pending");
        if (!canReject)
        {
            AddError("Không thể từ chối đơn ở trạng thái này");
            await Send.ErrorsAsync(409, ct); return;
        }

        // LD.PCM scope: cùng phòng AND không phải đơn của mình
        if (isLeader && !isDirector)
        {
            if (entity.UserId == currentUser.UserId ||
                entity.User.PhongBanId == null ||
                entity.User.PhongBanId != currentUser.PhongBanId)
            {
                await Send.ForbiddenAsync(ct); return;
            }
        }

        entity.Status = "rejected";
        entity.RejectedReason = r.RejectedReason;
        entity.UpdatedAt = DateTime.UtcNow;

        await _data.SaveAsync(ct);

        await Send.OkAsync(new Response(new LeaveRequestDto(
            entity.Id, entity.UserId, entity.User?.HoTen ?? "",
            entity.User?.DonVi?.TenDonVi ?? "",
            entity.LeaveTypeId, entity.LeaveType.Name,
            entity.StartDate, entity.EndDate, entity.TotalDays,
            entity.Reason, entity.Status, entity.RequestedApproverId,
            entity.ApprovedBy, entity.ApprovedAt, entity.RejectedReason, entity.CreatedAt
        )), ct);
    }
}
```

## Success Criteria

- [x] `dotnet build` clean
- [x] LD.PCM reject đơn pending + lý do → status=rejected, RejectedReason lưu
- [x] GD.PGD reject đơn approved_leader → status=rejected
- [x] Reject không có lý do → 400 validation error
- [x] LD.PCM reject đơn phòng khác → 403
- [x] LD.PCM reject đơn của chính mình → 403
- [x] LD.PCM reject đơn approved_leader → 409
- [x] GD.PGD reject đơn pending → 409 (phải qua cấp 1 trước)
- [x] Reject đơn approved_director → 409

## Risk Assessment

| Rủi ro | Mức | Mitigation |
|--------|-----|-----------|
| Dual-role user (LD+GD) | Fixed | `isLeader && !isDirector` guard chính xác |
| LD.PCM self-reject | Fixed | `entity.UserId == currentUser.UserId` → 403 |
| LD.PCM reject phòng khác | Fixed | PhongBanId scope check thêm vào |
| GD.PGD reject đơn pending | Low | State machine check chặn |
