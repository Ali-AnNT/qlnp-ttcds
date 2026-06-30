# Codebase Summary - QLNP-TTCDS

## Architecture Overview

**pnpm monorepo**: `packages/api` (.NET 10 backend) + `packages/web` (React SPA frontend). Docker deployment via `docker-compose.yml`.

### Frontend (packages/web)
React SPA following **Vertical Slice Architecture (VSA)**. 100% server state management via **TanStack Query**. No global data store (Zustand fully removed). Styling with shadcn/ui (52 components) on Tailwind CSS.

### Backend (packages/api)
.NET 10 + FastEndpoints v8.1.0 + EF Core 9.0.0 + SQL Server. Vertical slice architecture (VSA) with `{Action}{Role}.cs` file naming. JWT Bearer authentication; ICurrentUserProvider reads claims from JWT to resolve CurrentUser. Property injection (`= null!;`) pattern for endpoints; no Data.cs classes.

**Data flow**: React Component -> TanStack Query hooks -> shared/api/client.ts (fetch + JWT Bearer + 401 auto-retry) -> FastEndpoints Endpoint -> AppDbContext (EF Core) -> SQL Server

```
VSA Data Flow:
User Action -> Component -> useXxxQuery/useXxxMutation hook -> api module -> fetch("/api/...")
                                |                              |
                                v                              v
                          cache update -> re-render    AppDbContext -> SQL
```

## File-by-File Summary

### Root Config Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies: React 18, shadcn/ui Radix primitives, TanStack Query 5, Recharts 3, react-hook-form 7, Zod 4, date-fns 4, react-day-picker 8. Dev deps: Vite 5, TypeScript 5, Tailwind 3, Vitest 3, ESLint 9 + boundaries plugin |
| `vite.config.ts` | Dev server port 8080, @ path alias to ./src, SWC React plugin |
| `eslint.config.js` | ESLint 9 flat config with VSA boundary enforcement (no deep imports, no private access) |
| `tailwind.config.ts` | Custom theme: Be Vietnam Pro font, HSL color variables, shadcn sidebar tokens |
| `docker-compose.yml` | Docker Compose: api (port 8003), web (port 8001), env_file .env |
| `makefile` | Docker build/push targets: api-dev, release, build-prod, push-prod |

### Entry Points

| File | Purpose |
|------|---------|
| `src/main.tsx` | ReactDOM.createRoot, renders `<App />` from `./app/App` |
| `src/app/App.tsx` | Root component. Renders `<Providers>` + `<AppRouter>` |
| `src/app/providers.tsx` | QueryClientProvider + TooltipProvider + Toaster + Sonner + AuthProvider |
| `src/app/router.tsx` | BrowserRouter + Routes. All feature pages imported from `@/features/*` |
| `src/app/NotFound.tsx` | 404 Not Found page |

### Shared Infrastructure (`src/shared/`)

| File | Purpose |
|------|---------|
| `src/shared/api/client.ts` | Fetch wrapper: JWT from localStorage, Bearer auth header, ApiResponse<T> envelope, 401 auto-retry via token refresh |
| `src/shared/lib/utils.ts` | cn() utility for Tailwind class merging |
| `src/shared/lib/date-utils.ts` | formatDate(): DD-MM-YYYY via date-fns, parseWorkDays(): parse SystemConfig work_days string |
| `src/shared/lib/auth-renew.api.ts` | SSO token renewal: POST to external refresh endpoint, returns new accessToken + tokenRenew |
| `src/shared/lib/token-refresh.ts` | 401-reactive token renewal with dedup lock: concurrent callers share one in-flight refresh |
| `src/shared/lib/token-store.ts` | localStorage auth token management: accessToken, accessTokenExp, tokenRenew, MachineId |
| `src/shared/hooks/use-mobile.tsx` | Viewport detection hook |
| `src/shared/ui/` | 52 shadcn/ui components including date-picker, error-boundary, route-error-boundary |

### Features (`src/features/`) - VSA Core

Each feature folder follows the structure: `api/`, `components/`, `hooks/`, `types/`, and a barrel `index.ts`.

| Feature | Purpose |
|---------|---------|
| `auth` | LoginPage, AuthProvider, useAuth, AuthGuard. JWT-based auth via SSO portal, 401-reactive token renewal |
| `layout` | AppLayout (Sidebar + Header), role-based navigation, departments API |
| `dashboard` | Dashboard metrics, leave balance cards, MyStats integration (useDashboardStats, useRecentRequests) |
| `leave-requests` | Leave CRUD (New/My), leave balances, submission/cancellation hooks, date picker component |
| `approval` | N-level approval management for LD.PCM and GD.PGD |
| `calendar` | Shared calendar view of leave requests |
| `summary` | Departmental leave summary for GD.PGD |
| `reports` | Leave reports with chart visualizations (Recharts) |
| `violations` | Monitoring for leave policy violations (exceeding limits). Client-side aggregation, dept/emp drill-down, Director-only |
| `config` | System settings, leave types CRUD, approval flow configuration, configurable work days, default days per role |
| `shared-reference-data` | Common types (UserRole, LeaveStatus) and label/color helpers |
| `my-stats` | (Backend only) MyStatsEndpoint: GET /api/my-stats/ returns RemainingDays, PendingCount, ApprovedCount, UsedDays |

## Key Patterns

### VSA Boundaries
- Features are isolated. Cross-feature communication happens via public APIs (feature `index.ts`).
- Deep imports like `@/features/auth/hooks/use-auth` are blocked by ESLint. Use `@/features/auth` instead.
- Shared code lives in `src/shared/` or `src/features/shared-reference-data/`.

### State Management
- **Server State**: 100% TanStack Query. Hooks are colocated with features.
- **UI State**: React Context (Auth) or local `useState`.
- **Auth Tokens**: localStorage via `token-store.ts`, 401-reactive renewal via `token-refresh.ts` + `auth-renew.api.ts`.

### N-Level Approval
- Config-driven 1-5 level approval flow per leave type.
- `ApprovedLevel` tracks progress; balance deducted only on final approval.
- Status values: `pending | approved | rejected | cancelled`.

### Configurable Work Days
- `SystemConfig` with key `work_days` stores comma-separated DayOfWeek values (default: `1,2,3,4,5` = Mon-Fri).
- `BusinessDayCalculator.ParseWorkDays()` parses config string into `HashSet<DayOfWeek>`.
- Frontend `parseWorkDays()` in `date-utils.ts` mirrors this for client-side validation.

## Database (SQL Server)

- **System Tables**: `USER_MASTER`, `DM_DONVI` (Read-only, scaffolded).
- **App Tables**: `LeaveTypes`, `LeaveBalances`, `LeaveRequests`, `LeaveConfigs`, `SystemConfigs`, `LeaveRequestAudits`, `UserRoles` (Managed by EF Core migrations).
- **Seed Data**: 5 LeaveTypes (NPN, NO, NVR, NKL, NTS), 9 LeaveConfigs (approval levels), 9 SystemConfigs (including `work_days`).

## Docker Deployment

```
docker-compose.yml:
  api:  port 8003 -> 8080, env_file .env
  web:  port 8001 -> 80,  build arg VITE_API_URL, VITE_DEV_MODE
```

- `packages/api/Dockerfile`: .NET 10 runtime, certificate handling
- `packages/web/Dockerfile`: multi-stage (Node build + Nginx serve)
- `makefile`: api-dev, release, build-prod, push-prod targets