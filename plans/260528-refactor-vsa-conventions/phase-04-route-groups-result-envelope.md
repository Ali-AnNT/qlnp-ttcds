---
phase: 4
title: "Route Groups & Result Envelope"
status: complete
priority: P2
effort: "3h"
dependencies: [phase-03]
---

# Phase 4: Route Groups & Result Envelope

## Overview

Add FastEndpoints Route Groups for shared route prefix and auth policies, and implement the `Result<T>` response envelope for consistent API responses. This phase makes the API conform to VSA conventions for routing and response shapes.

## Requirements

### Route Groups

Create `Shared/Groups/` folder with group definitions for each domain:

| Group | Prefix | Policies/Tags |
|-------|--------|---------------|
| `LeaveRequestGroup` | `leave-requests` | Tags("Leave Requests") |
| `LeaveTypeGroup` | `leave-types` | Tags("Leave Types"), Roles(Admin) for mutations |
| `LeaveBalanceGroup` | `leave-balances` | Tags("Leave Balances") |
| `DepartmentGroup` | `departments` | Tags("Departments") |
| `SystemConfigGroup` | `system-configs` | Tags("System Configs"), Roles(Admin) for mutations |
| `AuthGroup` | `auth` | Tags("Auth") |

Each endpoint's `Configure()` changes from absolute routes to group-relative:
- `Post("/api/leave-requests")` → `Post("/create")` + `Group<LeaveRequestGroup>()`
- `Get("/api/leave-requests/my")` → `Get("/my")` + `Group<LeaveRequestGroup>()`
- etc.

### Result<T> Envelope

Create `Shared/Contracts/Result.cs` and `Shared/Contracts/PagedData.cs`:

```csharp
// Shared/Contracts/Result.cs
namespace QLNP.Api.Shared.Contracts;

public record Result<T> {
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Message { get; init; }
    public string[]? Errors { get; init; }

    public static Result<T> Ok(T data) => new() { Success = true, Data = data };
    public static Result<T> Fail(string message, string[]? errors = null) =>
        new() { Success = false, Message = message, Errors = errors };
}

// Shared/Contracts/PagedData.cs
public record PagedData<T>(List<T> Items, int TotalCount, int Page, int PageSize);
```

Configure in `Program.cs`:
```csharp
builder.Services.ConfigureHttpJsonOptions(o =>
    o.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull);

app.UseFastEndpoints(config => {
    config.Errors.ResponseBuilder = (failures, ctx) =>
        Result<object>.Fail("Validation failed", failures.Select(f => f.ErrorMessage).ToArray());
});
```

### Response Migration

Migrate all endpoint responses to use `Result<T>`:

| Current | Target |
|---------|--------|
| `Send.OkAsync(dto, ct)` | `Send.OkAsync(Result<T>.Ok(dto), ct)` |
| `Send.CreatedAtAsync(url, dto, ct)` | `Send.CreatedAtAsync(url, Result<T>.Ok(dto), ct)` |
| `Send.NotFoundAsync(ct)` | `SendAsync(Result<T>.Fail("Not found"), 404, ct)` |
| `Send.ErrorsAsync(statusCode, ct)` | Uses `Result<object>.Fail(...)` via ResponseBuilder |
| `Send.ForbiddenAsync(ct)` | `SendAsync(Result<T>.Fail("Forbidden"), 403, ct)` |

## Architecture

### Route Group Pattern

```csharp
// Shared/Groups/LeaveRequestGroup.cs
namespace QLNP.Api.Shared.Groups;

public class LeaveRequestGroup : Group {
    public LeaveRequestGroup() {
        Configure("leave-requests", ep => {
            ep.Description(x => x.WithTags("Leave Requests"));
        });
    }
}

// Features/LeaveRequests/Create/CreateLeaveRequestEndpoint.cs
public override void Configure() {
    Post("/create");
    Group<LeaveRequestGroup>();
    Roles(AppRoles.Staff, AppRoles.Leader);
}
```

### Group Auth Patterns

Some groups have mixed auth (anonymous + authenticated, or staff + admin). FastEndpoints supports `AllowAnonymous()` override at endpoint level when group requires auth, and `Roles()` override when group has different role requirements:

```csharp
// Auth group — DevLogin is anonymous
public class AuthGroup : Group {
    public AuthGroup() {
        Configure("auth", ep => {
            ep.Description(x => x.WithTags("Auth"));
        });
    }
}

// DevLogin overrides group:
public override void Configure() {
    Post("/dev-login");
    Group<AuthGroup>();
    AllowAnonymous();
}
```

## Related Code Files

- Create: `Shared/Contracts/Result.cs`, `Shared/Contracts/PagedData.cs`
- Create: `Shared/Groups/LeaveRequestGroup.cs`, `Shared/Groups/LeaveTypeGroup.cs`, etc. (6 groups)
- Modify: All 22 endpoint files (change `Configure()` routes and response types)
- Modify: `Program.cs` (add JSON options, FastEndpoints error config)

## Implementation Steps

1. **Create `Shared/Contracts/Result.cs`** — Implement `Result<T>` and `PagedData<T>` records
2. **Configure `Program.cs`** — Add JSON null-serialization option and FastEndpoints error ResponseBuilder
3. **Create Route Groups** — Create all 6 group files in `Shared/Groups/`
4. **Migrate endpoints one domain at a time**:
   - LeaveRequests (7 endpoints) — change routes to group-relative, wrap responses in `Result<T>`
   - LeaveTypes (4 endpoints)
   - LeaveBalances (3 endpoints — List, My, Seed)
   - Departments (2 endpoints)
   - SystemConfigs (2 endpoints)
   - Auth (2 endpoints)
   - Reports (1 endpoint)
5. **Update response types** — Change endpoint signatures from `Endpoint<Request, LeaveRequestDto>` to `Endpoint<Request, Result<LeaveRequestDto>>` etc.
6. **Compile and test** — `dotnet build` after each domain
7. **Manual smoke test** — Verify routes still work (groups should produce same URLs)

## Success Criteria

- [ ] All endpoints use group-relative routes with `Group<T>()`
- [ ] All responses wrapped in `Result<T>` envelope
- [ ] `Shared/Contracts/Result.cs` and `PagedData.cs` created
- [ ] All 6 route groups defined in `Shared/Groups/`
- [ ] `Program.cs` configured with `Result<object>.Fail(...)` error builder
- [ ] `dotnet build` succeeds
- [ ] API routes produce same URLs as before (e.g., `/api/leave-requests/create`)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Route URL changes | Group prefix produces `/leave-requests/create`, not `/api/leave-requests` — need to verify client expects `/api/` prefix or add it to group |
| Frontend breaking | Test all routes after migration — same HTTP paths must be preserved |
| Result<T> wrapping | Some endpoints return list directly (`List<LeaveRequestDto>`) — wrap as `Result<List<LeaveRequestDto>>` |

### Critical: Route Prefix Alignment

**Decision needed:** Current routes use `/api/leave-requests` prefix. FastEndpoints Group prefix is just `leave-requests`. We need to either:
- A) Add `/api` prefix to each group: `Configure("api/leave-requests", ...)` ← **Recommended** (preserves existing URLs)
- B) Add global route prefix in Program.cs: `app.MapFastEndpoints(config => config.Prefix = "api")` ← Alternative
- C) Change client to not use `/api` prefix ← Breaking change

**Chosen approach: A** — Include `/api` in group prefix to preserve existing URLs.

## Next Steps

→ Phase 5: Merge Config & Cleanup