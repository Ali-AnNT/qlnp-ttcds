---
title: .NET 9 FastEndpoints + EF Core Migration Rebaseline
status: in_progress
priority: P0
effort: large
branch: rebuid-bundle
tags: [dotnet, fastendpoints, vertical-slice, sqlserver, efcore, gateway-auth]
created: 2026-05-13
updated: 2026-05-14
progress: 45
source:
  - docs/vision/brd.md
  - docs/vision/srs.md
  - docs/project-roadmap.md
  - plans/reports/scout-260514-0352-brd-and-srs.md
  - plans/260513-0554-efcore-scaffold-migration/plan.md
---

# .NET 9 FastEndpoints + EF Core Migration Rebaseline

## Overview

Rebaseline old Dapper/standalone-login plan to current architecture: .NET 9, FastEndpoints, EF Core 9, SQL Server, gateway auth, React frontend. Foundation and frontend migration mostly done. Active blocker: backend endpoint `.cs` files.

**Timeline:** 2026-05-13 to 2026-05-21. **Progress:** 45% overall; endpoints 0%.

## Current State

| Area | Status |
|------|--------|
| API scaffold, EF Core, entities, migration | Done |
| `USER_MASTER`, `DM_DONVI` system table scaffold | Done |
| CurrentUser middleware + VSA folders | Done, tests deferred to Day 12 |
| Frontend API/Auth/store/pages | Code done, DTO alignment + verification blocked by backend |
| Backend endpoints | **0% — no .cs files exist** |
| Tests + docs + deployment validation | Planned |

## Blockers

| Blocker | Impact | Resolution |
|---------|--------|------------|
| .NET 9 SDK not installed (only 8.0.126) | Cannot build/run backend | Install `dotnet-sdk-9.0` |
| No endpoint files under `Features/` | Days 09-14 cannot proceed | Implement Day 09 endpoints first |
| Days 05-08 verification items | 10 unchecked items blocked by real API | Resolve after Days 09-10 |

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
| 9 | 2026-05-14 | Backend endpoints P1 | **0% — not started** | [day-09](./day-09-backend-endpoints-p1.md) |
| 10 | 2026-05-15 | Backend endpoints P2 | Planned | [day-10](./day-10-backend-endpoints-p2.md) |
| 11 | 2026-05-18 | Integration wiring + fixes | Planned | [day-11](./day-11-integration-wiring-bug-fixes.md) |
| 12 | 2026-05-19 | Tests | Planned | [day-12](./day-12-tests.md) |
| 13 | 2026-05-20 | Docs + deployment | Planned | [day-13](./day-13-documentation-deployment.md) |
| 14 | 2026-05-21 | Release readiness | Planned | [day-14](./day-14-release-readiness.md) |

## Critical Missing Work

- Implement Auth/Me, LeaveTypes, Config/UserRole endpoints.
- Implement LeaveRequests, LeaveBalances, and department reference endpoint if needed.
- Align frontend DTOs with real endpoint responses.
- Add API integration tests and update Vitest tests.
- Update README/deployment docs and final validation.

## Acceptance Criteria

- [ ] All P0 endpoints compile.
- [ ] `dotnet build packages/api/QLNP.Api.csproj` passes.
- [ ] `pnpm --dir packages/web build` passes.
- [ ] `pnpm --dir packages/web test` passes.
- [ ] Manual smoke flow passes: auth, leave create, approve/reject/cancel, reports, config.
- [ ] README, roadmap, changelog, architecture, and deployment docs match actual stack.
