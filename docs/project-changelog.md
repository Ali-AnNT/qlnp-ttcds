# Project Changelog - QLNP-TTCDS

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
