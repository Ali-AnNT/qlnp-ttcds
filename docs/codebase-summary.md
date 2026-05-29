# Codebase Summary - QLNP-TTCDS

## Architecture Overview

**pnpm monorepo**: `packages/api` (.NET 10 backend) + `packages/web` (React SPA frontend).

### Frontend (packages/web)
React SPA with fetch-based API client, Zustand data store (partially migrated to TanStack Query), auth in features/auth/ (JWT Bearer auth), layout in features/layout/ (AppLayout, AppSidebar, AppHeader, departmentsApi), dashboard in features/dashboard/ (DashboardPage, LeaveBalanceCard, TanStack Query hooks), leave-requests in features/leave-requests/ (LeaveNewPage, LeaveMyPage, TanStack Query hooks), violations in features/violations/ (ViolationsPage, TanStack Query hooks), config in features/config/ (ConfigPage, leaveTypesApi, configApi, systemConfigsApi, TanStack Query hooks). UI built with shadcn/ui components on Tailwind CSS.

### Backend (packages/api)
.NET 10 + FastEndpoints v8.1.0 + EF Core 9.0.0 + SQL Server. Vertical slice architecture (VSA) with `{Action}{Role}.cs` file naming. JWT Bearer authentication; ICurrentUserProvider reads claims from JWT to resolve CurrentUser. Property injection (`= null!;`) pattern for endpoints; no Data.cs classes.

**Data flow** (dashboard, migrated): React Component -> TanStack Query hooks -> shared/api/client.ts (fetch + JWT Bearer) -> FastEndpoints Endpoint -> AppDbContext (EF Core) -> SQL Server
**Data flow** (legacy pages, Zustand): React Component -> Zustand Store -> shared/api/client.ts -> FastEndpoints Endpoint -> AppDbContext -> SQL Server

```
Legacy (Zustand):
User Action -> Component -> useStore action -> api module -> fetch("/api/...")
                                |                              |
                                v                              v
                          set() -> re-render            AppDbContext -> SQL

Migrated (TanStack Query):
User Action -> Component -> useXxxQuery hook -> api module -> fetch("/api/...")
                                |                              |
                                v                              v
                          cache update -> re-render    AppDbContext -> SQL
```

## File-by-File Summary

### Root Config Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies: React 18, shadcn/ui Radix primitives, Zustand 5, TanStack Query 5, Recharts, react-hook-form, zod, date-fns. Dev deps: Vite 5, TypeScript 5, Tailwind 3, Vitest 3, ESLint 9. Supabase removed |
| `vite.config.ts` | Dev server port 8080, @ path alias to ./src, SWC React plugin, lovable-tagger (dev only). Dependencies deduped for React/Query |
| `components.json` | shadcn/ui config: baseColor slate, cssVariables true, tsx true |
| `tailwind.config.ts` | Custom theme: Be Vietnam Pro font, CSS var colors (HSL), shadcn sidebar tokens, accordion animations |
| `tsconfig.json` | References tsconfig.app.json and tsconfig.node.json |
| `vitest.config.ts` | jsdom environment for DOM testing |

### Entry Points

| File | Purpose |
|------|---------|
| `src/main.tsx` | ReactDOM.createRoot, renders `<App />` from `./app/App`, imports index.css |
| `src/app/App.tsx` | Root component. Renders `<Providers>` + `<AppRouter>` (extracted from former monolithic App.tsx) |
| `src/app/providers.tsx` | QueryClientProvider + TooltipProvider + Toaster + Sonner + AuthProvider |
| `src/app/router.tsx` | BrowserRouter + Routes. AuthGuard and LoginPage imported from `@/features/auth` |
| `src/index.css` | Tailwind directives, CSS custom properties for shadcn theme (HSL values: blue primary #1e3a5f, blue accent #2563eb), Be Vietnam Pro Google Font import, custom scrollbar styles |

### Auth (Feature Module)

| File | Purpose |
|------|---------|
| `src/features/auth/index.ts` | Barrel: exports LoginPage, AuthProvider, useAuth, AuthGuard, authApi, AuthUser type |
| `src/features/auth/contexts/auth-context.tsx` | React Context for auth state (user, loading, isEmbed). Calls GET /api/auth/me on mount. Listens for postMessage in iframe mode. JWT stored in localStorage |
| `src/features/auth/hooks/use-auth.ts` | Hook to access auth state from AuthContext |
| `src/features/auth/hooks/use-auth-guard.tsx` | AuthGuard component (extracted from router.tsx). Redirects to /login if no user |
| `src/features/auth/components/login-page.tsx` | SSO waiting screen + dev-only user selector |
| `src/features/auth/api/auth.api.ts` | AuthUser type + authApi.me() |
| `src/features/auth/api/types.ts` | AuthUser type definition |

### Store (State Management)

| File | Purpose |
|------|---------|
| `src/store/useStore.ts` | Zustand store (data only, no auth). State: departments, leaveTypes, leaveRequests, approvalConfigs. Actions: loadData (parallel API calls), addLeaveRequest, updateLeaveRequest. Getters: getDepartment, getLeaveType |

### API Layer

| File | Purpose |
|------|---------|
| `src/shared/api/client.ts` | Fetch wrapper: JWT from localStorage, Bearer auth header, ApiResponse<T> envelope, error handling. Re-exported via `@/shared` barrel |
| `src/api/leave-requests.api.ts` | Legacy: LeaveRequestDto + leaveRequestsApi. Still consumed by Zustand pages (Approval) |
| `src/api/leave-balances.api.ts` | Legacy: LeaveBalanceDto + leaveBalancesApi. No longer used by Violations (migrated to VSA) |
| `src/api/config.api.ts` | Legacy: ConfigDto + configApi. Still consumed by Zustand pages (Approval, Calendar, Summary, Reports). Config feature migrated to VSA but these exports are kept for legacy pages |
| `src/api/system-configs.api.ts` | Deprecated: Migrated to features/config |
| `src/api/leave-types.api.ts` | Deprecated: Migrated to features/config |

### Shared Infrastructure (`src/shared/`)

| File | Purpose |
|------|---------|
| `src/shared/index.ts` | Barrel file re-exporting: `cn`, `formatDate`, `api`, `useIsMobile` |
| `src/shared/api/client.ts` | Fetch wrapper: JWT from localStorage, Bearer auth header, ApiResponse<T> envelope, error handling |
| `src/shared/lib/utils.ts` | cn() utility: merges Tailwind classes via clsx + tailwind-merge |
| `src/shared/lib/date-utils.ts` | formatDate(): parses ISO/date strings, formats to dd-MM-yyyy via date-fns |
| `src/shared/hooks/use-mobile.tsx` | Detects viewport < 768px via matchMedia listener |
| `src/shared/hooks/use-toast.ts` | shadcn/ui toast hook (auto-generated) |

### Features (`src/features/`)

| File | Purpose |
|------|---------|
| `src/features/auth/index.ts` | Barrel: exports LoginPage, AuthProvider, useAuth, AuthGuard, authApi, AuthUser |
| `src/features/dashboard/index.ts` | Barrel: exports DashboardPage, LeaveBalanceCard, LeaveBalanceInfo, useDashboardStats, useRecentRequests |
| `src/features/dashboard/components/dashboard-page.tsx` | Dashboard page: welcome banner, metric cards, quick actions, recent activity feed. Uses TanStack Query hooks (migrated from Zustand) |
| `src/features/dashboard/components/leave-balance-card.tsx` | Per-type leave balance card with progress bar. Exports LeaveBalanceInfo type |
| `src/features/dashboard/hooks/use-dashboard-stats.ts` | TanStack Query hook: fetches leave balances, leave types, and approval configs. Computes myBalances, maxLevelByType, remainingDays, totalDaysAllowed |
| `src/features/dashboard/hooks/use-recent-requests.ts` | TanStack Query hook: fetches leave requests (staff: own only; managers: all). Computes pendingApproval, approvedCount, totalDaysUsed, recentRequests |
| `src/features/dashboard/api/dashboard.api.ts` | Re-exports API types and modules needed by dashboard hooks (leaveBalancesApi, leaveRequestsApi, leaveTypesApi, configApi) |
| `src/features/layout/index.ts` | Barrel: exports AppLayout, AppSidebar, AppHeader, departmentsApi, DepartmentDto |
| `src/features/layout/components/app-layout.tsx` | Main layout: sidebar (collapsible, mobile responsive with overlay) + header + Outlet. Named export |
| `src/features/layout/components/app-sidebar.tsx` | Role-based navigation. MenuItems filtered by user role. Expandable groups. Active state via NavLink. Logout button |
| `src/features/layout/components/app-header.tsx` | Top bar: sidebar toggle button, breadcrumb (via location pathname), notification bell icon, user avatar + dropdown |
| `src/features/layout/api/departments.api.ts` | DepartmentDto type + departmentsApi.list() |
| `src/features/leave-requests/index.ts` | Barrel: exports LeaveNewPage, LeaveMyPage, TanStack Query hooks (useLeaveRequests, useMyLeaveRequests, useSubmitLeaveRequest, useUpdateLeaveRequest, useCancelLeaveRequest, useLeaveBalances, useLeaveTypes), types |
| `src/features/leave-requests/components/leave-new-page.tsx` | Leave request form: leave type select, date range picker (business days calculation), reason textarea. Uses TanStack Query hooks (no Zustand) |
| `src/features/leave-requests/components/leave-my-page.tsx` | Table of user's requests with status filter, edit dialog, cancel action. Uses TanStack Query hooks (no Zustand) |
| `src/features/leave-requests/hooks/use-leave-requests.ts` | TanStack Query hooks: useMyLeaveRequests, useSubmitLeaveRequest, useUpdateLeaveRequest, useCancelLeaveRequest |
| `src/features/leave-requests/hooks/use-leave-balances.ts` | TanStack Query hook: fetches current user's leave balances |
| `src/features/leave-requests/hooks/use-leave-types.ts` | TanStack Query hook: fetches all leave types |
| `src/features/leave-requests/hooks/use-approval-configs.ts` | TanStack Query hook: fetches approval configs |
| `src/features/leave-requests/api/types.ts` | LeaveRequestDto, CreateLeaveRequestDto, LeaveBalanceDto types |
| `src/features/leave-requests/api/leave-requests.api.ts` | leaveRequestsApi: list, listMy, create, update, approve, reject, cancel |
| `src/features/leave-requests/api/leave-balances.api.ts` | leaveBalancesApi: my() |
| `src/features/violations/index.ts` | Barrel: exports ViolationsPage, useViolations, types |
| `src/features/violations/components/violations-page.tsx` | Violations page: employees exceeding 12-day limit. Uses TanStack Query hooks |
| `src/features/violations/components/violation-metrics.tsx` | Metric cards for violations |
| `src/features/violations/components/violation-emp-table.tsx` | Table of employees with violations |
| `src/features/violations/components/violation-dept-table.tsx` | Table of departments with violations |
| `src/features/violations/components/violation-chart.tsx` | Charts for violation data (pie + bar) |
| `src/features/violations/hooks/use-violations.ts` | TanStack Query hook: fetches violation data |
| `src/features/violations/api/types.ts` | ViolationDto, DepartmentViolationDto types |
| `src/features/config/index.ts` | Barrel: exports ConfigPage, leaveTypesApi, configApi, systemConfigsApi, types, hooks |
| `src/features/config/components/config-page.tsx` | Thin shell for ConfigPage. Hosts 3 tabs: General, Leave Types, Approval Flow |
| `src/features/config/components/general-settings.tsx` | General system settings section (extracted) |
| `src/features/config/components/leave-type-manager.tsx` | Leave type CRUD section (extracted) |
| `src/features/config/components/approval-flow-manager.tsx` | Approval flow configuration section (extracted) |
| `src/features/config/hooks/use-leave-types.ts` | TanStack Query hook for leave types CRUD |
| `src/features/config/hooks/use-system-configs.ts` | TanStack Query hook for system settings |
| `src/features/config/hooks/use-approval-config.ts` | TanStack Query hook for approval levels |
| `src/features/config/api/leave-types.api.ts` | LeaveTypeDto + leaveTypesApi CRUD |
| `src/features/config/api/config.api.ts` | ConfigDto + configApi.get/update() |
| `src/features/config/api/system-configs.api.ts` | SystemConfigDto + systemConfigsApi.get/update() |
| `src/features/shared-reference-data/index.ts` | Barrel re-exporting: AppRoles, roleLabels, leaveStatusLabels, UserRole, LeaveStatus, getApprovalStatusLabel, getApprovalStatusColor |
| `src/features/shared-reference-data/constants/app-roles.ts` | Core types: UserRole (union), AppRoles constant object, LeaveStatus (union). Label maps: roleLabels, leaveStatusLabels |
| `src/features/shared-reference-data/helpers/approval-status.ts` | getApprovalStatusLabel(), getApprovalStatusColor() for N-level progress display |

### Pages

| File | Route | Purpose |
|------|-------|---------|
| `features/dashboard/components/dashboard-page.tsx` | / | Welcome banner + metric cards + per-type leave balance cards + quick actions + recent activity. **Migrated to VSA** -- uses TanStack Query hooks instead of Zustand |
| `features/leave-requests/components/leave-new-page.tsx` | /leave/new | Form: leave type select, date range picker (business days calculation), reason textarea, approver display. Overlap detection against approved requests only (status="approved"). Submit via TanStack Query mutation |
| `features/leave-requests/components/leave-my-page.tsx` | /leave/my | Table of user's requests with status filter dropdown. Edit dialog (pre-submit), cancel action. Uses TanStack Query hooks |
| `ApprovalPage.tsx` | /approval | Pending requests table. Config-driven N-level approval filtering. Approve/reject actions with detail view dialog. Shows approval level progress (e.g., "TP da duyet (cap 1/2)") |
| `CalendarPage.tsx` | /calendar | Month grid with leave indicators + list view toggle. Department filter. date-fns month navigation |
| `SummaryPage.tsx` | /summary | Year/type filter. Per-department table (clickable -> employee detail sub-table). Pie chart by leave type |
| `ReportsPage.tsx` | /reports | 3 KPI cards, bar chart by department, pie chart by type. UI still exports local CSV; backend `/api/reports/export` supports formatted `.xlsx` |
| `features/violations/components/violations-page.tsx` | /violations | Employees exceeding 12-day limit. Per-employee + per-department tables. Pie + bar charts. Period filter (year/quarter/month). **Migrated to VSA** -- uses TanStack Query hooks |
| `ConfigPage.tsx` | /config | 3 tabs: General config (8 system-configurable settings via SystemConfigs API), Leave Types CRUD, Approval Config CRUD (leave_type + level 1-5 + approver_role) |
| `NotFound.tsx` | * | 404 page |

### Hooks

| File | Purpose |
|------|---------|
| `src/shared/hooks/use-mobile.tsx` | Detects viewport < 768px via matchMedia listener |
| `src/shared/hooks/use-toast.ts` | shadcn/ui toast hook (auto-generated) |
| `src/features/dashboard/hooks/use-dashboard-stats.ts` | TanStack Query hook: leave balances + leave types + approval configs for dashboard metrics |
| `src/features/dashboard/hooks/use-recent-requests.ts` | TanStack Query hook: recent leave requests for dashboard activity feed |
| `src/features/leave-requests/hooks/use-leave-requests.ts` | TanStack Query hooks: useMyLeaveRequests, useSubmitLeaveRequest, useUpdateLeaveRequest, useCancelLeaveRequest |
| `src/features/leave-requests/hooks/use-leave-balances.ts` | TanStack Query hook: fetches current user's leave balances |
| `src/features/leave-requests/hooks/use-leave-types.ts` | TanStack Query hook: fetches all leave types |
| `src/features/leave-requests/hooks/use-approval-configs.ts` | TanStack Query hook: fetches approval configs |
| `src/features/violations/hooks/use-violations.ts` | TanStack Query hook: fetches violation data |

### shadcn/ui Components (`src/shared/ui/`)

49 generated component files: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip.

## Key Patterns

### Auth Flow
1. If embed mode (iframe): listens for `postMessage({ type: "auth", token })` from host SSO Portal
2. If standalone + dev mode: JWT Bearer allows anonymous access to /api/auth/me with dev-mode fallback (userId=1, roles=["QTHT"])
3. Production: JWT Bearer token issued by SSO Portal, attached as Authorization header
4. `AuthProvider` calls `GET /api/auth/me` (with JWT Bearer) on mount to resolve user profile
5. `AuthGuard` in `features/auth/hooks/use-auth-guard.tsx` checks `user` from auth context; redirects to /login if null
6. LoginPage shows "waiting for SSO" (embed mode) or loading spinner (no username/password form)

### Role-Based UI
Authorization via `CurrentUser.Role` from `features/auth/`:
- `AppSidebar` (features/layout): filters menuItems by visible roles
- `app/router.tsx`: routes are always mounted (no route-level guard), sidebar hides unauthorized links
- Server-side: Endpoints check `CurrentUser.Role` in handler or PreProcessor

### Data Updates
- `addLeaveRequest`: calls API, prepends to store on success
- `updateLeaveRequest`: calls API, patches local state on success
- Local state always updated after server confirmation

### Date Calculations
- Leave days calculated as `differenceInBusinessDays(start, end) + 1` (date-fns)
- Display format: dd-MM-yyyy (formatDate utility)
- Year/quarter/month filters use date-fns sub-months/start-of-year etc.

### Data Loading
- `loadData()` fetches all reference data in parallel (Promise.all) via API modules (legacy Zustand pattern)
- Individual pages call loadData() on mount (useEffect) to refresh (legacy Zustand pattern)
- **Migrated (dashboard)**: TanStack Query hooks (`useDashboardStats`, `useRecentRequests`) with automatic caching and invalidation
- **Legacy (5 pages remaining)**: Zustand store still consumed by ApprovalPage, CalendarPage, SummaryPage, ReportsPage, ConfigPage
- Data scoping: API endpoint returns role-appropriate data based on CurrentUser

## Database (SQL Server - VI_NGHIPHEP)

### System Tables (read-only, ExcludeFromMigrations)
- `USER_MASTER` - UserMasterId, UserName, HoTen, PhongBanId, DonViId, UserPortalId, CanBoId, LaDonViChinh, Used. Nav prop: DonVi
- `DM_DONVI` - DonViId, MaDonVi, TenDonVi, TenVietTat, DonViCapChaId, Cap, CapDonViId, LoaiDonViId, ... (22 props total)

### QLNP Tables (Code First, managed by EF Core migrations)
- `LeaveTypes` - Id, Name, Code (unique), DefaultDays, Description, IsActive
- `LeaveBalances` - Id, UserId, LeaveTypeId, Year, TotalDays, UsedDays. UNIQUE(UserId, LeaveTypeId, Year)
- `LeaveRequests` - Id, UserId, LeaveTypeId, StartDate, EndDate, TotalDays, Reason, Status, ApprovedLevel (default 0), RequestedApproverId (nullable), ApprovedBy, ApprovedAt, RejectedReason, CreatedAt, UpdatedAt. Nav props: User, LeaveType, Approver, RequestedApprover
- `LeaveConfigs` - Id, LeaveTypeId, ApprovalLevel (CK >= 1), ApproverRole
- `SystemConfigs` - Id, ConfigKey (UK, max 50), ConfigValue (max 100), Description (nullable, max 200), UpdatedAt
- `LeaveRequestAudits` - Id, LeaveRequestId, ChangedBy, ChangedAt, FieldName, OldValue, NewValue

### Seed Data
- 3 LeaveTypes: annual (12d), sick (0d), personal (3d)
- 8 SystemConfigs: max_annual_leave (12), min_request_days (1), max_carry_over (5), leave_cycle (yearly), default_days_CB.PCM (14), default_days_LD.PCM (14), default_days_GD.PGD (16), default_days_QTHT (12)
- LeaveBalances are seeded at startup for active `USER_MASTER` users and lazily on `/leave-balances` reads for active leave types in the current year. NPN TotalDays uses role-based defaults from SystemConfigs when available; correction applied for unused NPN balances that differ from role default
- Roles are resolved from JWT claims. Dev-login maps known usernames to test roles; `UserRoles` table was dropped by migration

## Current API Endpoints

> **Role names**: Auth column shows both AppRoles constant and JWT claim value. Code uses `AppRoles` constants (e.g., `AppRoles.Staff` = `"QLNP.CB.PCM"`), JWT contains `QLNP.*` format claims.

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/auth/me | Authenticated | Returns current user from JWT claims |
| POST | /api/auth/dev/login | Dev only | Issues dev JWT for configured test users |
| GET | /api/leave-types | Authenticated | List all leave types |
| POST | /api/leave-types | QTHT (Admin) | Create leave type (FluentValidation) |
| PUT | /api/leave-types/{id} | QTHT (Admin) | Update leave type |
| DELETE | /api/leave-types/{id} | QTHT (Admin) | Soft delete leave type |
| GET | /api/departments | Authenticated | List departments |
| GET | /api/departments/{id} | Authenticated | Get department by id |
| GET | /api/leave-requests | Authenticated (role-filtered) | List requests: own/dept/all by role |
| GET | /api/leave-requests/my | Authenticated | List current user's requests |
| POST | /api/leave-requests | Staff (CB.PCM), Leader (LD.PCM) | Create request (business days, overlap check) |
| PUT | /api/leave-requests/{id} | Staff (CB.PCM), Leader (LD.PCM) | Update pending request |
| POST | /api/leave-requests/{id}/approve | Leader (LD.PCM), Director (GD.PGD) | Config-driven N-level approval (OR logic per level). Balance deducted only on final approval (ApprovedLevel == maxLevel). Scope: LD.PCM = same department, GD.PGD = no restriction |
| POST | /api/leave-requests/{id}/reject | Leader (LD.PCM), Director (GD.PGD) | Reject request (uses ApprovalHelper for auth check at current level) |
| POST | /api/leave-requests/{id}/cancel | Staff (CB.PCM), Leader (LD.PCM) | Cancel any pending request (ApprovedLevel < maxLevel) |
| GET | /api/leave-balances | Authenticated | List balances, with startup/lazy seed support |
| GET | /api/leave-balances/my | Authenticated | List current user's balances, lazily seeded |
| GET | /api/system-configs/leave-configs | Authenticated | List approval config items |
| PUT | /api/system-configs/leave-configs | QTHT (Admin) | Replace approval config items |
| GET | /api/system-configs | Authenticated | List all system config key-value pairs |
| PUT | /api/system-configs | QTHT (Admin) | Replace all system config key-value pairs |
| GET | /api/reports/export | GD.PGD | Export formatted `.xlsx` report |

## Remaining Backend Gaps

| Area | Status |
|------|--------|
| LeaveRequests/UpdateByApprover | Not yet implemented |
| LeaveRequests/History | Not yet implemented |
| Audit logging wiring | `LeaveRequestAudit` table exists; mutation endpoints do not yet write audit rows |

## N-Level Approval Architecture

### Core Concept
Each `LeaveType` can have N approval levels (1-5), configured via `LeaveConfigs`. Multiple roles can be assigned to the same level (OR logic: any approver at that level can advance the request).

### Key Properties
- `LeaveRequest.ApprovedLevel` (int, default 0): tracks how many levels have been approved
- `ApprovedLevel = 0` means no approvals yet (status = pending)
- `ApprovedLevel = maxLevel` means fully approved (status = approved)
- Intermediate `ApprovedLevel` values (1..maxLevel-1) mean partially approved (status still = pending)
- Status values: `pending | approved | rejected | cancelled` (legacy `approved_leader` / `approved_director` removed)

### ApprovalHelper (Shared Logic)
`Shared/Domain/ApprovalHelper.cs` provides:
- `GetApprovalFlow(List<LeaveConfig>)` -- groups configs by level into sorted dictionary
- `GetMaxLevel(Dictionary<int, List<string>>)` -- returns highest approval level
- `CanApproveAtLevel(CurrentUser, LeaveRequest, flow, targetLevel)` -- auth check with scope (LD.PCM = same department, GD.PGD = no restriction)
- `GetNextLevelRoles(Dictionary<int, List<string>>, currentApprovedLevel)` -- returns roles for next level or null

### Approval Flow
1. Employee creates request (status = pending, ApprovedLevel = 0)
2. Approver at level N checks `CanApproveAtLevel` (role must be in config for that level; LD.PCM scoped to same department)
3. If approved at intermediate level: ApprovedLevel++, status stays pending
4. If approved at maxLevel: ApprovedLevel = maxLevel, status = approved, balance deducted
5. Any pending request (ApprovedLevel < maxLevel) can be cancelled or rejected

### Legacy Migration
`SeedHelper.MigrateLegacyStatusesAsync` runs on startup:
- `approved_director` -> `approved` (with ApprovedLevel set from config)
- `approved_leader` -> `pending` + `ApprovedLevel = 1` (still awaiting next level)
- Existing `approved` requests get ApprovedLevel set from their LeaveType config
