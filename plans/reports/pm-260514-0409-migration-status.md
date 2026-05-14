# Migration Status Report — 2026-05-14

## Plan: .NET 9 FastEndpoints + EF Core Migration Rebaseline

**Branch:** `feat/efcore-migration-net9-fastendpoints`
**Priority:** P0 | **Progress:** 78% claimed | **Active Phase:** Day 09

## Build Gate Status

| Gate | Status | Detail |
|------|--------|--------|
| `dotnet build` | **BLOCKED** | .NET 9 SDK not installed; only 8.0.126 available. NETSDK1045 error. |
| `pnpm --dir packages/web build` | Pass | 870KB bundle, 7.8s build |
| `pnpm --dir packages/web test` | Not checked | — |

## Phase Completion

| Day | Title | [x] | [ ] | Status |
|-----|-------|-----|-----|--------|
| 01 | API scaffold + EF Core setup | 4 | 0 | Done |
| 02 | Scaffold system entities | 3 | 0 | Done |
| 03 | QLNP entities + migration | 4 | 0 | Done |
| 04 | Middleware + VSA folders | 3 | 1 | Done (1 unchecked) |
| 05 | Frontend API layer | 2 | 2 | Mostly done |
| 06 | Auth/store refactor | 2 | 2 | Mostly done |
| 07 | Page refactor P1 | 1 | 3 | Mostly done |
| 08 | Page refactor P2 | 1 | 3 | Mostly done |
| 09 | Backend endpoints P1 | 0 | 5 | **In progress — 0%** |
| 10 | Backend endpoints P2 | 0 | 6 | Planned |
| 11 | Integration + bug fixes | 0 | 6 | Planned |
| 12 | Tests | 0 | 6 | Planned |
| 13 | Docs + deployment | 0 | 4 | Planned |
| 14 | Release readiness | 0 | 7 | Planned |

**Total:** 20 checked / 51 unchecked = ~28% actual completion (vs 78% claimed in plan.md)

## Critical Blocker

**.NET 9 SDK missing.** Current SDK is 8.0.126. All Day 09+ backend work requires .NET 9 to compile. Install before any endpoint implementation.

## Day 09 Breakdown (Active)

No `.cs` endpoint files exist under `packages/api/Features/`. All 8 endpoint files from the plan are missing:

| Endpoint | File | Status |
|----------|------|--------|
| Auth/Me | `Features/Auth/Me/MeEndpoint.cs` | Missing |
| LeaveTypes/List | `Features/LeaveTypes/List/ListLeaveTypesEndpoint.cs` | Missing |
| LeaveTypes/Create | `Features/LeaveTypes/Create/CreateLeaveTypeEndpoint.cs` | Missing |
| LeaveTypes/Update | `Features/LeaveTypes/Update/UpdateLeaveTypeEndpoint.cs` | Missing |
| LeaveTypes/Delete | `Features/LeaveTypes/Delete/DeleteLeaveTypeEndpoint.cs` | Missing |
| Config/Get | `Features/Config/Get/GetConfigEndpoint.cs` | Missing |
| Config/Update | `Features/Config/Update/UpdateConfigEndpoint.cs` | Missing |
| Config/UserRole | `Features/Config/UserRole/*Endpoint.cs` | Missing |

## Existing Backend Files

Scaffold done — entities, middleware, DB context, migration, Program.cs all present:
- `Data/AppDbContext.cs`, `AppDbContextFactory.cs`
- `Entities/`: DmDonvi, LeaveBalance, LeaveConfig, LeaveRequest, LeaveType, UserMaster, UserRole
- `Middleware/CurrentUser.cs`, `CurrentUserMiddleware.cs`
- `Program.cs`

## Progress Discrepancy

Plan claims 78% but actual checkbox count shows ~28%. The 78% likely includes untracked scaffold work. Recommend recalibrating plan.md progress to reflect checkbox reality or marking earlier phase items as checked.

## Task Hydration

7 Claude Tasks created from Day 09-14 unchecked items. Dependencies set: Day 10 blocked by all Day 09 tasks; Days 11-14 blocked by Day 10.

## Unresolved Questions

1. **.NET 9 SDK install** — is this environment-specific or a CI issue? Need resolution before any backend code.
2. **Days 05-08 "mostly done"** — 10 unchecked items across frontend phases. Worth verifying if these are truly incomplete or just unchecked checkboxes.
3. **Progress recalibration** — should plan.md `progress: 78` be adjusted to match actual checkbox counts?
