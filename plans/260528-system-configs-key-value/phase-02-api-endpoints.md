---
phase: 2
title: "API Endpoints"
status: pending
priority: P2
effort: "1.5h"
dependencies: [1]
---

# Phase 2: API Endpoints

## Overview

Create GET/PUT endpoints for SystemConfigs following existing Config endpoint patterns. QTHT-only access for both read and write.

## Requirements

- Functional: GET returns all configs, PUT replaces all configs (ReplaceAll pattern)
- Non-functional: Follow existing `Features/Config/` vertical slice pattern exactly

## Architecture

```
Features/SystemConfigs/
  SystemConfigDto.cs          # record (long Id, string ConfigKey, string ConfigValue, string? Description, DateTime UpdatedAt)
  Get/
    Endpoint.cs               # GET /api/system-configs [Authorize]
    Data.cs                   # GetAllAsync
  Update/
    Request.cs                # { Items: List<SystemConfigDto> }
    Response.cs               # { Message: string }
    Endpoint.cs               # PUT /api/system-configs [Admin]
    Data.cs                   # ReplaceAllAsync
```

## Related Code Files

- Create: `packages/api/Features/SystemConfigs/SystemConfigDto.cs`
- Create: `packages/api/Features/SystemConfigs/Get/Endpoint.cs`
- Create: `packages/api/Features/SystemConfigs/Get/Data.cs`
- Create: `packages/api/Features/SystemConfigs/Update/Endpoint.cs`
- Create: `packages/api/Features/SystemConfigs/Update/Data.cs`

## Implementation Steps

1. Create `SystemConfigDto.cs`:
   ```csharp
   namespace QLNP.Api.Features.SystemConfigs;

   public sealed record SystemConfigDto(
       long Id, string ConfigKey, string ConfigValue, string? Description, DateTime UpdatedAt);
   ```

2. Create `Get/Data.cs`:
   ```csharp
   // Pattern: identical to Config/Get/Data.cs
   // Query _db.SystemConfigs, project to SystemConfigDto, order by ConfigKey
   ```

3. Create `Get/Endpoint.cs`:
   ```csharp
   // GET /api/system-configs
   // RequireAuthorization (all authenticated can read)
   // Tags("SystemConfigs")
   ```

4. Create `Update/Data.cs`:
   ```csharp
   // ReplaceAllAsync: RemoveRange all, then Add new SystemConfig entities
   // Set UpdatedAt = DateTime.UtcNow on each new entity
   ```

5. Create `Update/Endpoint.cs`:
   ```csharp
   // PUT /api/system-configs
   // Roles(AppRoles.Admin) — QTHT only
   // Tags("SystemConfigs")
   // Error handling: same pattern as Config/Update/Endpoint.cs
   ```

6. Verify with `dotnet build` and manual Swagger test

## Success Criteria

- [ ] GET `/api/system-configs` returns 8 seed rows
- [ ] PUT `/api/system-configs` replaces all rows (Admin only)
- [ ] Non-admin gets 403 on PUT
- [ ] Endpoint follows existing Config vertical slice conventions
- [ ] `dotnet build` succeeds

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| ReplaceAll loses data on concurrent writes | Low | Same risk as existing Config endpoint; acceptable for admin-only config |
| Missing validation on ConfigValue format | Low | Accept string values; validation happens at consumption point (phase 4) |