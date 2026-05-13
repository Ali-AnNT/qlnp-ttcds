# Project Changelog - QLNP-TTCDS

## v0.1.0 -- 2026-05-13 -- Architecture Migration (Supabase -> .NET 9)

### Breaking Changes
- Supabase backend removed entirely -- replaced by .NET 9 + EF Core + SQL Server
- @supabase/supabase-js package removed from frontend dependencies
- `src/integrations/supabase/` directory deleted
- Username/password login form removed -- replaced by SSO gateway auth
- Database: PostgreSQL (Supabase) replaced by SQL Server (existing VI_NGHIPHEP)
- Env vars changed: `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` removed, replaced by `VITE_API_URL`

### Added
- `packages/api/` -- .NET 9 API project with FastEndpoints v8.1.0, EF Core 9.0.0
- Scaffolded system entities: `UserMaster` (9 props from USER_MASTER), `DmDonvi` (22 props from DM_DONVI)
- 5 Code First entities: `UserRole`, `LeaveType`, `LeaveBalance`, `LeaveRequest`, `LeaveConfig`
- `AppDbContext` with `ExcludeFromMigrations()` for system tables, EF relationships, seed data (3 leave_types + 1 user_role)
- `CurrentUserMiddleware` -- reads gateway headers (X-User-Id, X-User-Name, X-User-FullName), dev mode fallback
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
- Deployment: IIS (API) + static hosting (frontend), gateway auth via reverse proxy

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
