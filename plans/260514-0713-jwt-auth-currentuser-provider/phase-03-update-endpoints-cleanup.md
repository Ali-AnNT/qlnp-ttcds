---
phase: 3
title: "Update Endpoints & Cleanup"
status: pending
priority: P0
effort: "1h"
dependencies: [2]
---

# Phase 3: Update Endpoints & Cleanup

## Overview

Update `MeEndpoint` to use `ICurrentUserProvider` instead of `HttpContext.Items`. Delete `CurrentUserMiddleware.cs`. Remove gateway header config. Update `.http` test file with JWT token. Build and smoke test.

## Related Code Files

- **Modify:** `packages/api/Features/Auth/Me/MeEndpoint.cs` — inject ICurrentUserProvider
- **Delete:** `packages/api/Middleware/CurrentUserMiddleware.cs`
- **Modify:** `packages/api/QLNP.Api.http` — update test with JWT Bearer token
- **Modify:** `packages/api/Program.cs` — ensure no references to old middleware

## Implementation Steps

### Step 1 — Update MeEndpoint

Replace `packages/api/Features/Auth/Me/MeEndpoint.cs`:

```csharp
using FastEndpoints;
using QLNP.Api.Auth;
using QLNP.Api.Middleware;

namespace QLNP.Api.Features.Auth.Me;

public class MeEndpoint : EndpointWithoutRequest<MeResponse>
{
    private readonly ICurrentUserProvider _userProvider;

    public MeEndpoint(ICurrentUserProvider userProvider)
    {
        _userProvider = userProvider;
    }

    public override void Configure()
    {
        Get("/api/auth/me");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var user = _userProvider.GetCurrentUser();
            await SendOkAsync(new MeResponse(
                user.UserId,
                user.DisplayName,
                user.UnitId,
                user.PhongBanId,
                user.Roles,
                user.UserIdUBTP,
                user.PhongBanIdUBTP,
                user.DonViIdUBTP
            ), ct);
        }
        catch (InvalidOperationException)
        {
            await SendUnauthorizedAsync(ct);
        }
    }
}

public record MeResponse(
    long Id,
    string DisplayName,
    long UnitId,
    long PhongBanId,
    List<string> Roles,
    int UserIdUBTP,
    int PhongBanIdUBTP,
    int DonViIdUBTP
);
```

### Step 2 — Delete CurrentUserMiddleware.cs

```bash
rm packages/api/Middleware/CurrentUserMiddleware.cs
```

Also remove `using QLNP.Api.Middleware;` line from Program.cs if no longer needed (check what else uses it — `CurrentUser` record is still in `Middleware/`).

### Step 3 — Clean Program.cs

Verify Program.cs:
- No `AddScoped<CurrentUserMiddleware>()`
- No `UseMiddleware<CurrentUserMiddleware>()`
- No `using QLNP.Api.Middleware;` (unless `CurrentUser` record still references it — keep if needed)

### Step 4 — Update .http test file

Update `packages/api/QLNP.Api.http`:

```http
@baseUrl = http://localhost:5000

### Generate dev token (run this first to get token)
# Use jwt.io or a helper to generate a token with the dev signing key

### Auth/Me — with valid JWT token
GET {{baseUrl}}/api/auth/me
Authorization: Bearer {{token}}

###

### Auth/Me — without token → 401
GET {{baseUrl}}/api/auth/me

###

### Auth/Me — with invalid token → 401
GET {{baseUrl}}/api/auth/me
Authorization: Bearer invalid.token.here
```

### Step 5 — Build & smoke test

```bash
cd /home/vif/qlnp-ttcds/packages/api
dotnet build

# Run server
dotnet run &

# Test: no token → 401
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/auth/me
# Expected: 401

# Test: with valid token → 200
# (generate token with dev key first)
curl -s http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <dev-token>" | jq .
# Expected: { "id": 4, "displayName": "...", "unitId": 49, ... }

kill %1
```

### Step 6 — Commit

```bash
git add -A packages/api/
git commit -m "feat(api): replace gateway header auth with JWT + ICurrentUserProvider"
```

## Success Criteria

- [ ] `dotnet build` passes with 0 errors
- [ ] `CurrentUserMiddleware.cs` deleted
- [ ] `MeEndpoint` uses `ICurrentUserProvider` (no `HttpContext.Items`)
- [ ] No JWT → 401 response
- [ ] Valid JWT → 200 with user data
- [ ] `MeResponse` includes all fields (Roles list, UBTP fields)
- [ ] No reference to gateway headers anywhere in code

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Other files reference `HttpContext.Items["CurrentUser"]` | Low | Only `MeEndpoint` uses it currently (confirmed by scout) |
| Dev token generation needed for testing | Medium | Use jwt.io with dev signing key, or write a simple token generator endpoint |
| `AllowAnonymous` bypasses auth — MeEndpoint returns parse error instead of 401 | Low | try-catch in HandleAsync handles missing ClaimsPrincipal |

## Next Steps

→ Update existing plan `260514-0446-2week-finalization-and-embed` Phase 01 to reference new auth approach
→ Implement remaining endpoints (LeaveTypes, LeaveRequests, etc.) using `ICurrentUserProvider`
