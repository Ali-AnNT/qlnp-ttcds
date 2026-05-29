# Codebase Summary - QLNP-TTCDS

## Architecture Overview

**pnpm monorepo**: `packages/api` (.NET 10 backend) + `packages/web` (React SPA frontend).

### Frontend (packages/web)
React SPA following **Vertical Slice Architecture (VSA)**. 100% server state management via **TanStack Query**. No global data store (Zustand removed). Styling with shadcn/ui on Tailwind CSS.

### Backend (packages/api)
.NET 10 + FastEndpoints v8.1.0 + EF Core 9.0.0 + SQL Server. Vertical slice architecture (VSA) with `{Action}{Role}.cs` file naming. JWT Bearer authentication; ICurrentUserProvider reads claims from JWT to resolve CurrentUser. Property injection (`= null!;`) pattern for endpoints; no Data.cs classes.

**Data flow**: React Component -> TanStack Query hooks -> shared/api/client.ts (fetch + JWT Bearer) -> FastEndpoints Endpoint -> AppDbContext (EF Core) -> SQL Server

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
| `package.json` | Dependencies: React 18, shadcn/ui Radix primitives, TanStack Query 5, Recharts, react-hook-form, zod, date-fns. Dev deps: Vite 5, TypeScript 5, Tailwind 3, Vitest 3, ESLint 9 + boundaries plugin |
| `vite.config.ts` | Dev server port 8080, @ path alias to ./src, SWC React plugin |
| `eslint.config.js` | ESLint 9 flat config with VSA boundary enforcement (no deep imports, no private access) |
| `tailwind.config.ts` | Custom theme: Be Vietnam Pro font, HSL color variables, shadcn sidebar tokens |

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
| `src/shared/api/client.ts` | Fetch wrapper: JWT from localStorage, Bearer auth header, ApiResponse<T> envelope |
| `src/shared/lib/utils.ts` | cn() utility for Tailwind class merging |
| `src/shared/lib/date-utils.ts` | formatDate(): DD-MM-YYYY via date-fns |
| `src/shared/hooks/use-mobile.tsx` | Viewport detection hook |
| `src/shared/ui/` | 49 shadcn/ui components (Button, Card, Table, etc.) |

### Features (`src/features/`) - VSA Core

Each feature folder follows the structure: `api/`, `components/`, `hooks/`, `types/`, and a barrel `index.ts`.

| Feature | Purpose |
|---------|---------|
| `auth` | LoginPage, AuthProvider, useAuth, AuthGuard. JWT-based auth via SSO portal |
| `layout` | AppLayout (Sidebar + Header), role-based navigation, departments API |
| `dashboard` | Dashboard metrics, leave balance cards, recent activity feed |
| `leave-requests` | Leave CRUD (New/My), leave balances, submission/cancellation hooks |
| `approval` | N-level approval management for LD.PCM and GD.PGD |
| `calendar` | Shared calendar view of leave requests |
| `summary` | Departmental leave summary for GD.PGD |
| `reports` | Leave reports with chart visualizations and Excel export |
| `violations` | Monitoring for leave policy violations (exceeding limits) |
| `config` | System settings, leave types CRUD, approval flow configuration |
| `shared-reference-data` | Common types (UserRole, LeaveStatus) and label/color helpers |

## Key Patterns

### VSA Boundaries
- Features are isolated. Cross-feature communication happens via public APIs (feature `index.ts`).
- Deep imports like `@/features/auth/hooks/use-auth` are blocked by ESLint. Use `@/features/auth` instead.
- Shared code lives in `src/shared/` or `src/features/shared-reference-data/`.

### State Management
- **Server State**: 100% TanStack Query. Hooks are colocated with features.
- **UI State**: React Context (Auth) or local `useState`.
- No global data store (Zustand removed in Phase 12).

### N-Level Approval
- Config-driven 1-5 level approval flow per leave type.
- `ApprovedLevel` tracks progress; balance deducted only on final approval.
- Status values: `pending | approved | rejected | cancelled`.

## Database (SQL Server)

- **System Tables**: `USER_MASTER`, `DM_DONVI` (Read-only, scaffolded).
- **App Tables**: `LeaveTypes`, `LeaveBalances`, `LeaveRequests`, `LeaveConfigs`, `SystemConfigs`, `LeaveRequestAudits` (Managed by EF Core migrations).
