# Codebase Summary - QLNP-TTCDS

## Architecture Overview

**pnpm monorepo**: `packages/api` (.NET 9 backend) + `packages/web` (React SPA frontend).

### Frontend (packages/web)
React SPA with fetch-based API client, Zustand data store, AuthContext (SSO gateway auth). UI built with shadcn/ui components on Tailwind CSS.

### Backend (packages/api)
.NET 9 + FastEndpoints v8.1.0 + EF Core 9.0.0 + SQL Server. Vertical slice architecture. CurrentUserMiddleware reads gateway headers from SSO Portal.

**Data flow**: React Component -> Zustand Store -> api/client.ts (fetch + JWT) -> FastEndpoints Endpoint -> AppDbContext (EF Core) -> SQL Server

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
| `src/api/leave-requests.api.ts` | LeaveRequestDto, CreateLeaveRequestDto + leaveRequestsApi.list/create/update/approve/reject/cancel() |
| `src/api/leave-balances.api.ts` | LeaveBalanceDto + leaveBalancesApi.list/my() |
| `src/api/config.api.ts` | ConfigDto + configApi.get/update() |

### Library / Shared Code

| File | Purpose |
|------|---------|
| `src/lib/leave-data.ts` | Core types: UserRole (union), LeaveStatus (union), Department, Employee, LeaveType, LeaveRequest, LeaveBalance, ApprovalConfig. Label maps: roleLabels, leaveStatusLabels |
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
| `LoginPage.tsx` | /login | Username/password form. Calls store.login(), on success navigates to /. Sonner toast for errors |
| `DashboardPage.tsx` | / | Welcome banner + 4 metric cards (remaining days, pending, approved, total used) + quick action buttons + recent activity list (last 8 requests with status badges) |
| `LeaveNewPage.tsx` | /leave/new | Form: leave type select, date range picker (business days calculation), reason textarea, approver display. Overlap detection against existing approved requests. Submit creates via store.addLeaveRequest |
| `LeaveMyPage.tsx` | /leave/my | Table of user's requests with status filter dropdown. Edit dialog (pre-submit), cancel action |
| `ApprovalPage.tsx` | /approval | Pending requests table. Approve/reject actions with detail view dialog. Status transitions: LD.PCM -> approved_leader, GD.PGD -> approved_director |
| `CalendarPage.tsx` | /calendar | Month grid with leave indicators + list view toggle. Department filter. date-fns month navigation |
| `SummaryPage.tsx` | /summary | Year/type filter. Per-department table (clickable -> employee detail sub-table). Pie chart by leave type |
| `ReportsPage.tsx` | /reports | 3 KPI cards (total requests, total days, employees on leave). Bar chart by department. Pie chart by type. CSV export via data-to-CSV conversion |
| `ViolationsPage.tsx` | /violations | Employees exceeding 12-day limit. Per-employee + per-department tables. Pie + bar charts. Period filter (year/quarter/month) |
| `ConfigPage.tsx` | /config | 3 tabs: General config (cycle year, default days per role), Leave Types CRUD, Approval Config CRUD (leave_type + level + approver_role) |
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
2. If standalone + dev mode: CurrentUserMiddleware fallback to userId=1, roles=["QTHT"]
3. Production: gateway headers (X-User-Id, X-User-Name, X-User-FullName) set by IIS reverse proxy
4. `AuthProvider` calls `GET /api/auth/me` on mount to resolve user profile
5. `AuthGuard` in App.tsx checks `user` from AuthContext; redirects to /login if null
6. LoginPage shows "waiting for SSO" or loading spinner (no username/password form)

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
- `UserRoles` - UserId (PK/FK to USER_MASTER), Role (max 10)
- `LeaveTypes` - Id, Name, Code (unique), DefaultDays, Description, IsActive
- `LeaveBalances` - Id, UserId, LeaveTypeId, Year, TotalDays, UsedDays. UNIQUE(UserId, LeaveTypeId, Year)
- `LeaveRequests` - Id, UserId, LeaveTypeId, StartDate, EndDate, TotalDays, Reason, Status, RequestedApproverId (nullable), ApprovedBy, ApprovedAt, RejectedReason, CreatedAt, UpdatedAt. Nav props: User, LeaveType, Approver, RequestedApprover
- `USER_MASTER` - UserMasterId, UserName, HoTen, PhongBanId, DonViId, UserPortalId, CanBoId, LaDonViChinh, Used. Nav prop: DonVi
- `LeaveConfigs` - Id, LeaveTypeId, ApprovalLevel (CK >= 1), ApproverRole

### Seed Data
- 3 LeaveTypes: annual (12d), sick (0d), personal (3d)
- 4 UserRoles: userId=1 QTHT, userId=2 CB.PCM, userId=3 LD.PCM, userId=4 GD.PGD
