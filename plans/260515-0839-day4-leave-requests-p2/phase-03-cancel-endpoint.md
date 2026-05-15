---
phase: 3
title: "Cancel Endpoint"
status: complete
priority: P1
effort: "1h"
dependencies: [1, 2]
---

# Phase 3: Cancel Endpoint

## Overview

Implement `DELETE /api/leave-requests/{id}` — owner tự hủy đơn khi status ∈ {pending, approved_leader}. Không cần request body.

## Requirements

- Functional:
  - Chỉ owner (entity.UserId == currentUser.UserId) mới cancel được
  - Chỉ cancel khi status ∈ {"pending", "approved_leader"} (BRULE-006)
  - Set status = "cancelled", UpdatedAt = now
  - Không roll back LeaveBalance (UsedDays chỉ tăng khi approved_director, cancel chỉ áp dụng trước đó)
- Non-functional: HTTP DELETE, no body, trả 200 + DTO

## Architecture

```
DELETE /api/leave-requests/{id}
→ Endpoint.HandleAsync()
  → Data.GetByIdAsync(id)       // include nav props
  → Owner check
  → Status check ∈ {pending, approved_leader}
  → entity.Status = "cancelled"
  → entity.UpdatedAt = now
  → Data.SaveAsync()
  → Response: LeaveRequestDto
```

## Related Code Files

- Create: `packages/api/Features/LeaveRequests/Cancel/Endpoint.cs`
- Create: `packages/api/Features/LeaveRequests/Cancel/Data.cs`
- Create: `packages/api/Features/LeaveRequests/Cancel/Models.cs`

## Implementation Steps

### Models.cs

```csharp
namespace QLNP.Api.Features.LeaveRequests.Cancel;

internal sealed record Response(LeaveRequestDto Item);
```

### Data.cs

```csharp
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveRequests.Cancel;

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

namespace QLNP.Api.Features.LeaveRequests.Cancel;

internal sealed class Endpoint : EndpointWithoutRequest<Response>
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
        Delete("/api/leave-requests/{id}");
        Roles("QLNP.CB.PCM", "QLNP.LD.PCM");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<long>("id");
        var currentUser = _currentUser.GetCurrentUser();

        var entity = await _data.GetByIdAsync(id, ct);
        if (entity is null) { await Send.NotFoundAsync(ct); return; }

        // Owner check
        if (entity.UserId != currentUser.UserId)
        {
            await Send.ForbiddenAsync(ct); return;
        }

        // Status check (BRULE-006)
        if (entity.Status is not ("pending" or "approved_leader"))
        {
            AddError("Chỉ có thể hủy đơn đang chờ duyệt hoặc đã được trưởng phòng duyệt");
            await Send.ErrorsAsync(409, ct); return;
        }

        entity.Status = "cancelled";
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
- [x] Owner cancel đơn pending → status=cancelled (AC-010)
- [x] Owner cancel đơn approved_leader → status=cancelled
- [x] Non-owner cancel → 403
- [x] Cancel đơn approved_director → 409
- [x] Cancel đơn rejected/cancelled → 409

## Risk Assessment

| Rủi ro | Mức | Mitigation |
|--------|-----|-----------|
| GD.PGD gọi DELETE (không có trong Roles) → 403 auto | Low | FastEndpoints Roles guard xử lý tự động |
| `is not ("pending" or "approved_leader")` syntax (C# 11+) | Low | .NET 9 target → ok; fallback: dùng `!new[]{"pending","approved_leader"}.Contains(...)` |
