---
title: .NET 9 FastEndpoints + EF Core Migration Rebaseline
status: superseded
priority: P0
effort: large
branch: rebuid-bundle
tags: [dotnet, fastendpoints, vertical-slice, sqlserver, efcore, gateway-auth]
created: 2026-05-13
updated: 2026-05-18
progress: 80
source:
  - docs/vision/brd.md
  - docs/vision/srs.md
  - docs/project-roadmap.md
  - plans/reports/scout-260514-0352-brd-and-srs.md
  - plans/260513-0554-efcore-scaffold-migration/plan.md
---

# .NET 9 FastEndpoints + EF Core Migration Rebaseline

## Overview

Rebaseline old Dapper/standalone-login plan to current architecture: .NET 9, FastEndpoints, EF Core 9, SQL Server, gateway auth, React frontend. Backend endpoints implemented and frontend-backend DTO alignment complete. Remaining work: runtime verification, tests, docs.

**Timeline:** 2026-05-13 to 2026-05-21. **Progress:** 80% overall.

## Current State

| Area | Status |
|------|--------|
| API scaffold, EF Core, entities, migration | Done |
| `USER_MASTER`, `DM_DONVI` system table scaffold | Done |
| CurrentUser middleware + VSA folders | Done, tests deferred to Day 12 |
| Frontend API/Auth/store/pages | Code done, DTO alignment done |
| Backend endpoints (Days 9-10) | **100% — all endpoints implemented** |
| Tests + docs + deployment validation | Planned |

## Blockers

| Blocker | Impact | Resolution |
|---------|--------|------------|
| Days 05-08 verification items | 10 unchecked items, need runtime test | Verify during Day 11-12 smoke test |
| Runtime integration test DB unavailable | Cannot run full smoke test | Use dev DB or mock fixture strategy |

## Corrected Decisions

- Use EF Core `AppDbContext`, not Dapper.
- Use gateway/SSO current-user headers, not standalone password login.
- Do not create employee/department CRUD. Reference `USER_MASTER` and `DM_DONVI`.
- Keep endpoint logic in VSA folders under `packages/api/Features`.
- Keep frontend calls in `packages/web/src/api/*.api.ts`.

## Day Plan

| Day | Date | Workstream | Status | Detail |
|-----|------|------------|--------|--------|
| 1 | 2026-05-13 | API scaffold + EF Core setup | Done | [day-01](./day-01-api-scaffold-ef-core-setup.md) |
| 2 | 2026-05-13 | Scaffold system entities | Done | [day-02](./day-02-scaffold-system-tables.md) |
| 3 | 2026-05-13 | QLNP entities + migration | Done | [day-03](./day-03-qlnp-entities-and-migration.md) |
| 4 | 2026-05-13 | Middleware + VSA folders | Done | [day-04](./day-04-middleware-and-vsa-folders.md) |
| 5 | 2026-05-13 | Frontend API layer | Done (DTO align pending) | [day-05](./day-05-frontend-api-layer.md) |
| 6 | 2026-05-13 | Auth/store refactor | Done (verify pending) | [day-06](./day-06-auth-store-refactor.md) |
| 7 | 2026-05-13 | Page refactor P1 | Done (verify pending) | [day-07](./day-07-page-refactor-p1.md) |
| 8 | 2026-05-13 | Page refactor P2 | Done (verify pending) | [day-08](./day-08-page-refactor-p2.md) |
| 9 | 2026-05-14 | Backend endpoints P1 | **Done** | [day-09](./day-09-backend-endpoints-p1.md) |
| 10 | 2026-05-15 | Backend endpoints P2 | **Done** | [day-10](./day-10-backend-endpoints-p2.md) |
| 11 | 2026-05-18 | Integration wiring + fixes | **In Progress (DTO align done, wiring complete)** | [day-11](./day-11-integration-wiring-bug-fixes.md) |
| 12 | 2026-05-19 | Tests | Planned | [day-12](./day-12-tests.md) |
| 13 | 2026-05-20 | Docs + deployment | Planned | [day-13](./day-13-documentation-deployment.md) |
| 14 | 2026-05-21 | Release readiness | Planned | [day-14](./day-14-release-readiness.md) |

## Completed Work

- Auth/Me endpoint: implemented with current-user provider, DTO aligned to frontend.
- LeaveTypes CRUD (List/Create/Update/Delete): all endpoints implemented, return raw DTOs.
- LeaveRequests (List/Create/Update/Approve/Reject/Cancel/My): all endpoints implemented, HTTP methods aligned (PUT→POST, DELETE→POST), return raw DTOs.
- Config (GET/PUT /api/config): newly created.
- Config UserRole (GET /api/config/user-role/{userId}): newly created.
- LeaveBalances (List/My): newly created.
- Departments (List/Get): newly created.
- All Data classes registered in Program.cs DI.
- Frontend-backend DTO alignment: Auth/Me DTO aligned, LeaveRequestDto includes donViId + updatedAt, all list endpoints return raw arrays, HTTP methods matched.
- Both API and frontend build with 0 errors.

## Critical Missing Work

- Run full smoke test: auth, leave create, approve/reject/cancel, reports, config.
- Remove stale Supabase/mock fallback imports from frontend if any remain.
- Add API integration tests (Day 12).
- Update Vitest tests (Day 12).
- Update README/deployment docs and roadmap/changelog (Day 13).
- Final validation (Day 14).

## Acceptance Criteria

- [x] All P0 endpoints compile and exist under `packages/api/Features/`.
- [x] `dotnet build packages/api/QLNP.Api.csproj` passes (verified: 0 errors).
- [x] `pnpm --dir packages/web build` passes (verified: 0 errors).
- [ ] `pnpm --dir packages/web test` passes.
- [ ] Manual smoke flow passes: auth, leave create, approve/reject/cancel, reports, config.
- [ ] README, roadmap, changelog, architecture, and deployment docs match actual stack.
