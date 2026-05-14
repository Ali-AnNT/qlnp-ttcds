---
day: 9
title: Backend Endpoints P1
status: not_started
priority: P0
effort: 1 day
date: 2026-05-14
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
| Create | `packages/api/Features/Auth/Me/MeEndpoint.cs` |
| Create | `packages/api/Features/LeaveTypes/List/ListLeaveTypesEndpoint.cs` |
| Create | `packages/api/Features/LeaveTypes/Create/CreateLeaveTypeEndpoint.cs` |
| Create | `packages/api/Features/LeaveTypes/Update/UpdateLeaveTypeEndpoint.cs` |
| Create | `packages/api/Features/LeaveTypes/Delete/DeleteLeaveTypeEndpoint.cs` |
| Create | `packages/api/Features/Config/Get/GetConfigEndpoint.cs` |
| Create | `packages/api/Features/Config/Update/UpdateConfigEndpoint.cs` |
| Create | `packages/api/Features/Config/UserRole/*Endpoint.cs` |

## Implementation Steps

1. Add small request/response records near endpoint classes or in same folder files.
2. Implement `MeEndpoint` using middleware current user and DB lookup.
3. Implement leave type list with optional active filter.
4. Implement QTHT-only create/update/delete; soft-disable if referenced.
5. Implement config get/update for `LeaveConfigs`.
6. Implement user role read/update, validating role values.
7. Build API.

## Todo List

- [ ] Auth/Me endpoint.
- [ ] LeaveTypes list/create/update/delete endpoints.
- [ ] Config get/update endpoints.
- [ ] UserRole endpoint(s).
- [ ] `dotnet build packages/api/QLNP.Api.csproj`.

## Success Criteria

- Endpoints compile.
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

- Implement leave request/balance endpoints.
