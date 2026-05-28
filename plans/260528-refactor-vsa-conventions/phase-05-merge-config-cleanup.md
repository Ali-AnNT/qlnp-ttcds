---
phase: 5
title: "Merge Config & Cleanup"
status: complete
priority: P2
effort: "2h"
dependencies: [phase-04]
---

# Phase 5: Merge Config & Cleanup

## Overview

Merge the `Config/` and `SystemConfigs/` feature folders (they represent the same domain — leave approval configuration and system configuration), and perform final cleanup: remove empty directories, verify all namespaces, update documentation, and run architecture verification.

## Requirements

### Config Merge

Currently there are two feature folders dealing with configuration:
- `Features/Config/` — CRUD for `LeaveConfig` (approval flow per leave type)
- `Features/SystemConfigs/` — CRUD for `SystemConfig` (global settings like max_annual_leave)

**Analysis:** These are separate entities (`LeaveConfig` vs `SystemConfig`) but belong to the same domain (configuration). VSA groups by domain, not entity. Merge into `Features/SystemConfigs/` since `SystemConfig` is the broader domain.

| Current | Target | Notes |
|---------|--------|-------|
| `Config/Get/` | `SystemConfigs/GetLeaveConfigs/` | Rename action for clarity |
| `Config/Update/` | `SystemConfigs/ReplaceLeaveConfigs/` | Rename action for clarity |
| `Config/ConfigDto.cs` | `SystemConfigs/LeaveConfigDto.cs` | Rename DTO |
| `SystemConfigs/Get/` | `SystemConfigs/GetSystemConfigs/` | Rename action for clarity |
| `SystemConfigs/Update/` | `SystemConfigs/ReplaceSystemConfigs/` | Rename action for clarity |

### Final Cleanup

- Remove empty directories (`Entities/`, `Auth/` at root, `Middleware/` at root, `Shared/Services/`)
- Verify all `using` directives resolve to new namespaces
- Verify `dotnet build` with zero warnings
- Update `README.md` project structure section
- Verify all API routes work (manual smoke test)

## Architecture

### After Merge

```
Features/SystemConfigs/
├── GetLeaveConfigs/
│   ├── GetLeaveConfigsEndpoint.cs
│   └── GetLeaveConfigsRequest.cs
├── ReplaceLeaveConfigs/
│   ├── ReplaceLeaveConfigsEndpoint.cs
│   ├── ReplaceLeaveConfigsRequest.cs
│   └── ReplaceLeaveConfigsValidator.cs
├── GetSystemConfigs/
│   ├── GetSystemConfigsEndpoint.cs
│   └── GetSystemConfigsRequest.cs
├── ReplaceSystemConfigs/
│   ├── ReplaceSystemConfigsEndpoint.cs
│   ├── ReplaceSystemConfigsRequest.cs
│   └── ReplaceSystemConfigsValidator.cs
├── LeaveConfigDto.cs          ← shared DTO
└── SystemConfigDto.cs         ← shared DTO
```

### Route Group Impact

Both `Config` and `SystemConfigs` share the same group prefix. After merge:

```csharp
public class SystemConfigGroup : Group {
    public SystemConfigGroup() {
        Configure("api/system-configs", ep => {
            ep.Description(x => x.WithTags("System Configs"));
        });
    }
}
```

- `GET /api/system-configs` → `GetSystemConfigs`
- `PUT /api/system-configs` → `ReplaceSystemConfigs`
- `GET /api/system-configs/leave-configs` → `GetLeaveConfigs`
- `PUT /api/system-configs/leave-configs` → `ReplaceLeaveConfigs`

**Note:** This changes the existing `/api/config` route to `/api/system-configs/leave-configs`. If the frontend consumes `/api/config`, it must be updated. Check frontend API module.

## Related Code Files

- Delete: `Features/Config/` directory (entire folder)
- Create: `Features/SystemConfigs/GetLeaveConfigs/`, `Features/SystemConfigs/ReplaceLeaveConfigs/`
- Modify: `SystemConfigGroup.cs` — add leave-config routes
- Modify: Frontend API module (if it calls `/api/config`)
- Modify: `Program.cs` — remove Config Data class registrations
- Verify: All namespaces compile

## Implementation Steps

1. **Create new action folders** in `Features/SystemConfigs/`:
   - `GetLeaveConfigs/` with endpoint, request
   - `ReplaceLeaveConfigs/` with endpoint, request, validator
2. **Migrate logic** from `Config/Get/` and `Config/Update/` endpoints to new folders
3. **Move `ConfigDto.cs`** → `SystemConfigs/LeaveConfigDto.cs`
4. **Update routes** — Add leave-config routes to `SystemConfigGroup`
5. **Delete `Features/Config/` directory**
6. **Clean Program.cs** — Remove `Config.Get.Data` and `Config.Update.Data` registrations
7. **Update frontend** — Change `/api/config` calls to `/api/system-configs/leave-configs`
8. **Remove empty directories** — `Entities/`, root `Auth/`, root `Middleware/`, `Shared/Services/`
9. **Verify compilation** — `dotnet build` with zero errors
10. **Update README.md** — Reflect new project structure
11. **Smoke test** — Verify all API routes return expected responses

## Success Criteria

- [ ] `Features/Config/` directory no longer exists
- [ ] Leave config endpoints accessible at `/api/system-configs/leave-configs`
- [ ] System config endpoints accessible at `/api/system-configs`
- [ ] All empty directories from old structure removed
- [ ] `dotnet build` succeeds with zero errors
- [ ] All API routes return expected responses
- [ ] `README.md` project structure section updated
- [ ] Frontend updated to use new config routes

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Frontend breaking on `/api/config` route change | Update frontend API module simultaneously |
| Config DTO name collision | `LeaveConfigDto` vs `SystemConfigDto` are distinct names — no collision |
| Seed data references | `AppDbContext.OnModelCreating` seeds `LeaveConfig` — no route change needed |

## Final Verification Checklist

After Phase 5, verify the entire refactoring:

- [ ] Zero `Data.cs` files in feature folders
- [ ] Zero manual DI registrations for Data classes in Program.cs
- [ ] All files follow `{Action}{Role}.cs` naming convention
- [ ] All namespaces match folder structure
- [ ] All endpoints use property injection
- [ ] All endpoints use `Group<T>()` for route grouping
- [ ] All responses wrapped in `Result<T>`
- [ ] `Shared/Domain/` contains entities and domain helpers
- [ ] `Infrastructure/Auth/` contains auth files
- [ ] `Shared/Middleware/` contains CurrentUser
- [ ] `Shared/Contracts/` contains Result and PagedData
- [ ] `Shared/Groups/` contains route group definitions
- [ ] `dotnet build` succeeds
- [ ] `dotnet ef database update` works (migrations still apply)
- [ ] All existing API routes still return expected data