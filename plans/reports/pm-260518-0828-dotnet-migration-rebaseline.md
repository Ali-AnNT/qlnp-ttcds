# PM Report — .NET 9 FastEndpoints + EF Core Migration Rebaseline

**Plan:** 260513-0221-dotnet-migration-refactor
**Date:** 2026-05-18
**Branch:** toanhv/add-apis-for-qlnp
**Overall Progress:** 80%

## Plan Status

| Day | Title | Status | Blockers |
|-----|-------|--------|----------|
| 1-4 | Scaffold + EF Core + Middleware + VSA | Done | — |
| 5-8 | Frontend API + Auth/Store/Page Refactor | Done (verify pending) | — |
| 9-10 | Backend Endpoints P1/P2 | Done | — |
| 11 | Integration Wiring & Bug Fixes | In Progress | Needs runtime env for smoke test |
| 12 | Tests | Planned | Needs test DB or fixture strategy |
| 13 | Documentation & Deployment | Planned | — |
| 14 | Release Readiness | Planned | Depends on Day 11-13 |

## Acceptance Criteria

| Criterion | Status |
|-----------|--------|
| All P0 endpoints compile and exist | Done |
| `dotnet build packages/api/QLNP.Api.csproj` passes | Done |
| `pnpm --dir packages/web build` passes | Done |
| `pnpm --dir packages/web test` passes | **Pending** |
| Manual smoke flow passes | **Pending** |
| README/roadmap/changelog/architecture/deployment docs match actual stack | **Pending** |

## Actual Codebase State (Verified)

### Backend
- **Files:** 57 `.cs` files under `packages/api/Features/`, ~1,594 total lines
- **Endpoints implemented:** Auth/Me, Config (Get/Update/UserRole), Departments (List/Get), LeaveBalances (List/My), LeaveRequests (List/My/Create/Update/Approve/Reject/Cancel), LeaveTypes (List/Create/Update/Delete)
- **Build:** `dotnet build` passes — 0 errors, 0 warnings
- **Tests:** No API test project exists yet

### Frontend
- **Pages:** 12 `.tsx` pages implemented (AppLayout, Approval, Calendar, Config, Dashboard, Index, LeaveMy, LeaveNew, Login, NotFound, Reports, Summary, Violations)
- **API modules:** 7 modules (auth, client, config, departments, leave-balances, leave-requests, leave-types)
- **Store:** Zustand store uses real API modules; no Supabase/mock references found in `src/api/`, `src/store/`, `src/pages/`
- **Integrations dir:** `packages/web/src/integrations/` does **not** exist (Supabase removed)
- **Build:** `pnpm build` passes — 0 errors
- **Tests:** Only 1 example Vitest test; no real frontend API/store tests yet

### Documentation
- **README:** Still references Supabase as backend (stale); quick start instructs Supabase env setup
- **Docs (`docs/`):** Status unknown; likely stale

## Hydrated Tasks

| Task ID | Subject | Phase | Status |
|---------|---------|-------|--------|
| 2 | Runtime verify API + frontend dev server | Day 11 | Pending |
| 3 | Reports/violations data integration | Day 11 | Pending |
| 5 | Add API test project | Day 12 | Pending |
| 4 | Update Vitest API/store tests | Day 12 | Pending |
| 1 | Update README and deployment docs | Day 13 | Pending |
| 6 | Sync architecture docs and roadmap/changelog | Day 13 | Pending |
| 7 | Run final smoke test and release readiness | Day 14 | Pending |

## Blockers

| Blocker | Impact | Resolution |
|---------|--------|------------|
| Days 05-08 verification items (10 unchecked) | Need runtime test | Address during Day 11-12 |
| Runtime integration test DB unavailable | Cannot run full smoke test | Use dev DB or mock fixture strategy |

## Unresolved Questions

- Is a dev database available now for Day 11 runtime verification?
- Should API tests use WebApplicationFactory with an in-memory/test SQL Server, or integration against dev DB?

