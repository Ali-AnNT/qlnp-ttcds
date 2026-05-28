# Codebase Summary - QLNP-TTCDS

## Architecture Overview

**pnpm monorepo**: `packages/api` (.NET 10 backend) + `packages/web` (React SPA frontend).

### Frontend (packages/web)
React SPA with fetch-based API client, Zustand data store, AuthContext (JWT Bearer auth). UI built with shadcn/ui components on Tailwind CSS.

### Backend (packages/api)
.NET 10 + FastEndpoints v8.1.0 + EF Core 9.0.0 + SQL Server. Vertical slice architecture (VSA) with `{Action}{Role}.cs` file naming. JWT Bearer authentication; ICurrentUserProvider reads claims from JWT to resolve CurrentUser. Property injection (`= null!;`) pattern for endpoints; no Data.cs classes.

**Data flow**: React Component -> Zustand Store -> api/client.ts (fetch + JWT Bearer) -> FastEndpoints Endpoint -> AppDbContext (EF Core) -> SQL Server

```
User Action -> Component -> useStore action -> api module -> fetch("/api/...")
                                |                              |
                                v                              v
                          set() -> re-render            AppDbContext -> SQL
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
| `src/main.tsx` | ReactDOM.createRoot, renders App, imports index.css |
| `src/App.tsx` | Root component. QueryClientProvider + TooltipProvider + Toaster + BrowserRouter. AuthGuard wraps AppLayout (redirects to /login if not authenticated). Defines all routes |
| `src/index.css` | Tailwind directives, CSS custom properties for shadcn theme (HSL values: blue primary #1e3a5f, blue accent #2563eb), Be Vietnam Pro Google Font import, custom scrollbar styles |

### Auth (Context)

| File | Purpose |
|------|---------|
| `src/contexts/AuthContext.tsx` | React Context for auth state (user, loading, isEmbed). Calls GET /api/auth/me on mount. Listens for postMessage in iframe mode. JWT stored in localStorage |

### Store (State Management)

| File | Purpose |
|------|---------|
| `src/store/useStore.ts` | Zustand store (data only, no auth). State: departments, leaveTypes, leaveRequests, approvalConfigs. Actions: loadData (parallel API calls), addLeaveRequest, updateLeaveRequest. Getters: getDepartment, getLeaveType |

### API Layer

| File | Purpose |
|------|---------|
| `src/api/client.ts` | Fetch wrapper: JWT from localStorage, Bearer auth header, ApiResponse<T> envelope, error handling |
| `src/api/auth.api.ts` | AuthUser type + authApi.me() |
| `src/api/departments.api.ts` | DepartmentDto + departmentsApi.list() |
| `src/api/leave-types.api.ts` | LeaveTypeDto + leaveTypesApi.list/create/update/delete() |
| `src/api/leave-requests.api.ts` | LeaveRequestDto (incl. approvedLevel), CreateLeaveRequestDto + leaveRequestsApi.list/create/update/approve/reject/cancel() |
| `src/api/leave-balances.api.ts` | LeaveBalanceDto + leaveBalancesApi.list/my() |
| `src/api/config.api.ts` | ConfigDto + configApi.get/update() |
| `src/api/system-configs.api.ts` | SystemConfigDto + systemConfigsApi.get/update() |

### Library / Shared Code

| File | Purpose |
|------|---------|
| `src/lib/leave-data.ts` | Core types: UserRole (union), LeaveStatus (union: pending/approved/rejected/cancelled), Department, Employee, LeaveType, LeaveRequest, LeaveBalance, ApprovalConfig. Label maps: roleLabels, leaveStatusLabels. Helpers: getApprovalStatusLabel(), getApprovalStatusColor() for N-level progress display |
| `src/lib/utils.ts` | cn() utility: merges Tailwind classes via clsx + tailwind-merge |
| `src/lib/date-utils.ts` | formatDate(): parses ISO/date strings, formats to dd-MM-yyyy via date-fns |

### Layout Components

| File | Purpose |
|------|---------|
| `src/pages/AppLayout.tsx` | Main layout: sidebar (collapsible, mobile responsive with overlay) + header + Outlet. Uses useIsMobile hook |
| `src/components/AppSidebar.tsx` | Role-based navigation. MenuItems filtered by user role. Expandable groups (Don xin nghi phep: Tao don + Danh sach don). Active state via NavLink isActive. Logout button |
| `src/components/AppHeader.tsx` | Top bar: sidebar toggle button, breadcrumb (via location pathname), notification bell icon, user avatar + dropdown |
| `src/components/NavLink.tsx` | Navigation link wrapper component |

### Pages

| File | Route | Purpose |
|------|-------|---------|
| `LoginPage.tsx` | /login | SSO waiting screen plus dev-only user selector when `VITE_DEV_MODE=true`. Calls `/api/auth/dev/login` and stores JWT |
| `DashboardPage.tsx` | / | Welcome banner + metric cards + per-type leave balance cards + quick actions + recent activity |
| `LeaveNewPage.tsx` | /leave/new | Form: leave type select, date range picker (business days calculation), reason textarea, approver display. Overlap detection against approved requests only (status="approved"). Submit creates via store.addLeaveRequest |
| `LeaveMyPage.tsx` | /leave/my | Table of user's requests with status filter dropdown. Edit dialog (pre-submit), cancel action |
| `ApprovalPage.tsx` | /approval | Pending requests table. Config-driven N-level approval filtering. Approve/reject actions with detail view dialog. Shows approval level progress (e.g., "TP da duyet (cap 1/2)") |
| `CalendarPage.tsx` | /calendar | Month grid with leave indicators + list view toggle. Department filter. date-fns month navigation |
| `SummaryPage.tsx` | /summary | Year/type filter. Per-department table (clickable -> employee detail sub-table). Pie chart by leave type |
| `ReportsPage.tsx` | /reports | 3 KPI cards, bar chart by department, pie chart by type. UI still exports local CSV; backend `/api/reports/export` supports formatted `.xlsx` |
| `ViolationsPage.tsx` | /violations | Employees exceeding 12-day limit. Per-employee + per-department tables. Pie + bar charts. Period filter (year/quarter/month) |
| `ConfigPage.tsx` | /config | 3 tabs: General config (8 system-configurable settings via SystemConfigs API), Leave Types CRUD, Approval Config CRUD (leave_type + level 1-5 + approver_role) |
| `NotFound.tsx` | * | 404 page |

### Hooks

| File | Purpose |
|------|---------|
| `use-mobile.tsx` | Detects viewport < 768px via matchMedia listener |
| `use-toast.ts` | shadcn/ui toast hook (auto-generated) |

### shadcn/ui Components (src/components/ui/)

48 generated component files: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip.

## Key Patterns

### Auth Flow
1. If embed mode (iframe): listens for `postMessage({ type: "auth", token })` from host SSO Portal
2. If standalone + dev mode: JWT Bearer allows anonymous access to /api/auth/me with dev-mode fallback (userId=1, roles=["QTHT"])
3. Production: JWT Bearer token issued by SSO Portal, attached as Authorization header
4. `AuthProvider` calls `GET /api/auth/me` (with JWT Bearer) on mount to resolve user profile
5. `AuthGuard` in App.tsx checks `user` from AuthContext; redirects to /login if null
6. LoginPage shows "waiting for SSO" (embed mode) or loading spinner (no username/password form)

### Role-Based UI
Authorization via `CurrentUser.Role` from AuthContext:
- `AppSidebar.tsx`: filters menuItems by visible roles
- `App.tsx`: routes are always mounted (no route-level guard), sidebar hides unauthorized links
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
- `loadData()` fetches all reference data in parallel (Promise.all) via API modules
- Individual pages call loadData() on mount (useEffect) to refresh
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
