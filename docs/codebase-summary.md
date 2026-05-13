# Codebase Summary - QLNP-TTCDS

## Architecture Overview

Single-page React application with Supabase backend (PostgreSQL + RPC). Client state managed by Zustand, server state cached by TanStack React Query. UI built with shadcn/ui components on Tailwind CSS.

**Data flow**: React Component -> Zustand Store (useStore) -> Supabase JS Client -> PostgreSQL (via REST API / RPC)

```
User Action -> Component -> useStore action -> supabase.from("table").insert/select/update
                                |
                                v
                          set() -> re-render all subscribers
```

## File-by-File Summary

### Root Config Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies: React 18, shadcn/ui Radix primitives, Supabase, Zustand 5, TanStack Query 5, Recharts, react-hook-form, zod, date-fns. Dev deps: Vite 5, TypeScript 5, Tailwind 3, Vitest 3, ESLint 9 |
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

### Store (State Management)

| File | Purpose |
|------|---------|
| `src/store/useStore.ts` | Single Zustand store. State: currentUser (AuthUser), departments, employees, leaveTypes, leaveRequests, approvalConfigs. Actions: login (calls verify_login RPC), logout, loadData (role-based data fetching), addLeaveRequest, updateLeaveRequest, getters (getEmployee, getDepartment, getLeaveType) |

**Role-based data scoping in loadData:**
- CB.PCM: only own leave_requests
- LD.PCM: leave_requests from employees in same department
- GD.PGD / QTHT: all leave_requests

### Library / Shared Code

| File | Purpose |
|------|---------|
| `src/lib/leave-data.ts` | Core types: UserRole (union), LeaveStatus (union), Department, Employee, LeaveType, LeaveRequest, LeaveBalance, ApprovalConfig. Label maps: roleLabels, leaveStatusLabels |
| `src/lib/utils.ts` | cn() utility: merges Tailwind classes via clsx + tailwind-merge |
| `src/lib/date-utils.ts` | formatDate(): parses ISO/date strings, formats to dd-MM-yyyy via date-fns |

### Supabase Integration

| File | Purpose |
|------|---------|
| `src/integrations/supabase/client.ts` | Supabase client singleton (createClient with env vars VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY). Auto-generated file |
| `src/integrations/supabase/types.ts` | Full Database type definition: Tables (departments, employees, leave_types, leave_balances, leave_requests, leave_config, approval_config), Functions (verify_login), Enums (app_role). Includes helper types: Tables, TablesInsert, TablesUpdate |

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
1. User submits credentials -> `useStore.login(username, password)`
2. Store calls `supabase.rpc("verify_login", { p_username, p_password })` (SECURITY DEFINER)
3. On success: queries employee's department_id, sets currentUser in Zustand
4. `AuthGuard` in App.tsx checks `currentUser` on every render; redirects to /login if null
5. Logout clears currentUser from state (no server-side session invalidation)

### Role-Based UI
All authorization is client-side based on `currentUser.role`:
- `AppSidebar.tsx`: filters menuItems by visible roles
- `App.tsx`: routes are always mounted (no route-level guard), but sidebar hides links that user should not see
- Access control is NOT enforced server-side beyond basic RLS

### Optimistic Updates
- `addLeaveRequest`: inserts via Supabase, prepends to store on success
- `updateLeaveRequest`: updates via Supabase, patches local state on success
- No optimistic/pessimistic toggle; local state always updated after server confirmation

### Date Calculations
- Leave days calculated as `differenceInBusinessDays(start, end) + 1` (date-fns)
- Display format: dd-MM-yyyy (formatDate utility)
- Year/quarter/month filters use date-fns sub-months/start-of-year etc.

### Data Loading
- `loadData()` fetches all reference data in parallel (Promise.all) on login
- Individual pages call loadData() on mount (useEffect) to refresh
- CB.PCM and LD.PCM get scoped leave_requests based on department
- No TanStack React Query used in pages currently (client exists but pages use Zustand directly)

## Database (Supabase PostgreSQL)

### Tables
- `departments` - id, name, code, created_at
- `employees` - id, username, password_hash, full_name, department_id, job_title, role, phone, email, is_active
- `leave_types` - id, name, code (unique), default_days, description, is_active
- `leave_balances` - id, employee_id, leave_type_id, year, total_days, used_days. UNIQUE(employee_id, leave_type_id, year)
- `leave_requests` - id, employee_id, leave_type_id, start_date, end_date, total_days, reason, status, approved_by, approved_at, rejected_reason
- `leave_config` - id, config_key (unique), config_value, description
- `approval_config` - id, leave_type_id, approval_level, approver_role

### Functions
- `verify_login(p_username, p_password)` - SECURITY DEFINER RPC. Returns employee info (id, name, role, position, department_name)
- `update_updated_at_column()` - trigger function auto-updating updated_at

### RLS
All tables: SELECT policies (public). leave_requests: INSERT/UPDATE policies (public). Simple RLS model suited for intranet/internal use.

### Migration
Single migration file at `supabase/migrations/20260416034940_xxx.sql` containing full schema DDL including tables, enums, functions, triggers, RLS policies.
