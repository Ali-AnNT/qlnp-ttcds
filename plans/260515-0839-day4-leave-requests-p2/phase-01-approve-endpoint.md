---
phase: 1
title: "Approve Endpoint"
status: pending
priority: P1
effort: "3h"
dependencies: []
---

# Phase 1: Approve Endpoint

## Overview

Implement `PUT /api/leave-requests/{id}/approve` theo VSP. State machine 2 cấp: LD.PCM duyệt pending→approved_leader; GD.PGD duyệt approved_leader→approved_director. Khi approved_director: cộng UsedDays vào LeaveBalance (FR-052).

## Requirements

- Functional:
  - LD.PCM: status=pending → approved_leader, ApprovedBy=currentUser.Id, ApprovedAt=now
  - GD.PGD: status=approved_leader → approved_director, ApprovedBy=currentUser.Id, ApprovedAt=now
  - approved_director: upsert LeaveBalance.UsedDays += TotalDays (Year=StartDate.Year)
  - LD.PCM scope: chỉ duyệt đơn cùng PhongBanId AND không phải đơn của chính mình
  - Validate UsedDays + TotalDays ≤ TotalDays trước khi cộng; trả 422 nếu vượt mức
  - ApprovedBy = currentUser.UserId, không đọc từ body
  - Ưu tiên role isDirector trước isLeader khi user có dual-role
- Non-functional:
  - Không có request body (action hoàn toàn từ URL + current user)
  - Transaction-safe: approve + balance update trong 1 SaveChangesAsync

## Architecture

```
PUT /api/leave-requests/{id}/approve
→ Endpoint.HandleAsync()
  → Data.GetByIdAsync(id)       // include User, User.DonVi, LeaveType
  → State machine check (role + status)
  → LD.PCM scope check
  → entity.Status = new_status
  → entity.ApprovedBy = currentUser.UserId
  → entity.ApprovedAt = DateTime.UtcNow
  → if approved_director: Data.UpsertBalanceAsync(entity)
  → Data.SaveAsync()
  → Response: LeaveRequestDto
```

## Related Code Files

- Create: `packages/api/Features/LeaveRequests/Approve/Endpoint.cs`
- Create: `packages/api/Features/LeaveRequests/Approve/Data.cs`
- Create: `packages/api/Features/LeaveRequests/Approve/Models.cs`

## Implementation Steps

### Models.cs

```csharp
namespace QLNP.Api.Features.LeaveRequests.Approve;

// No request body needed — action derived from current user role
internal sealed record Response(LeaveRequestDto Item);
```

### Data.cs

```csharp
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveRequests.Approve;

internal sealed class Data
{
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task<LeaveRequest?> GetByIdAsync(long id, CancellationToken ct) =>
        await _db.LeaveRequests
            .Include(lr => lr.User).ThenInclude(u => u!.DonVi)
            .Include(lr => lr.LeaveType)
            .FirstOrDefaultAsync(lr => lr.Id == id, ct);

    // Returns false if UsedDays would exceed TotalDays
    public async Task<bool> UpsertBalanceAsync(LeaveRequest entity, CancellationToken ct)
    {
        var year = entity.StartDate.Year;
        var balance = await _db.LeaveBalances
            .FirstOrDefaultAsync(b =>
                b.UserId == entity.UserId &&
                b.LeaveTypeId == entity.LeaveTypeId &&
                b.Year == year, ct);

        if (balance is null)
        {
            balance = new LeaveBalance
            {
                UserId = entity.UserId,
                LeaveTypeId = entity.LeaveTypeId,
                Year = year,
                TotalDays = entity.LeaveType.DefaultDays,
                UsedDays = 0
            };
            _db.LeaveBalances.Add(balance);
        }

        if (balance.UsedDays + entity.TotalDays > balance.TotalDays)
            return false; // caller returns 422

        balance.UsedDays += entity.TotalDays;
        return true;
    }

    public async Task SaveAsync(CancellationToken ct) =>
        await _db.SaveChangesAsync(ct);
}
```

### Endpoint.cs

```csharp
using FastEndpoints;
using QLNP.Api.Auth;
using QLNP.Api.Features.LeaveRequests;

namespace QLNP.Api.Features.LeaveRequests.Approve;

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
        Put("/api/leave-requests/{id}/approve");
        Roles("QLNP.LD.PCM", "QLNP.GD.PGD");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<long>("id");
        var currentUser = _currentUser.GetCurrentUser();

        var entity = await _data.GetByIdAsync(id, ct);
        if (entity is null) { await Send.NotFoundAsync(ct); return; }

        var isLeader = currentUser.Roles.Contains("QLNP.LD.PCM");
        var isDirector = currentUser.Roles.Contains("QLNP.GD.PGD");

        // State machine — check isDirector first (higher priority for dual-role users)
        if (isDirector)
        {
            if (entity.Status != "approved_leader")
            {
                AddError("Giám đốc chỉ duyệt đơn đã được trưởng phòng duyệt");
                await Send.ErrorsAsync(409, ct); return;
            }
        }
        else if (isLeader)
        {
            if (entity.Status != "pending")
            {
                AddError("Trưởng phòng chỉ duyệt đơn đang chờ duyệt");
                await Send.ErrorsAsync(409, ct); return;
            }
            // LD.PCM scope: cùng phòng AND không phải đơn của mình
            if (entity.UserId == currentUser.UserId)
            {
                await Send.ForbiddenAsync(ct); return;
            }
            if (entity.User.PhongBanId == null || entity.User.PhongBanId != currentUser.PhongBanId)
            {
                await Send.ForbiddenAsync(ct); return;
            }
        }

        entity.Status = isDirector ? "approved_director" : "approved_leader";
        entity.ApprovedBy = currentUser.UserId;
        entity.ApprovedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        if (isDirector)
        {
            if (!await _data.UpsertBalanceAsync(entity, ct))
            {
                AddError("Nhân viên đã vượt quá định mức ngày phép");
                await Send.ErrorsAsync(422, ct); return;
            }
        }

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

- [ ] `dotnet build` clean
- [ ] LD.PCM approve đơn pending → status=approved_leader, ApprovedBy đúng
- [ ] GD.PGD approve đơn approved_leader → status=approved_director, UsedDays tăng
- [ ] LD.PCM approve đơn phòng khác → 403
- [ ] LD.PCM approve đơn của chính mình → 403
- [ ] LD.PCM approve đơn không pending → 409
- [ ] GD.PGD approve đơn pending (skip cấp 1) → 409
- [ ] Dual-role user (LD+GD) approve đơn approved_leader → approved_director (GD logic thắng)
- [ ] UsedDays vượt TotalDays → 422

## Risk Assessment

| Rủi ro | Mức | Mitigation |
|--------|-----|-----------|
| Dual-role user (LD+GD) | Fixed | if/else if: isDirector check trước, isLeader sau |
| LD.PCM self-approve | Fixed | `entity.UserId == currentUser.UserId` → 403 |
| PhongBanId nullable bypass | Fixed | `entity.User.PhongBanId == null` → 403 |
| UsedDays overflow | Fixed | UpsertBalanceAsync trả bool; caller 422 |
| LeaveType nav prop null khi UpsertBalance | Low | Include LeaveType trong GetByIdAsync |
| Concurrent approve race condition | Low | DB constraint + last-write-wins ok cho scale này |
