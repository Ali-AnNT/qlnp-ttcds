---
phase: 1
title: "Day 1 — Auth/Me Endpoint + CSP + Smoke Test"
status: completed
priority: P0
effort: "4-5h"
dependencies: []
---

# Phase 01: Day 1 — Auth/Me Endpoint + CSP + Smoke Test

## Overview

Implement `MeEndpoint` (slice đầu tiên trong VSP), wire CSP `frame-ancestors` header, verify `CurrentUserMiddleware` + DevMode, build và smoke test bằng `.http` file.

Sau phase này: GET `/api/auth/me` trả đúng user profile qua DevMode fallback và qua gateway headers giả lập.

## Context

- **Refs:** [BRD FR-002, FR-003, FR-004](../../docs/vision/brd.md) | [SRS FR-01](../../docs/vision/srs.md)
- **Action item (Day 1):** CSP `frame-ancestors` middleware — [tasks.md §Action items](../../docs/vision/tasks.md)

## Trạng thái hiện tại

```
packages/api/
├── Features/Auth/Me/        ← folder tồn tại, KHÔNG có .cs
├── Middleware/
│   ├── CurrentUser.cs       ✅ record CurrentUser(UserId, UserName, FullName, DonViId, Role)
│   └── CurrentUserMiddleware.cs  ✅ parse X-User-Id / DevMode fallback
├── Program.cs               ✅ AddFastEndpoints, scoped CurrentUserMiddleware
└── appsettings.Development.json  ✅ DevMode:Enabled=true
```

**Thiếu:** `MeEndpoint.cs`, `Security:FrameAncestors` config, `.http` test file, CSP header wiring.

## Yêu cầu

- FR-002: `GET /api/auth/me` → `{ id, userName, fullName, departmentId, role }`
- FR-003: CurrentUserMiddleware đọc headers `X-User-Id`, `X-User-Name`, `X-User-FullName`; lookup `USER_MASTER` + `UserRoles`
- FR-004: DevMode fallback → `{ userId=1, userName="admin", fullName="Administrator", role="quantri" }`
- BRD §Appendix B: endpoint không có login form, không nhận password
- Action item: CSP `Content-Security-Policy: frame-ancestors <FrameAncestors>` (env-driven)

## Related Code Files

- **Create:** `packages/api/Features/Auth/Me/MeEndpoint.cs`
- **Create:** `packages/api/QLNP.Api.http`
- **Modify:** `packages/api/Program.cs` — thêm CSP inline middleware
- **Modify:** `packages/api/appsettings.json` — thêm `Security.FrameAncestors`

## Architecture

```
HTTP GET /api/auth/me
    │
    ├─ CurrentUserMiddleware (đã chạy)
    │     ├─ Header X-User-Id present → lookup USER_MASTER → CurrentUser ← HttpContext.Items
    │     └─ DevMode:Enabled → CurrentUser fallback admin
    │
    └─ MeEndpoint.HandleAsync()
          ├─ CurrentUser == null → 401
          └─ CurrentUser → 200 MeResponse(id, userName, fullName, departmentId, role)
```

**CSP Middleware** (inline trong Program.cs, đặt TRƯỚC `UseFastEndpoints`):
```
app.Use(async (ctx, next) => {
    ctx.Response.Headers.Append("Content-Security-Policy", "frame-ancestors {FrameAncestors}");
    await next(ctx);
});
```

## Implementation Steps

### Step 1 — Tạo `MeEndpoint.cs`

Tạo file `packages/api/Features/Auth/Me/MeEndpoint.cs`:

```csharp
using FastEndpoints;
using QLNP.Api.Middleware;

namespace QLNP.Api.Features.Auth.Me;

public class MeEndpoint : EndpointWithoutRequest<MeResponse>
{
    public override void Configure()
    {
        Get("/api/auth/me");
        AllowAnonymous(); // CurrentUserMiddleware xử lý auth, không dùng FastEndpoints auth scheme
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var user = HttpContext.Items["CurrentUser"] as CurrentUser;
        if (user is null)
        {
            await SendUnauthorizedAsync(ct);
            return;
        }

        await SendOkAsync(new MeResponse(
            user.UserId,
            user.UserName,
            user.FullName,
            user.DonViId,
            user.Role
        ), ct);
    }
}

public record MeResponse(long Id, string UserName, string FullName, long? DepartmentId, string Role);
```

> **Lý do `AllowAnonymous`:** FastEndpoints mặc định yêu cầu auth scheme (JWT/cookie). Ta dùng `CurrentUserMiddleware` tự resolve user từ gateway headers — không dùng `[Authorize]`. Trả 401 thủ công khi `HttpContext.Items["CurrentUser"]` là null.

### Step 2 — Thêm `Security:FrameAncestors` vào `appsettings.json`

Thêm vào `packages/api/appsettings.json` (sau `GatewayHeaders`):

```json
"Security": {
  "FrameAncestors": "'self'"
}
```

> Dev để `'self'`; production Host Team cung cấp domain thực → override qua env var `Security__FrameAncestors`.

### Step 3 — Wire CSP middleware trong `Program.cs`

Thêm **trước** `app.UseFastEndpoints()`:

```csharp
var frameAncestors = app.Configuration["Security:FrameAncestors"] ?? "'self'";
app.Use(async (ctx, next) =>
{
    ctx.Response.Headers.Append("Content-Security-Policy", $"frame-ancestors {frameAncestors}");
    await next(ctx);
});
```

> **Không thêm `X-Frame-Options`:** header này không hỗ trợ `allow-from` trong Chrome/Firefox — CSP `frame-ancestors` là standard hiện tại.

### Step 4 — Tạo `.http` smoke test file

Tạo `packages/api/QLNP.Api.http`:

```http
@baseUrl = http://localhost:5000

### [DevMode] Auth/Me — không có gateway headers → dùng DevMode fallback
GET {{baseUrl}}/api/auth/me

###

### [Gateway] Auth/Me — giả lập gateway headers
GET {{baseUrl}}/api/auth/me
X-User-Id: 1
X-User-Name: admin
X-User-FullName: Administrator

###

### [Unauthorized] Auth/Me — không có headers, DevMode tắt → 401
# Tắt DevMode trong appsettings.Development.json trước khi chạy case này
GET {{baseUrl}}/api/auth/me
X-User-Id: 999
X-User-Name: ghost
X-User-FullName: Ghost User
```

> Case 3 (userId=999) sẽ resolve null từ DB → `CurrentUser` null → 401. Test sau khi có DB connectivity.

### Step 5 — Build và chạy smoke test

```bash
cd /home/vif/qlnp-ttcds/packages/api

# Build
dotnet build

# Chạy server
dotnet run &

# Smoke test bằng curl (DevMode)
curl -s http://localhost:5000/api/auth/me | jq .
# Expected: { "id": 1, "userName": "admin", "fullName": "Administrator", "departmentId": null, "role": "quantri" }

# Kiểm tra CSP header
curl -sI http://localhost:5000/api/auth/me | grep -i content-security-policy
# Expected: content-security-policy: frame-ancestors 'self'

# Dừng server sau test
kill %1
```

### Step 6 — Commit

```bash
git add packages/api/Features/Auth/Me/MeEndpoint.cs \
        packages/api/Program.cs \
        packages/api/appsettings.json \
        packages/api/QLNP.Api.http

git commit -m "feat(api): implement auth/me endpoint with current user middleware"
```

## Success Criteria

- [ ] `dotnet build packages/api` thành công, không warning/error
- [ ] `GET /api/auth/me` với DevMode=true → 200 `{ id:1, userName:"admin", role:"quantri" }`
- [ ] `GET /api/auth/me` với headers `X-User-Id: 1` → 200 (DB có user id=1) hoặc 401 (DB chưa seed)
- [ ] Response header `Content-Security-Policy: frame-ancestors 'self'` present
- [ ] `MeEndpoint.cs` < 40 dòng (KISS)
- [ ] Commit đã được push lên branch `feat/efcore-migration-net9-fastendpoints`

## Risk Assessment

| Rủi ro | Mức | Mitigation |
|--------|-----|-----------|
| DB connection timeout (SQL Server không up) | Medium | DevMode fallback hoạt động độc lập — smoke test vẫn pass với DevMode |
| FastEndpoints 8.x API khác với snippet trên | Low | Verify với [FastEndpoints docs](https://fast-endpoints.com) nếu cần |
| `UserMasterId` dùng `long` nhưng header parse `long` — type mismatch nếu real userId là Guid | Low | Confirm từ `UserMaster.cs`: `UserMasterId` = `long` ✅ |

## Unresolved Questions

- `USER_MASTER` có user id=1 trong SQL Server hiện tại chưa? → Cần confirm để test Case 2 trong `.http`. Nếu chưa, DevMode (Case 1) là đủ cho Day 1.
- `appsettings.Development.json` thiếu `DevMode:Enabled` sẽ fallback về `false` → không có user. Đã confirm `DevMode:Enabled=true` ✅.

## Next Steps

→ Phase 02: [Day 2 — LeaveTypes slice](phase-02-day2-leave-types.md)
