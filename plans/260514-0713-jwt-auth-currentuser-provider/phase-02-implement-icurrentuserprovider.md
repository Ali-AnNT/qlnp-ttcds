---
phase: 2
title: "Implement ICurrentUserProvider"
status: completed
priority: P0
effort: "1h"
dependencies: [1]
---

# Phase 2: Implement ICurrentUserProvider

## Overview

Update `CurrentUser` record with new shape (all JWT fields + roles list). Create `ICurrentUserProvider` interface and `CurrentUserProvider` implementation that reads `ClaimsPrincipal` → typed `CurrentUser`.

## Architecture

```
ClaimsPrincipal (from JWT validation)
       ↓
CurrentUserProvider.GetCurrentUser()
  reads claims → parses → new CurrentUser(...)
       ↓
Endpoint injects ICurrentUserProvider
  var user = provider.GetCurrentUser();
```

## Related Code Files

- **Modify:** `packages/api/Middleware/CurrentUser.cs` — update record shape
- **Create:** `packages/api/Auth/ICurrentUserProvider.cs`
- **Create:** `packages/api/Auth/CurrentUserProvider.cs`
- **Modify:** `packages/api/Program.cs` — register ICurrentUserProvider

## Implementation Steps

### Step 1 — Update CurrentUser record

Replace `packages/api/Middleware/CurrentUser.cs`:

```csharp
namespace QLNP.Api.Middleware;

public record CurrentUser(
    long UserId,
    string DisplayName,
    long UnitId,
    long PhongBanId,
    string DeviceId,
    List<string> Roles,
    int UserIdUBTP,
    int PhongBanIdUBTP,
    int DonViIdUBTP
);
```

> Move from `Middleware/` to `Auth/` folder? Optional — keep in Middleware for now to minimize diff.

### Step 2 — Create ICurrentUserProvider

Create `packages/api/Auth/ICurrentUserProvider.cs`:

```csharp
using QLNP.Api.Middleware;

namespace QLNP.Api.Auth;

public interface ICurrentUserProvider
{
    CurrentUser GetCurrentUser();
}
```

### Step 3 — Create CurrentUserProvider

Create `packages/api/Auth/CurrentUserProvider.cs`:

```csharp
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using QLNP.Api.Middleware;

namespace QLNP.Api.Auth;

public class CurrentUserProvider : ICurrentUserProvider
{
    private readonly HttpContext _httpContext;

    public CurrentUserProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContext = httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("No HttpContext available");
    }

    public CurrentUser GetCurrentUser()
    {
        var user = _httpContext.User;

        return new CurrentUser(
            UserId: long.Parse(user.FindFirst("UserId")?.Value ?? "0"),
            DisplayName: user.FindFirst("DisplayName")?.Value ?? "",
            UnitId: long.Parse(user.FindFirst("UnitId")?.Value ?? "0"),
            PhongBanId: long.Parse(user.FindFirst("PhongBanId")?.Value ?? "0"),
            DeviceId: user.FindFirst("DeviceId")?.Value ?? "",
            Roles: user.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList(),
            UserIdUBTP: int.Parse(user.FindFirst("UserIdUBTP")?.Value ?? "0"),
            PhongBanIdUBTP: int.Parse(user.FindFirst("PhongBanIdUBTP")?.Value ?? "0"),
            DonViIdUBTP: int.Parse(user.FindFirst("DonViIdUBTP")?.Value ?? "-1")
        );
    }
}
```

> **Note:** Claims are read directly by JWT claim name (e.g. `"UserId"`, `"DisplayName"`). `ClaimTypes.Role` maps to `"Roles"` array from the token — JwtBearer handler automatically maps `Roles` array to multiple `ClaimTypes.Role` claims.

### Step 4 — Register in DI

Add to `Program.cs` after auth setup:

```csharp
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserProvider, CurrentUserProvider>();
```

### Step 5 — Build verification

```bash
dotnet build
```

## Success Criteria

- [ ] `CurrentUser` record has all 9 fields from JWT token
- [ ] `ICurrentUserProvider` interface with `GetCurrentUser()` method
- [ ] `CurrentUserProvider` correctly parses all claims
- [ ] `dotnet build` passes
- [ ] Both files < 50 lines each

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Claim names don't match JWT payload | Medium | JWT claim names are exact keys from token (`UserId`, `DisplayName`, etc.) |
| Roles claim mapping differs | Low | If `ClaimTypes.Role` doesn't work, use `"Roles"` or configure `NameClaimType`/`RoleClaimType` in TokenValidationParameters |
| Parse errors for missing claims | Low | Default values provided (0, "", empty list) |

## Unresolved Questions

- Confirm JwtBearer handler maps `Roles` JSON array to multiple `ClaimTypes.Role` claims — may need `RoleClaimType = "Roles"` in `TokenValidationParameters` if default doesn't work.
