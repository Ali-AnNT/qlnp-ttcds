---
title: "JWT Auth + Typed ICurrentUserProvider"
description: "Replace gateway header auth with JWT validation + typed ICurrentUserProvider"
status: completed
priority: P0
branch: "toanhv/add-apis-for-qlnp"
tags: [auth, jwt, fastendpoints]
blockedBy: []
blocks: []
created: "2026-05-14T07:18:29.181Z"
completed_date: "2026-05-20"
completedBy: "implementation ahead of plan"
createdBy: "ck:plan"
source: skill
---

# JWT Auth + Typed ICurrentUserProvider

## Overview

Replace gateway header auth (`X-User-Id`/`X-User-Name`/`X-User-FullName`) with standard ASP.NET Core JWT Bearer validation. Add typed `ICurrentUserProvider` for type-safe user access in FastEndpoints.

**Status: COMPLETED** — JWT infrastructure and ICurrentUserProvider are implemented and working.

## Implementation Status

| Phase | Name | Status | Notes |
|-------|------|--------|-------|
| 1 | [Setup JWT Infrastructure](./phase-01-setup-jwt-infrastructure.md) | ✅ completed | `AddJwtBearer` + `RoleClaimType = "Roles"` in Program.cs |
| 2 | [Implement ICurrentUserProvider](./phase-02-implement-icurrentuserprovider.md) | ✅ completed | `ICurrentUserProvider` + `CurrentUserProvider` in Auth/ |
| 3 | [Update Endpoints & Cleanup](./phase-03-update-endpoints-cleanup.md) | ✅ completed | All endpoints use ICurrentUserProvider, old middleware removed |

## What Was Actually Implemented

### Phase 1 — JWT Infrastructure ✅
- `Microsoft.AspNetCore.Authentication.JwtBearer` package added
- `AddAuthentication` + `AddJwtBearer` in Program.cs
- `TokenValidationParameters` with `RoleClaimType = "Roles"`
- `UseAuthentication()` + `UseAuthorization()` in middleware pipeline
- JWT config in appsettings (Issuer, Audience, SigningKey)

### Phase 2 — ICurrentUserProvider ✅
- `ICurrentUserProvider` interface in `Auth/ICurrentUserProvider.cs`
- `CurrentUserProvider` in `Auth/CurrentUserProvider.cs` — reads JWT claims
- `CurrentUser` record with 9 fields (UserId, DisplayName, UnitId, PhongBanId, DeviceId, Roles, UserIdUBTP, PhongBanIdUBTP, DonViIdUBTP)
- Registered as scoped in DI: `AddScoped<ICurrentUserProvider, CurrentUserProvider>()`

### Phase 3 — Endpoints & Cleanup ✅
- `CurrentUserMiddleware.cs` deleted (no longer exists)
- No `HttpContext.Items["CurrentUser"]` usage anywhere
- All endpoints needing user context inject `ICurrentUserProvider`
- 8 endpoints actively use `_currentUser.GetCurrentUser()`

## Known Issues (from audit 2026-05-20)

| Issue | Severity | Detail |
|-------|----------|--------|
| Auth/Me no `RequireAuthorization()` | HIGH | Endpoint accessible without JWT, relies on ICurrentUserProvider throwing instead |
| Silent-fail on missing claims | MED | `long.Parse(null ?? "0")` defaults to 0 instead of throwing — masks config errors |
| No `ILogger` in CurrentUserProvider | LOW | Can't trace claim parsing failures |

## Token Claims → CurrentUser Mapping (Actual)

| JWT Claim | CurrentUser Field | Parse | Fallback |
|-----------|-------------------|-------|----------|
| `UserId` | `UserId` (long) | `long.Parse` | `"0"` |
| `DisplayName` | `DisplayName` (string) | direct | `""` |
| `UnitId` | `UnitId` (long) | `long.Parse` | `"0"` |
| `PhongBanId` | `PhongBanId` (long) | `long.Parse` | `"0"` |
| `DeviceId` | `DeviceId` (string) | direct | `""` |
| `Roles[]` | `Roles` (List<string>) | `ClaimTypes.Role` | empty list |
| `UserIdUBTP` | `UserIdUBTP` (int) | `int.Parse` | `"0"` |
| `PhongBanIdUBTP` | `PhongBanIdUBTP` (int) | `int.Parse` | `"0"` |
| `DonViIdUBTP` | `DonViIdUBTP` (int) | `int.Parse` | `"-1"` |

## Dependencies

- ~~Blocks: `260514-0446-2week-finalization-and-embed`~~ — resolved, 2week plan unblocked