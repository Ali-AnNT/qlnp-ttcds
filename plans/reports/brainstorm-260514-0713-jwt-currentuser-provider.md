# Brainstorm: JWT Authentication + Typed CurrentUser Provider

**Date:** 2026-05-14
**Branch:** feat/efcore-migration-net9-fastendpoints
**Approach:** B — JWT Bearer + Typed ICurrentUserProvider

## Problem

Backend hiện không validate JWT. Auth dựa trên gateway headers (`X-User-Id`, `X-User-Name`, `X-User-FullName`) — không type-safe, không dùng ASP.NET auth infra. Frontend đã gửi JWT nhưng bị ignore.

Token JWT chứa rich user data (13 roles, UnitId, PhongBanId, UBTP fields) nhưng model `CurrentUser` hiện tại quá đơn giản (1 role string, không có UBTP).

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth source | JWT only | Remove gateway header dependency |
| Primary key | `UserId` ("4") → long | Maps directly to USER_MASTER.USER_ID |
| Roles model | Full list | All 13 roles preserved for fine-grained auth |
| Auth infra | ASP.NET Core standard | AddJwtBearer + ClaimsPrincipal + [Authorize] |
| Signing | Signing key available | Symmetric or asymmetric key configured in appsettings |
| UBTP fields | Keep | Needed for business logic |
| DB lookup | None for auth | All data from JWT claims, no DB query |

## Recommended Design: Approach B

### Architecture

```
Request → AddJwtBearer validates token
       → ClaimsPrincipal populated with all claims
       → ICurrentUserProvider.Parse(ClaimsPrincipal) → CurrentUser record
       → Endpoint injects ICurrentUserProvider → typed access
```

### CurrentUser Record (New Shape)

```csharp
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

### ICurrentUserProvider

```csharp
public interface ICurrentUserProvider
{
    CurrentUser GetCurrentUser();
}
```

Implementation reads `HttpContext.User` (ClaimsPrincipal), parses claims → typed `CurrentUser`. Registered as Scoped (1 per request).

### Claims Mapping

| JWT Claim | Claim Type | CurrentUser Field | Parse |
|-----------|-----------|-------------------|-------|
| `UserId` | Custom: `app_user_id` | `UserId` | `long.Parse` |
| `DisplayName` | `ClaimTypes.Name` | `DisplayName` | string |
| `UnitId` | Custom: `app_unit_id` | `UnitId` | `long.Parse` |
| `PhongBanId` | Custom: `app_phongban_id` | `PhongBanId` | `long.Parse` |
| `DeviceId` | Custom: `app_device_id` | `DeviceId` | string |
| `Roles[]` | `ClaimTypes.Role` | `Roles` | multiple claims → List |
| `UserIdUBTP` | Custom: `app_ubtp_userid` | `UserIdUBTP` | `int.Parse` |
| `PhongBanIdUBTP` | Custom: `app_ubtp_phongbanid` | `PhongBanIdUBTP` | `int.Parse` |
| `DonViIdUBTP` | Custom: `app_ubtp_donviid` | `DonViIdUBTP` | `int.Parse` |

### Files to Change

| File | Action | Description |
|------|--------|-------------|
| `Program.cs` | Modify | Add `AddAuthentication` + `AddJwtBearer` with signing key config |
| `Middleware/CurrentUser.cs` | Modify | Update record shape to include all fields |
| `ICurrentUserProvider.cs` | Create | Interface for typed user access |
| `CurrentUserProvider.cs` | Create | Implementation: reads ClaimsPrincipal → CurrentUser |
| `Middleware/CurrentUserMiddleware.cs` | Remove | No longer needed |
| `Features/Auth/Me/MeEndpoint.cs` | Modify | Inject `ICurrentUserProvider` instead of `HttpContext.Items` |
| `appsettings.json` | Modify | Add JWT config section (Issuer, Audience, SigningKey) |
| `appsettings.Development.json` | Modify | Dev JWT config + keep DevMode fallback |

### FastEndpoints Integration

- Endpoints use `[Authorize]` attribute or `Options(x => x.RequireAuthorization())`
- Inject `ICurrentUserProvider` in constructor for typed access
- Anonymous endpoints keep `AllowAnonymous()`

### Security Considerations

- Signing key stored in config (production → env vars or secret manager)
- Token expiry validated by `AddJwtBearer` middleware automatically
- `Issuer` + `Audience` validation enabled
- No DB query = faster, but user data freshness depends on token lifetime

## Alternatives Considered

| Approach | Why Not |
|----------|---------|
| A: Raw Claims access | Not type-safe, parse logic scattered |
| C: Middleware + HttpContext.Items | Doesn't leverage ASP.NET auth infra fully, not type-safe |

## Unresolved Questions

- Signing key type: symmetric (HMAC) or asymmetric (RSA/ECDSA)? Need actual key to configure.
- DevMode: keep DevMode fallback for development without JWT, or generate dev tokens?

## Next Steps

→ `/ck:plan` to create implementation plan
