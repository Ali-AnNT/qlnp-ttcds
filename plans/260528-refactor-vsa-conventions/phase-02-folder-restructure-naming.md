---
phase: 2
title: "Folder Restructure & Naming"
status: complete
priority: P1
effort: "4h"
dependencies: [phase-01]
---

# Phase 2: Folder Restructure & Naming

## Overview

Rename files to VSA convention (`{Action}{Role}.cs`), reorganize folder structure (`Entities/` → `Shared/Domain/`, `Auth/` → `Infrastructure/Auth/`, `Middleware/` → `Shared/Middleware/`), and move shared helpers to proper tier locations. Each sub-step is independently compilable.

## Requirements

- All feature files renamed from generic (`Endpoint.cs`, `Models.cs`, `Data.cs`, `Mapper.cs`) to descriptive (`CreateLeaveRequestEndpoint.cs`, `CreateLeaveRequestRequest.cs`, etc.)
- `Entities/` folder contents → `Shared/Domain/`
- `Auth/` folder contents → `Infrastructure/Auth/`
- `Middleware/CurrentUser.cs` → `Shared/Middleware/CurrentUser.cs`
- `Shared/Services/ILeaveBalanceService.cs` + `LeaveBalanceService.cs` → `Shared/Domain/`
- `Features/LeaveRequests/ApprovalHelper.cs` → `Shared/Domain/ApprovalHelper.cs`
- `Features/LeaveRequests/BusinessDayCalculator.cs` → `Shared/Domain/BusinessDayCalculator.cs`
- `Features/LeaveRequests/LeaveRequestDto.cs` → stays in `Features/LeaveRequests/` (shared DTO, Rule of 3 — used by 7 actions)
- `Features/LeaveRequests/LeaveRequestMapping.cs` → stays in `Features/LeaveRequests/` (extension method, used by 6 actions)
- All namespaces updated to match new folder structure
- All `using` directives updated
- Program.cs updated with new namespace references

## Architecture

### Current → Target Mapping (File Names)

| Current | Target | Notes |
|---------|--------|-------|
| `LeaveRequests/Create/Endpoint.cs` | `LeaveRequests/Create/CreateLeaveRequestEndpoint.cs` | |
| `LeaveRequests/Create/Models.cs` | `LeaveRequests/Create/CreateLeaveRequestRequest.cs` + `CreateLeaveRequestValidator.cs` | Split into 2 files |
| `LeaveRequests/Create/Data.cs` | (stays for now, eliminated in Phase 3) | |
| `LeaveRequests/Create/Mapper.cs` | `LeaveRequests/Create/CreateLeaveRequestMapper.cs` | |
| `LeaveRequests/Update/Endpoint.cs` | `LeaveRequests/Update/UpdateLeaveRequestEndpoint.cs` | |
| `LeaveRequests/Update/Models.cs` | `LeaveRequests/Update/UpdateLeaveRequestRequest.cs` + `UpdateLeaveRequestValidator.cs` | |
| `LeaveRequests/Update/Mapper.cs` | `LeaveRequests/Update/UpdateLeaveRequestMapper.cs` | |
| `LeaveRequests/Approve/Endpoint.cs` | `LeaveRequests/Approve/ApproveLeaveRequestEndpoint.cs` | |
| `LeaveRequests/Approve/Models.cs` | `LeaveRequests/Approve/ApproveLeaveRequestValidator.cs` | (no request body) |
| `LeaveRequests/Reject/Endpoint.cs` | `LeaveRequests/Reject/RejectLeaveRequestEndpoint.cs` | |
| `LeaveRequests/Reject/Models.cs` | `LeaveRequests/Reject/RejectLeaveRequestRequest.cs` + `RejectLeaveRequestValidator.cs` | |
| `LeaveRequests/Cancel/Endpoint.cs` | `LeaveRequests/Cancel/CancelLeaveRequestEndpoint.cs` | |
| `LeaveRequests/Cancel/Models.cs` | `LeaveRequests/Cancel/CancelLeaveRequestValidator.cs` | (no request body) |
| `LeaveRequests/My/Endpoint.cs` | `LeaveRequests/My/MyLeaveRequestsEndpoint.cs` | |
| `LeaveRequests/My/Models.cs` | DELETE (empty) | |
| `LeaveRequests/List/Endpoint.cs` | `LeaveRequests/List/ListLeaveRequestsEndpoint.cs` | |
| `LeaveRequests/List/Models.cs` | `LeaveRequests/List/ListLeaveRequestsRequest.cs` | |
| `LeaveTypes/Create/Endpoint.cs` | `LeaveTypes/Create/CreateLeaveTypeEndpoint.cs` | |
| `LeaveTypes/Create/Models.cs` | `LeaveTypes/Create/CreateLeaveTypeRequest.cs` + `CreateLeaveTypeValidator.cs` | |
| `LeaveTypes/Create/Mapper.cs` | `LeaveTypes/Create/CreateLeaveTypeMapper.cs` | |
| `LeaveTypes/Update/Endpoint.cs` | `LeaveTypes/Update/UpdateLeaveTypeEndpoint.cs` | |
| `LeaveTypes/Update/Models.cs` | `LeaveTypes/Update/UpdateLeaveTypeRequest.cs` + `UpdateLeaveTypeValidator.cs` | |
| `LeaveTypes/Update/Mapper.cs` | `LeaveTypes/Update/UpdateLeaveTypeMapper.cs` | |
| `LeaveTypes/List/Endpoint.cs` | `LeaveTypes/List/ListLeaveTypesEndpoint.cs` | |
| `LeaveTypes/List/Models.cs` | `LeaveTypes/List/ListLeaveTypesRequest.cs` | |
| `LeaveTypes/Delete/Endpoint.cs` | `LeaveTypes/Delete/DeleteLeaveTypeEndpoint.cs` | |
| `LeaveTypes/Delete/Models.cs` | `LeaveTypes/Delete/DeleteLeaveTypeRequest.cs` | |
| `LeaveBalances/List/Endpoint.cs` | `LeaveBalances/List/ListLeaveBalancesEndpoint.cs` | |
| `LeaveBalances/List/Models.cs` | `LeaveBalances/List/ListLeaveBalancesRequest.cs` | |
| `LeaveBalances/My/Endpoint.cs` | `LeaveBalances/My/MyLeaveBalanceEndpoint.cs` | |
| `LeaveBalances/My/Models.cs` | `LeaveBalances/My/MyLeaveBalanceRequest.cs` | |
| `LeaveBalances/Seed/Data.cs` | `LeaveBalances/Seed/SeedLeaveBalancesEndpoint.cs` or `Shared/Domain/LeaveBalanceSeeding.cs` | |
| `Departments/Get/Endpoint.cs` | `Departments/Get/GetDepartmentEndpoint.cs` | |
| `Departments/List/Endpoint.cs` | `Departments/List/ListDepartmentsEndpoint.cs` | |
| `Departments/DepartmentDto.cs` | `Departments/DepartmentDto.cs` | (stays, shared DTO) |
| `Config/Get/Endpoint.cs` | (merged into SystemConfigs in Phase 5) | |
| `Config/Update/Endpoint.cs` | (merged into SystemConfigs in Phase 5) | |
| `SystemConfigs/Get/Endpoint.cs` | `SystemConfigs/Get/GetSystemConfigEndpoint.cs` | |
| `SystemConfigs/Update/Endpoint.cs` | `SystemConfigs/Update/UpdateSystemConfigEndpoint.cs` | |
| `Reports/Export/Endpoint.cs` | `Reports/Export/ExportReportEndpoint.cs` | |

### Current → Target Mapping (Folder Structure)

| Current | Target | Notes |
|---------|--------|-------|
| `Entities/` | `Shared/Domain/` | All entity files |
| `Auth/ICurrentUserProvider.cs` | `Infrastructure/Auth/ICurrentUserProvider.cs` | |
| `Auth/CurrentUserProvider.cs` | `Infrastructure/Auth/CurrentUserProvider.cs` | |
| `Auth/Roles.cs` | `Infrastructure/Auth/Roles.cs` | |
| `Middleware/CurrentUser.cs` | `Shared/Middleware/CurrentUser.cs` | Record type |
| `Shared/Services/ILeaveBalanceService.cs` | `Shared/Domain/ILeaveBalanceService.cs` | |
| `Shared/Services/LeaveBalanceService.cs` | `Shared/Domain/LeaveBalanceService.cs` | |
| `Shared/LinqExtension.cs` | `Shared/LinqExtension.cs` | (stays) |
| `Features/LeaveRequests/ApprovalHelper.cs` | `Shared/Domain/ApprovalHelper.cs` | Shared domain logic |
| `Features/LeaveRequests/BusinessDayCalculator.cs` | `Shared/Domain/BusinessDayCalculator.cs` | Shared domain logic |
| `Features/LeaveRequests/LeaveRequestDto.cs` | `Features/LeaveRequests/LeaveRequestDto.cs` | (stays, shared DTO) |
| `Features/LeaveRequests/LeaveRequestMapping.cs` | `Features/LeaveRequests/LeaveRequestMapping.cs` | (stays, extension method) |
| `Features/LeaveTypes/LeaveTypeDto.cs` | `Features/LeaveTypes/LeaveTypeDto.cs` | (stays, shared DTO) |
| `Features/LeaveBalances/LeaveBalanceDto.cs` | `Features/LeaveBalances/LeaveBalanceDto.cs` | (stays, shared DTO) |
| `Features/Departments/DepartmentDto.cs` | `Features/Departments/DepartmentDto.cs` | (stays, shared DTO) |

### Namespace Changes

| Old Namespace | New Namespace |
|--------------|--------------|
| `QLNP.Api.Entities` | `QLNP.Api.Shared.Domain` |
| `QLNP.Api.Auth` | `QLNP.Api.Infrastructure.Auth` |
| `QLNP.Api.Middleware` | `QLNP.Api.Shared.Middleware` |
| `QLNP.Api.Shared.Services` | `QLNP.Api.Shared.Domain` |

## Related Code Files

- Create: New directories (`Shared/Domain/`, `Shared/Contracts/`, `Shared/Groups/`, `Shared/Processors/`, `Shared/Middleware/`, `Infrastructure/Auth/`)
- Modify: Every `.cs` file with `using` directives referencing old namespaces
- Delete: Old directories after migration (`Entities/`, `Auth/`, `Middleware/`, `Shared/Services/`)

## Implementation Steps

1. **Create target directories**: `Shared/Domain/`, `Shared/Contracts/`, `Shared/Groups/`, `Shared/Processors/`, `Shared/Middleware/`, `Infrastructure/Auth/`
2. **Move entity files** from `Entities/` to `Shared/Domain/`, update namespaces
3. **Move auth files** from `Auth/` to `Infrastructure/Auth/`, update namespaces
4. **Move middleware** from `Middleware/` to `Shared/Middleware/`, update namespace
5. **Move services** from `Shared/Services/` to `Shared/Domain/`, update namespaces
6. **Move domain helpers** (`ApprovalHelper.cs`, `BusinessDayCalculator.cs`) from `Features/LeaveRequests/` to `Shared/Domain/`, update namespaces
7. **Rename feature files** per the mapping table above (one domain at a time)
8. **Split Models.cs files** — separate request DTOs and validators into individual files
9. **Update all `using` directives** across the project
10. **Update Program.cs** namespace references
11. **Compile and fix** — `dotnet build` after each sub-step to catch missed references
12. **Update `.csproj`** if needed (file names in project items)

## Success Criteria

- [ ] All files renamed to VSA convention (`{Action}{Role}.cs`)
- [ ] Folder structure matches target layout
- [ ] All namespaces updated (`Shared.Domain`, `Infrastructure.Auth`, `Shared.Middleware`)
- [ ] `dotnet build` succeeds with zero errors
- [ ] All endpoints still accessible at their original routes
- [ ] No `Entities/`, `Auth/` (root-level), or `Middleware/` (root-level) directories remain

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Namespace breakage cascade | Rename one domain at a time, compile after each |
| Missed `using` updates | `dotnet build` catches all — fix iteratively |
| `LeaveRequestDto` shared across 7 actions | Keep at `Features/LeaveRequests/` level — not per-action |
| `ApprovalHelper` used by 3 actions | Move to `Shared/Domain/` — proper tier |

## Next Steps

→ Phase 3: Eliminate Data Classes (requires stable naming from this phase)