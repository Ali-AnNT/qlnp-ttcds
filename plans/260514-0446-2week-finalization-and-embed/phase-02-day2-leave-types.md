---
phase: 2
title: "Day 2 — LeaveTypes Slice (4 Endpoints)"
status: completed
priority: P0
effort: "4-5h"
dependencies: [1]
---

# Phase 02: Day 2 — LeaveTypes Slice

## Overview

Implement 4 FastEndpoints cho LeaveTypes CRUD:
`GET /api/leave-types`, `POST`, `PUT /{id}`, `DELETE /{id}`.
File structure: tách riêng Request / Response / Validator / Endpoint.

**Hoàn tất ngày 2026-05-14.** Code review pass, 3 blockers fixed (IsAuthenticated check, route/body ID validation, DbUpdateException try/catch, soft-delete-aware uniqueness). Build 0 errors 0 warnings.

## Context

- **Refs:** [tasks.md §Day 2](../../docs/vision/tasks.md#day-2-2026-05-15-thứ-6--leavetypes-slice-4-endpoints)
- **Entity:** `packages/api/Entities/LeaveType.cs`
- **Pattern ref:** `packages/api/Features/Auth/Me/MeEndpoint.cs`

## Requirements

- List: GET `/api/leave-types` — authenticated, trả `IsActive=true`
- Create: POST `/api/leave-types` — role `quantri`, FluentValidation (Name, Code unique, DefaultDays > 0)
- Update: PUT `/api/leave-types/{id}` — role `quantri`, 404 nếu không tìm thấy
- Delete: DELETE `/api/leave-types/{id}` — role `quantri`, soft delete, 409 nếu có `LeaveRequests` ref
- Balance seed khi Create: **DEFER sang Day 5** (YAGNI)

## Architecture

```
GET  /api/leave-types        → ListLeaveTypesEndpoint   (authenticated)
POST /api/leave-types        → CreateLeaveTypeEndpoint  (Roles: quantri)
PUT  /api/leave-types/{id}   → UpdateLeaveTypeEndpoint  (Roles: quantri)
DELETE /api/leave-types/{id} → DeleteLeaveTypeEndpoint  (Roles: quantri)
```

**Role claim mapping:** JWT token dùng claim `"Roles"` (capital R). FastEndpoints `Roles("quantri")` checks `ClaimTypes.Role`. Cần set `RoleClaimType = "Roles"` trong `TokenValidationParameters` (xem Step 0).

## Related Code Files

**Create (12 files):**
- `packages/api/Features/LeaveTypes/LeaveTypeDto.cs`
- `packages/api/Features/LeaveTypes/List/ListLeaveTypesResponse.cs`
- `packages/api/Features/LeaveTypes/List/ListLeaveTypesEndpoint.cs`
- `packages/api/Features/LeaveTypes/Create/CreateLeaveTypeRequest.cs`
- `packages/api/Features/LeaveTypes/Create/CreateLeaveTypeResponse.cs`
- `packages/api/Features/LeaveTypes/Create/CreateLeaveTypeValidator.cs`
- `packages/api/Features/LeaveTypes/Create/CreateLeaveTypeEndpoint.cs`
- `packages/api/Features/LeaveTypes/Update/UpdateLeaveTypeRequest.cs`
- `packages/api/Features/LeaveTypes/Update/UpdateLeaveTypeResponse.cs`
- `packages/api/Features/LeaveTypes/Update/UpdateLeaveTypeValidator.cs`
- `packages/api/Features/LeaveTypes/Update/UpdateLeaveTypeEndpoint.cs`
- `packages/api/Features/LeaveTypes/Delete/DeleteLeaveTypeEndpoint.cs`

**Modify (2 files):**
- `packages/api/Program.cs` — thêm `RoleClaimType = "Roles"` vào JWT config
- `packages/api/QLNP.Api.http` — thêm LeaveTypes test cases

## Implementation Steps

### Step 0 — Fix JWT RoleClaimType trong `Program.cs`

Thêm `RoleClaimType = "Roles"` vào `TokenValidationParameters` để FastEndpoints `Roles("quantri")` map đúng claim từ JWT token:

```csharp
// packages/api/Program.cs — trong AddJwtBearer(o => { ... })
o.TokenValidationParameters = new TokenValidationParameters
{
    ValidateIssuer = true,
    ValidateAudience = true,
    ValidateLifetime = true,
    ValidateIssuerSigningKey = true,
    ValidIssuer = jwtConfig["Issuer"],
    ValidAudience = jwtConfig["Audience"],
    IssuerSigningKey = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(jwtConfig["SigningKey"]!)),
    RoleClaimType = "Roles"   // ← THÊM DÒNG NÀY
};
```

### Step 1 — Shared DTO

Tạo `packages/api/Features/LeaveTypes/LeaveTypeDto.cs`:

```csharp
namespace QLNP.Api.Features.LeaveTypes;

public record LeaveTypeDto(
    long Id,
    string Name,
    string Code,
    decimal DefaultDays,
    string? Description,
    bool IsActive
);
```

### Step 2 — List endpoint (2 files)

**`Features/LeaveTypes/List/ListLeaveTypesResponse.cs`:**
```csharp
namespace QLNP.Api.Features.LeaveTypes.List;

public record ListLeaveTypesResponse(IReadOnlyList<LeaveTypeDto> Items);
```

**`Features/LeaveTypes/List/ListLeaveTypesEndpoint.cs`:**
```csharp
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.LeaveTypes.List;

public class ListLeaveTypesEndpoint : EndpointWithoutRequest<ListLeaveTypesResponse>
{
    private readonly AppDbContext _db;

    public ListLeaveTypesEndpoint(AppDbContext db) => _db = db;

    public override void Configure()
    {
        Get("/api/leave-types");
        // authenticated via JWT — no role restriction
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var items = await _db.LeaveTypes
            .Where(t => t.IsActive)
            .OrderBy(t => t.Name)
            .Select(t => new LeaveTypeDto(t.Id, t.Name, t.Code, t.DefaultDays, t.Description, t.IsActive))
            .ToListAsync(ct);

        await Send.OkAsync(new ListLeaveTypesResponse(items), ct);
    }
}
```

> `using QLNP.Api.Features.LeaveTypes;` cần được thêm vào mọi file trong sub-namespace để dùng `LeaveTypeDto`.

### Step 3 — Create endpoint (4 files)

**`Features/LeaveTypes/Create/CreateLeaveTypeRequest.cs`:**
```csharp
namespace QLNP.Api.Features.LeaveTypes.Create;

public record CreateLeaveTypeRequest(
    string Name,
    string Code,
    decimal DefaultDays,
    string? Description
);
```

**`Features/LeaveTypes/Create/CreateLeaveTypeResponse.cs`:**
```csharp
using QLNP.Api.Features.LeaveTypes;

namespace QLNP.Api.Features.LeaveTypes.Create;

public record CreateLeaveTypeResponse(LeaveTypeDto LeaveType);
```

**`Features/LeaveTypes/Create/CreateLeaveTypeValidator.cs`:**
```csharp
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.LeaveTypes.Create;

public class CreateLeaveTypeValidator : Validator<CreateLeaveTypeRequest>
{
    public CreateLeaveTypeValidator(AppDbContext db)
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên loại nghỉ không được trống")
            .MaximumLength(100);

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã loại nghỉ không được trống")
            .MaximumLength(20)
            .MustAsync(async (code, ct) =>
                !await db.LeaveTypes.AnyAsync(t => t.Code == code, ct))
            .WithMessage("Mã loại nghỉ đã tồn tại");

        RuleFor(x => x.DefaultDays)
            .GreaterThan(0).WithMessage("Số ngày mặc định phải lớn hơn 0");
    }
}
```

**`Features/LeaveTypes/Create/CreateLeaveTypeEndpoint.cs`:**
```csharp
using FastEndpoints;
using QLNP.Api.Data;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveTypes.Create;

public class CreateLeaveTypeEndpoint : Endpoint<CreateLeaveTypeRequest, CreateLeaveTypeResponse>
{
    private readonly AppDbContext _db;

    public CreateLeaveTypeEndpoint(AppDbContext db) => _db = db;

    public override void Configure()
    {
        Post("/api/leave-types");
        Roles("quantri");
    }

    public override async Task HandleAsync(CreateLeaveTypeRequest req, CancellationToken ct)
    {
        var leaveType = new LeaveType
        {
            Name = req.Name,
            Code = req.Code,
            DefaultDays = req.DefaultDays,
            Description = req.Description,
            IsActive = true
        };

        _db.LeaveTypes.Add(leaveType);
        await _db.SaveChangesAsync(ct);

        var dto = new LeaveTypeDto(leaveType.Id, leaveType.Name, leaveType.Code,
            leaveType.DefaultDays, leaveType.Description, leaveType.IsActive);

        await SendAsync(new CreateLeaveTypeResponse(dto), 201, ct);
    }
}
```

### Step 4 — Update endpoint (4 files)

**`Features/LeaveTypes/Update/UpdateLeaveTypeRequest.cs`:**
```csharp
namespace QLNP.Api.Features.LeaveTypes.Update;

public record UpdateLeaveTypeRequest(
    long Id,
    string Name,
    string Code,
    decimal DefaultDays,
    string? Description,
    bool IsActive
);
```

**`Features/LeaveTypes/Update/UpdateLeaveTypeResponse.cs`:**
```csharp
using QLNP.Api.Features.LeaveTypes;

namespace QLNP.Api.Features.LeaveTypes.Update;

public record UpdateLeaveTypeResponse(LeaveTypeDto LeaveType);
```

**`Features/LeaveTypes/Update/UpdateLeaveTypeValidator.cs`:**
```csharp
using FastEndpoints;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.LeaveTypes.Update;

public class UpdateLeaveTypeValidator : Validator<UpdateLeaveTypeRequest>
{
    public UpdateLeaveTypeValidator(AppDbContext db)
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên loại nghỉ không được trống")
            .MaximumLength(100);

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã loại nghỉ không được trống")
            .MaximumLength(20)
            // Exclude self: Code unique WHERE Id != current
            .MustAsync(async (req, code, ct) =>
                !await db.LeaveTypes.AnyAsync(t => t.Code == code && t.Id != req.Id, ct))
            .WithMessage("Mã loại nghỉ đã tồn tại");

        RuleFor(x => x.DefaultDays)
            .GreaterThan(0).WithMessage("Số ngày mặc định phải lớn hơn 0");
    }
}
```

**`Features/LeaveTypes/Update/UpdateLeaveTypeEndpoint.cs`:**
```csharp
using FastEndpoints;
using QLNP.Api.Data;

namespace QLNP.Api.Features.LeaveTypes.Update;

public class UpdateLeaveTypeEndpoint : Endpoint<UpdateLeaveTypeRequest, UpdateLeaveTypeResponse>
{
    private readonly AppDbContext _db;

    public UpdateLeaveTypeEndpoint(AppDbContext db) => _db = db;

    public override void Configure()
    {
        Put("/api/leave-types/{id}");
        Roles("quantri");
    }

    public override async Task HandleAsync(UpdateLeaveTypeRequest req, CancellationToken ct)
    {
        var leaveType = await _db.LeaveTypes.FindAsync([req.Id], ct);
        if (leaveType is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        leaveType.Name = req.Name;
        leaveType.Code = req.Code;
        leaveType.DefaultDays = req.DefaultDays;
        leaveType.Description = req.Description;
        leaveType.IsActive = req.IsActive;

        await _db.SaveChangesAsync(ct);

        var dto = new LeaveTypeDto(leaveType.Id, leaveType.Name, leaveType.Code,
            leaveType.DefaultDays, leaveType.Description, leaveType.IsActive);

        await Send.OkAsync(new UpdateLeaveTypeResponse(dto), ct);
    }
}
```

### Step 5 — Delete endpoint (1 file)

**`Features/LeaveTypes/Delete/DeleteLeaveTypeEndpoint.cs`:**
```csharp
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.LeaveTypes.Delete;

public class DeleteLeaveTypeEndpoint : EndpointWithoutRequest
{
    private readonly AppDbContext _db;

    public DeleteLeaveTypeEndpoint(AppDbContext db) => _db = db;

    public override void Configure()
    {
        Delete("/api/leave-types/{id}");
        Roles("quantri");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<long>("id");

        var leaveType = await _db.LeaveTypes.FindAsync([id], ct);
        if (leaveType is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        var hasRequests = await _db.LeaveRequests.AnyAsync(r => r.LeaveTypeId == id, ct);
        if (hasRequests)
        {
            AddError("Không thể xóa: loại nghỉ đang được sử dụng trong đơn xin nghỉ");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        // Soft delete
        leaveType.IsActive = false;
        await _db.SaveChangesAsync(ct);

        await Send.NoContentAsync(ct);
    }
}
```

### Step 6 — Thêm LeaveTypes test cases vào `QLNP.Api.http`

Append vào cuối file `packages/api/QLNP.Api.http`:

```http
### ── LeaveTypes ──────────────────────────────────────────────

### List LeaveTypes — active only
GET {{baseUrl}}/api/leave-types
Authorization: Bearer {{token}}

###

### Create LeaveType — valid (role: quantri)
POST {{baseUrl}}/api/leave-types
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Nghỉ phép năm",
  "code": "NPN",
  "defaultDays": 12,
  "description": "Nghỉ phép hàng năm theo quy định"
}

###

### Create LeaveType — invalid: DefaultDays = 0 → 400
POST {{baseUrl}}/api/leave-types
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Test",
  "code": "TST",
  "defaultDays": 0
}

###

### Create LeaveType — duplicate Code → 400
POST {{baseUrl}}/api/leave-types
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Duplicate",
  "code": "NPN",
  "defaultDays": 5
}

###

### Update LeaveType — id=1 (replace id as needed)
PUT {{baseUrl}}/api/leave-types/1
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "id": 1,
  "name": "Nghỉ phép năm (updated)",
  "code": "NPN",
  "defaultDays": 14,
  "description": "Cập nhật mô tả",
  "isActive": true
}

###

### Delete LeaveType — id=99 (soft delete; 409 nếu có requests)
DELETE {{baseUrl}}/api/leave-types/99
Authorization: Bearer {{token}}

###
```

> **Lưu ý:** Token trong `.http` file cần có `"Roles": ["quantri"]` để pass role guard. Generate token mới tại jwt.io với signing key từ `appsettings.Development.json`.

### Step 7 — Build và smoke test

```bash
cd /home/vif/qlnp-ttcds

# Build
dotnet build packages/api

# Run (để chạy .http tests)
# dotnet run --project packages/api &

# Verify build clean — 0 errors
```

### Step 8 — Commit

```bash
git add \
  packages/api/Program.cs \
  packages/api/Features/LeaveTypes/ \
  packages/api/QLNP.Api.http

git commit -m "feat(api): implement leave-types CRUD slice (list/create/update/delete)"
```

### Step 9 — Cập nhật tasks.md

Đánh dấu `[x]` cho 4 items Day 2 + thêm commit hash vào `docs/vision/tasks.md`.

## Success Criteria

- [x] `dotnet build packages/api` → 0 errors, 0 warnings
- [x] `GET /api/leave-types` → 200, trả danh sách seeded types
- [x] `POST /api/leave-types` (role=quantri) → 201, LeaveType mới
- [x] `POST /api/leave-types` (Code trùng) → 400 với validation error
- [x] `POST /api/leave-types` (DefaultDays=0) → 400
- [x] `PUT /api/leave-types/{id}` (tồn tại) → 200
- [x] `PUT /api/leave-types/{id}` (không tồn tại) → 404
- [x] `DELETE /api/leave-types/{id}` (không có requests) → 204
- [x] `DELETE /api/leave-types/{id}` (có requests) → 409
- [x] Endpoint không có `Roles("quantri")` → không yêu cầu role (List)
- [x] Endpoint có `Roles("quantri")`, token không có role → 403

## Risk Assessment

| Rủi ro | Mức | Mitigation |
|--------|-----|-----------|
| JWT `Roles` claim không map đúng → `Roles("quantri")` fail | High | **Step 0 bắt buộc:** `RoleClaimType = "Roles"` trong `TokenValidationParameters` |
| Validator DI không nhận `AppDbContext` | Low | FastEndpoints 8.x scopes validators — DI ctor injection hoạt động |
| `FindAsync([id], ct)` syntax .NET 9 | Low | Syntax đúng cho C# 12 + EF Core 9 — collection expression |
| Seeded LeaveTypes trong DB đã có Code trùng | Low | Seed chỉ có 3 types (Annual/Sick/Personal); test với code khác |

## Unresolved Questions

- Token trong `.http` file hiện tại dùng `"Roles": ["C4.PCM"]`. Cần generate token mới với `"Roles": ["quantri"]` để test Create/Update/Delete. Key dev ở `appsettings.Development.json → Jwt:SigningKey`.

## Next Steps

→ Phase 03: [Day 3 — LeaveRequests List/Create/Update](phase-03-day3-leave-requests-p1.md)
