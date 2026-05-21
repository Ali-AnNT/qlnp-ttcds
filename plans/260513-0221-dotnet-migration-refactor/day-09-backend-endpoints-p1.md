---
day: 9
title: Backend Endpoints P1
status: completed
priority: P0
effort: 1 day
date: 2026-05-14
completed: 2026-05-18
---

# Day 9: Backend Endpoints P1

## Context Links

- `packages/api/Features/Auth/Me`
- `packages/api/Features/LeaveTypes`
- `packages/api/Features/Config`
- `packages/api/Middleware/CurrentUserMiddleware.cs`
- `docs/vision/srs.md`

## Overview

Implement first backend endpoint batch: current user, leave types, config, and user-role management.

## Key Insights

- Feature folders exist but endpoint files are missing.
- Use EF Core async LINQ.
- Keep each endpoint self-contained.

## Requirements

- `GET /api/auth/me`.
- `GET/POST/PUT/DELETE /api/leave-types`.
- `GET/PUT /api/config` for approval config.
- User role read/update endpoint for QTHT.

## Architecture

FastEndpoints endpoint -> current user from `HttpContext.Items` -> `AppDbContext`.

## Related Code Files

| Action | File |
|--------|------|
| Created | `packages/api/Features/Auth/Me/Endpoint.cs`, `Data.cs`, `Models.cs` |
| Created | `packages/api/Features/LeaveTypes/List/Endpoint.cs`, `Data.cs`, `Models.cs` |
| Created | `packages/api/Features/LeaveTypes/Create/Endpoint.cs`, `Data.cs`, `Models.cs`, `Mapper.cs` |
| Created | `packages/api/Features/LeaveTypes/Update/Endpoint.cs`, `Data.cs`, `Models.cs`, `Mapper.cs` |
| Created | `packages/api/Features/LeaveTypes/Delete/Endpoint.cs`, `Data.cs`, `Models.cs` |
| Created | `packages/api/Features/Config/Get/Endpoint.cs`, `Data.cs`, `Models.cs` |
| Created | `packages/api/Features/Config/Update/Endpoint.cs`, `Data.cs`, `Models.cs` |
| Created | `packages/api/Features/Config/UserRole/Endpoint.cs`, `Data.cs`, `Models.cs` |
| Modified | `packages/api/Program.cs` — register Data classes in DI |

## Implementation Notes

- Auth/Me: Already existed, updated DTO to match frontend, fixed MapRole priority.
- LeaveTypes: Already existed, fixed to return raw DTOs instead of wrapped response.
- Config endpoints: NEWLY CREATED.
- Config UserRole endpoint: NEWLY CREATED.
- All endpoints return raw arrays/objects, no wrapping envelope.

## Todo List

- [x] Auth/Me endpoint.
- [x] LeaveTypes list/create/update/delete endpoints.
- [x] Config get/update endpoints.
- [x] UserRole endpoint(s).
- [x] `dotnet build packages/api/QLNP.Api.csproj` — 0 errors.

## Success Criteria

- Endpoints compile. -- DONE
- Non-QTHT writes return 403/401-equivalent behavior.
- Existing frontend API modules can call endpoints.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| FastEndpoints auth not configured | Use current-user checks until auth pipeline is formalized |
| Delete breaks referenced leave types | Soft-disable when requests/balances exist |

## Security Considerations

- Never trust role from request body for current request.
- Validate role updates against known roles: CB.PCM, LD.PCM, GD.PGD, QTHT.

## Next Steps

- Implement leave request/balance endpoints (Day 10).
