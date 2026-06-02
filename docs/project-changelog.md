# Project Changelog - QLNP-TTCDS

## v0.6.0 -- 2026-05-29 -- VSA Phases 4-5: Dashboard + Leave Requests + Config Migration

### Added
- `src/features/dashboard/` feature module (VSA slice) with components, hooks, api, and barrel export
- `src/features/dashboard/components/dashboard-page.tsx` -- DashboardPage moved from `src/pages/DashboardPage.tsx`
- `src/features/dashboard/components/leave-balance-card.tsx` -- LeaveBalanceCard moved from `src/components/LeaveBalanceCard.tsx`
- `src/features/dashboard/hooks/use-dashboard-stats.ts` -- TanStack Query hook combining leave balances, leave types, and approval configs queries
- `src/features/dashboard/hooks/use-recent-requests.ts` -- TanStack Query hook with role-based query key (staff: own requests, managers: all)
- `src/features/dashboard/api/dashboard.api.ts` -- Re-exports API types and modules needed by dashboard hooks
- `src/features/dashboard/index.ts` -- Barrel export: DashboardPage, LeaveBalanceCard, LeaveBalanceInfo, useDashboardStats, useRecentRequests
- `src/features/leave-requests/` feature module (VSA slice) with api, components, hooks, and barrel export
- `src/features/leave-requests/components/leave-new-page.tsx` -- LeaveNewPage moved from `src/pages/LeaveNewPage.tsx`
- `src/features/leave-requests/components/leave-my-page.tsx` -- LeaveMyPage moved from `src/pages/LeaveMyPage.tsx`
- `src/features/leave-requests/hooks/use-leave-requests.ts` -- TanStack Query hooks: useMyLeaveRequests, useSubmitLeaveRequest, useUpdateLeaveRequest, useCancelLeaveRequest
- `src/features/leave-requests/hooks/use-leave-balances.ts` -- TanStack Query hook for current user's leave balances
- `src/features/leave-requests/hooks/use-leave-types.ts` -- TanStack Query hook for all leave types
- `src/features/leave-requests/hooks/use-approval-configs.ts` -- TanStack Query hook for approval configs
- `src/features/leave-requests/api/types.ts` -- LeaveRequestDto, CreateLeaveRequestDto, LeaveBalanceDto types
- `src/features/leave-requests/api/leave-requests.api.ts` -- leaveRequestsApi with CRUD + approve/reject/cancel
- `src/features/leave-requests/api/leave-balances.api.ts` -- leaveBalancesApi.my()
- `src/features/leave-requests/index.ts` -- Barrel export: LeaveNewPage, LeaveMyPage, TanStack Query hooks, types
- `src/features/config/index.ts` -- Barrel export: leaveTypesApi, configApi, LeaveTypeDto, ConfigDto
- `src/features/config/api/leave-types.api.ts` -- LeaveTypeDto + leaveTypesApi CRUD
- `src/features/config/api/config.api.ts` -- ConfigDto + configApi.get/update()

### Changed
- `app/router.tsx`: DashboardPage import changed from `@/pages/DashboardPage` to `@/features/dashboard`; LeaveNewPage/LeaveMyPage imports changed from `@/pages/*` to `@/features/leave-requests`
- Dashboard data fetching: Zustand `useStore` replaced with TanStack Query hooks (`useDashboardStats`, `useRecentRequests`)
- LeaveNewPage/LeaveMyPage data fetching: Zustand `useStore` replaced with TanStack Query hooks
- Dashboard imports: `@/components/ui/*` replaced with `@/shared/ui/*`, `@/lib/*` replaced with `@/shared/lib/*`

### Removed
- `src/pages/DashboardPage.tsx` (moved to features/dashboard/components/)
- `src/pages/LeaveNewPage.tsx` (moved to features/leave-requests/components/)
- `src/pages/LeaveMyPage.tsx` (moved to features/leave-requests/components/)
- `src/components/LeaveBalanceCard.tsx` (moved to features/dashboard/components/)
- `src/components/LeaveHistory.tsx` (unused stub, deleted)
- `src/components/LeaveRequestForm.tsx` (unused, deleted)
- Zustand store references removed from dashboard, leave-requests, and config features

## v0.5.0 -- 2026-05-28 -- SystemConfigs Key-Value Settings

### Added
- `SystemConfig` entity (key-value storage): Id, ConfigKey (unique, max 50), ConfigValue (max 100), Description (nullable, max 200), UpdatedAt
- `SystemConfigs` DbSet in AppDbContext + EF migration `AddSystemConfigsTable` (unique index on ConfigKey)
- 8 seeded SystemConfig rows: max_annual_leave, min_request_days, max_carry_over, leave_cycle, default_days_CB.PCM, default_days_LD.PCM, default_days_GD.PGD, default_days_QTHT
- `GET /api/system-configs` endpoint (authenticated) -- returns all config key-value pairs ordered by ConfigKey
- `PUT /api/system-configs` endpoint (QTHT-only) -- replaces all system configs (full replace strategy)
- `SystemConfigDto` record shared across Get/Update endpoints
- Frontend `system-configs.api.ts` module: `SystemConfigDto` type + `systemConfigsApi.get()/update()`
- ConfigPage General tab wired to SystemConfigs API with 8 editable settings (max_annual_leave, min_request_days, max_carry_over, leave_cycle, 4x default_days per role)

### Changed
- LeaveBalance seeding (`Seed/Data.EnsureBalancesAsync`): NPN TotalDays now resolves from `default_days_{role}` SystemConfig when user role is provided, falling back to LeaveType.DefaultDays
- LeaveBalance `/my` endpoint: `CorrectNpnBalanceAsync` corrects unused NPN balances that differ from role-based SystemConfig default
- ConfigPage: General tab now reads from and writes to SystemConfigs API (was previously local/mock data)
- AppDbContext: `SystemConfigs` table registered with unique index on ConfigKey

## v0.4.0 -- 2026-05-27 -- Configurable N-Level Approval

### Breaking Changes
- Status values `approved_leader` and `approved_director` removed. Status is now one of: `pending | approved | rejected | cancelled`
- `LeaveRequest.ApprovedLevel` (int, default 0) added to track approval progress within pending state
- Frontend `LeaveStatus` type updated accordingly; `getApprovalStatusLabel()` and `getApprovalStatusColor()` replace hardcoded status labels

### Added
- `LeaveRequest.ApprovedLevel` property (default 0) and EF migration `AddApprovedLevel`
- `ApprovalHelper.cs` -- shared static helper for N-level approval logic:
  - `GetApprovalFlow()` -- groups LeaveConfigs by ApprovalLevel
  - `GetMaxLevel()` -- returns highest configured level
  - `CanApproveAtLevel()` -- auth check with scope (LD.PCM = same department, GD.PGD = unrestricted)
  - `GetNextLevelRoles()` -- returns roles for next approval level
- `ConfigPage.tsx` -- approval level dropdown now supports 1-5 levels (was 1 or 2)
- Frontend helpers: `getApprovalStatusLabel()` and `getApprovalStatusColor()` in `leave-data.ts`
- EF Core `HasData` seed for 9 `LeaveConfig` rows in `AppDbContext.OnModelCreating`, establishing the initial approval-level baseline so `MigrateLegacyStatusesAsync` can correctly determine max approval levels per LeaveType. Runtime updates via `Config/Update` endpoint (`ReplaceAllAsync`) still overwrite these rows. Seed baseline:

  | Id | LeaveTypeId (Code) | ApprovalLevel | ApproverRole |
  |----|---------------------|---------------|--------------|
  | 1  | 1 (NPN)             | 1             | LD.PCM       |
  | 2  | 1 (NPN)             | 2             | GD.PGD       |
  | 3  | 2 (NO)              | 1             | LD.PCM       |
  | 4  | 2 (NO)              | 2             | GD.PGD       |
  | 5  | 3 (NVR)             | 1             | LD.PCM       |
  | 6  | 3 (NVR)             | 2             | GD.PGD       |
  | 7  | 4 (NKL)             | 1             | LD.PCM       |
  | 8  | 5 (NTS)             | 1             | LD.PCM       |
  | 9  | 5 (NTS)             | 2             | GD.PGD       |

### Changed
- Approve endpoint: full rewrite for config-driven N-level approval. Increments ApprovedLevel; sets status=approved and deducts balance only on final level
- Reject endpoint: uses ApprovalHelper for auth check at current level
- Cancel endpoint: simplified to allow cancellation of any pending request (ApprovedLevel < maxLevel)
- Create/Update Data: overlap check uses `approved` status only (removed `approved_leader`)
- List/My Data: DTO projection includes ApprovedLevel
- Reports Export Models: removed `approved_leader` and `approved_director` from status labels
- `SeedHelper.MigrateLegacyStatusesAsync` (renamed from `MigrateApprovedDirectorStatusAsync`): migrates `approved_director` -> `approved`, `approved_leader` -> `pending + ApprovedLevel=1`, and sets ApprovedLevel for existing approved requests
- `AppDbContext`: `HasDefaultValue(0)` for ApprovedLevel column
- `LeaveRequestDto` and `LeaveRequestMapping`: include ApprovedLevel field

### Removed
- `approved_leader` and `approved_director` status values (replaced by ApprovedLevel-based progress tracking)
- Hardcoded 2-level approval logic in Approve/Reject/Cancel endpoints

## v0.3.2 -- 2026-05-25 -- Balance Seeding + Audit Entity Docs Sync

### Added
- `LeaveRequestAudit` entity and EF migration for future audit-log write wiring.
- Startup and lazy `LeaveBalance` seeding so active users receive balance rows for active leave types before first approval.
- CSP `frame-ancestors` header configured from `Security:FrameAncestors`.

### Changed
- `UserRoles` table dropped; roles now come from JWT claims/dev-login mapping.
- Earlier changelog references to `UserRole`/`UserRoles` describe historical migrations before this drop.
- Dashboard balance documentation updated to reflect per-type balance cards and lazy-seeded data.
- Roadmap and architecture docs updated with current endpoint status and remaining gaps.

### Remaining
- `UpdateByApprover` endpoint, History endpoint, audit writes from mutation endpoints, embed host sample, and integration tests remain pending.

## v0.3.1 -- 2026-05-21 -- Supabase Cleanup (T-09)

### Removed
- `packages/web/supabase/` directory deleted (migrations archived to `archive/supabase-migrations/`)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` env vars removed from `.env`
- Supabase references removed from `README.md` (tech stack, quick start, project structure)

### Verified
- `grep -r "supabase" packages/web/` = 0 results
- `pnpm install` OK
- `pnpm -F @qlnp/web build` OK (0 errors)

## v0.3.0 -- 2026-05-15 -- LeaveRequests P2 (Approve/Reject/Cancel)

### Added
- **PUT /api/leave-requests/{id}/approve** -- Approve endpoint (Roles: LD.PCM, GD.PGD):
  - LD.PCM: pending → approved_leader, scope check (same PhongBanId, not self)
  - GD.PGD: approved_leader → approved_director, auto-upsert LeaveBalance.UsedDays
  - Dual-role user: isDirector priority (GD.PGD logic wins)
  - UsedDays overflow protection: 422 if would exceed TotalDays
  - Lazy-init LeaveBalance row (TotalDays = LeaveType.DefaultDays) if not exists
- **PUT /api/leave-requests/{id}/reject** -- Reject endpoint (Roles: LD.PCM, GD.PGD):
  - LD.PCM: reject pending → rejected (scope: same PhongBanId, not self)
  - GD.PGD: reject approved_leader → rejected
  - FluentValidation: RejectedReason required (NotEmpty)
- **DELETE /api/leave-requests/{id}** -- Cancel endpoint (Roles: CB.PCM, LD.PCM):
  - Owner-only check (entity.UserId == currentUser.UserId)
  - Status guard: only pending or approved_leader can be cancelled
- `LeaveRequestMapping.cs` -- shared extension method `MapToDto()` for DRY DTO mapping across all LeaveRequest endpoints

### Changed
- Refactored Create/Mapper.cs and Update/Mapper.cs to use shared `LeaveRequestMapping.MapToDto()`
- Approve endpoint: DbUpdateException catch + 409 response for concurrent save conflicts
- Approve endpoint: dual-role auto-select (isDirector checked before isLeader)

## v0.2.0 -- 2026-05-15 -- LeaveRequests P1 Endpoints + JWT Auth

### Changed
- Replaced gateway header auth (CurrentUserMiddleware + X-User-Id/X-User-Name/X-User-FullName) with JWT Bearer authentication
- Deleted `Middleware/CurrentUserMiddleware.cs` -- replaced by `Auth/ICurrentUserProvider.cs` + `Auth/CurrentUserProvider.cs` (reads JWT claims)
- Added `Microsoft.AspNetCore.Authentication.JwtBearer` v10.0.8 package
- `appsettings.json`: replaced `GatewayHeaders` section with `Jwt: { Issuer, Audience, SigningKey }`
- `Program.cs`: `AddAuthentication(JwtBearerDefaults).AddJwtBearer(...)` + `UseAuthentication()` + `UseAuthorization()`
- `CurrentUser` record expanded: added DeviceId, UserIdUBTP, PhongBanIdUBTP, DonViIdUBTP fields
- Target framework changed from .NET 9 to .NET 10 (`net10.0`)

### Added
- **GET /api/leave-requests** -- List endpoint with role-based filtering:
  - CB.PCM: own requests only
  - LD.PCM: department (PhongBanId) scoped
  - GD.PGD / QTHT: all requests, no filter
  - Includes User.HoTen, User.DonVi.TenDonVi, LeaveType.Name via eager loading
- **POST /api/leave-requests** -- Create endpoint (Roles: CB.PCM, LD.PCM):
  - FluentValidation: LeaveTypeId existence, future StartDate, EndDate >= StartDate, Reason required (max 500)
  - Business days validation via `BusinessDayCalculator` (T2-T6 inclusive, returns 422 if 0)
  - Overlap detection against existing approved requests (returns 409)
  - Auto-sets UserId from CurrentUser, TotalDays from calculator
- **PUT /api/leave-requests/{id}** -- Update endpoint (Roles: CB.PCM, LD.PCM):
  - Owner check: entity.UserId must match CurrentUser.UserId (403)
  - Pending-only guard: Status must be "pending" (409)
  - Same business days + overlap validation as Create
  - Excludes self from overlap check
- `LeaveRequest.RequestedApproverId` (nullable long) + `RequestedApprover` nav prop to UserMaster
- `UserMaster.DonVi` nav prop to DmDonvi (configured in AppDbContext with Restrict delete)
- Migration: `AddRequestedApproverIdAndNavProps`
- `BusinessDayCalculator` static utility class (T2-T6 inclusive count)
- Shared `LeaveRequestDto` record used across List/Create/Update responses
- `ICurrentUserProvider` interface + `CurrentUserProvider` (claims-based, multi-role support)
- `CurrentUser` record: UserId, DisplayName, UnitId, PhongBanId, DeviceId, Roles (List<string>), UserIdUBTP, PhongBanIdUBTP, DonViIdUBTP

### Changed
- LeaveTypes CRUD endpoints: Roles changed from "quantri" to "QTHT"
- Seed data: expanded from 1 UserRole (quantri) to 4 UserRoles (QTHT, CB.PCM, LD.PCM, GD.PGD)
- Feature folder structure: each endpoint now has Data.cs (queries), Endpoint.cs, Mapper.cs, Models.cs (Request/Response/Validator)

## v0.1.1 -- 2026-05-14 -- Planning Rebaseline

### Changed
- Rebaselined `plans/260513-0221-dotnet-migration-refactor/plan.md` from the old Dapper/standalone-login approach to the current EF Core + gateway-auth architecture.
- Updated project progress to 78% overall migration with endpoint implementation as the active blocker.
- Adjusted remaining timeline to 2026-05-14 through 2026-05-21 for endpoints, integration, tests, docs, and release validation.
- Synced roadmap with Phase 1.1 endpoint implementation and release-readiness targets.
- Regenerated detailed day files under `plans/260513-0221-dotnet-migration-refactor/` to match the rebaselined 14-day timeline.

### Notes
- No application code changed in this planning update.
- The canonical implementation direction remains `packages/api` + `packages/web`, EF Core 9, FastEndpoints, SQL Server, and gateway/SSO current-user resolution.

## v0.1.0 -- 2026-05-13 -- Architecture Migration (Supabase -> .NET)

### Breaking Changes
- Supabase backend removed entirely -- replaced by .NET 9 + EF Core + SQL Server
- @supabase/supabase-js package removed from frontend dependencies
- `src/integrations/supabase/` directory deleted
- Username/password login form removed -- replaced by SSO gateway auth
- Database: PostgreSQL (Supabase) replaced by SQL Server (existing VI_NGHIPHEP)
- Env vars changed: `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` removed, replaced by `VITE_API_URL`

### Added
- `packages/api/` -- .NET 10 API project with FastEndpoints v8.1.0, EF Core 9.0.0
- Scaffolded system entities: `UserMaster` (9 props from USER_MASTER), `DmDonvi` (22 props from DM_DONVI)
- 5 Code First entities: `UserRole`, `LeaveType`, `LeaveBalance`, `LeaveRequest`, `LeaveConfig`
- `AppDbContext` with `ExcludeFromMigrations()` for system tables, EF relationships, seed data (3 leave_types + 1 user_role)
- `CurrentUserMiddleware` -- reads JWT claims via ICurrentUserProvider (formerly gateway headers), dev mode fallback
- `CurrentUser` record (UserId, UserName, FullName, DonViId, Role)
- Features directory scaffolded: Auth/Me, Config, LeaveBalances, LeaveRequests, LeaveTypes
- Initial EF Core migration (InitialCreate) for QLNP tables
- Frontend API layer: `client.ts` (fetch + JWT wrapper), 6 API modules (auth, departments, leave-types, leave-requests, leave-balances, config)
- React `AuthContext` -- JWT from localStorage, postMessage embed support, dev mode auto-auth
- SSO-only `LoginPage` -- "waiting for auth" screen, no username/password form

### Changed
- Zustand store: auth state removed (moved to AuthContext), data-only operations
- All 11 pages refactored to use new API modules instead of Supabase client
- pnpm monorepo structure: `packages/api` + `packages/web`
- Deployment: IIS (API) + static hosting (frontend), JWT Bearer auth (SSO Portal issues tokens)

### Removed
- Supabase PostgreSQL database (all 7 tables, RLS policies, verify_login RPC)
- `src/integrations/supabase/client.ts` and `types.ts`
- All `supabase.from()`, `supabase.rpc()` calls across codebase
- Plain-text password comparison (resolved: auth delegated to SSO Portal)
- Weak RLS policies (resolved: server-side CurrentUserMiddleware)

---

## v0.0.0 -- 2026-04-16 -- Initial Prototype (Supabase)

### Features
- Login/logout with username/password (Supabase RPC verify_login)
- Role-based sidebar (CB.PCM, LD.PCM, GD.PGD, QTHT)
- 11 pages: Dashboard, LeaveNew, LeaveMy, Approval, Calendar, Summary, Reports, Violations, Config, Login, NotFound
- Two-level approval workflow configurable per leave type
- Business days calculation, overlap detection, CSV export
- shadcn/ui + Tailwind + React SPA
