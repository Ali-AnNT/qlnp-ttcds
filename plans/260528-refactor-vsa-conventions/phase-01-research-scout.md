---
phase: 1
title: "Research & Scout"
status: complete
priority: P1
effort: "1h"
dependencies: []
---

# Phase 1: Research & Scout

## Overview

Inventory all files, patterns, and dependencies that the refactoring will touch. Produce a migration map (old path → new path) for every .cs file excluding Migrations/.

## Requirements

- Complete file inventory with current paths
- Migration map: old path → new path for every file
- Identify shared DTOs and their consumers (cross-reference count)
- Identify all `Data` class methods and their callers
- Identify all route patterns in `Configure()` methods
- Identify all constructor injection patterns in endpoints
- Identify namespace changes needed

## Architecture

No architectural changes in this phase — pure read-only analysis.

## Related Code Files

- Read: All `.cs` files under `packages/api/` (excluding `Data/Migrations/`)

## Implementation Steps

1. **Inventory all .cs files** (excluding Migrations) — already completed during analysis
2. **Map old → new paths** for each file:
   - `Features/LeaveRequests/Create/Endpoint.cs` → `Features/LeaveRequests/Create/CreateLeaveRequestEndpoint.cs`
   - `Features/LeaveRequests/Create/Models.cs` → `Features/LeaveRequests/Create/CreateLeaveRequestRequest.cs` + `CreateLeaveRequestValidator.cs`
   - `Features/LeaveRequests/Create/Data.cs` → **DELETE** (logic moves into endpoint)
   - Same pattern for all action folders
   - `Entities/*.cs` → `Shared/Domain/*.cs`
   - `Auth/*.cs` → `Infrastructure/Auth/*.cs`
   - `Middleware/CurrentUser.cs` → `Shared/Middleware/CurrentUser.cs`
   - `Shared/Services/LeaveBalanceService.cs` → `Shared/Domain/LeaveBalanceService.cs`
   - `Features/LeaveRequests/LeaveRequestDto.cs` → `Features/LeaveRequests/LeaveRequestDto.cs` (stays, shared DTO)
   - `Features/LeaveRequests/ApprovalHelper.cs` → `Shared/Domain/ApprovalHelper.cs`
   - `Features/LeaveRequests/BusinessDayCalculator.cs` → `Shared/Domain/BusinessDayCalculator.cs`
3. **Identify Data class methods** that need inlining:
   - Every method in each `Data.cs` → moves into the endpoint handler or a domain service
4. **Identify route patterns** for Group mapping:
   - `/api/leave-requests/*` → `LeaveRequestGroup` with prefix `leave-requests`
   - `/api/leave-types/*` → `LeaveTypeGroup` with prefix `leave-types`
   - `/api/leave-balances/*` → `LeaveBalanceGroup` with prefix `leave-balances`
   - `/api/departments/*` → `DepartmentGroup` with prefix `departments`
   - `/api/system-configs/*` → `SystemConfigGroup` with prefix `system-configs`
5. **Document shared DTO consumers**: LeaveRequestDto used by Create, Update, Approve, Reject, Cancel, My, List (7 actions) — keep as shared
6. **Document namespace changes** needed for every file

## Success Criteria

- [ ] Complete migration map (old path → new path) for all ~80 .cs files
- [ ] Data class method inventory with inlining strategy
- [ ] Route group mapping table
- [ ] Namespace change list

## Risk Assessment

Low risk — read-only analysis. No code changes.

## Next Steps

This phase produces the reference documents that Phases 2-5 will execute against.