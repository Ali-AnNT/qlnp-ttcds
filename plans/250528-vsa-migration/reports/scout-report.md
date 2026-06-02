# VSA Migration Report — qlnp-ttcds Web

## Current Architecture

### Current Structure (Layered)

```
src/
├── api/                        # Layered: all API calls
│   ├── auth.api.ts            # AuthUser, authApi
│   ├── client.ts              # Base API client
│   ├── config.api.ts         # ConfigDto
│   ├── departments.api.ts    # DepartmentDto
│   ├── leave-balances.api.ts # LeaveBalanceDto
│   ├── leave-requests.api.ts  # LeaveRequestDto, CreateLeaveRequestDto
│   ├── leave-types.api.ts    # LeaveTypeDto
│   └── system-configs.api.ts # SystemConfigDto
├── components/                # Mixed: feature-specific + UI kit
│   ├── AppHeader.tsx         # Feature: layout
│   ├── AppSidebar.tsx         # Feature: layout
│   ├── LeaveBalanceCard.tsx   # Feature: dashboard
│   ├── LeaveHistory.tsx       # Feature: dashboard
│   ├── LeaveRequestForm.tsx   # Feature: leave request
│   ├── NavLink.tsx            # Feature: layout
│   └── ui/                    # UI Kit (49 files)
├── contexts/                  # Global state
│   └── AuthContext.tsx
├── hooks/                     # Generic hooks only
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/                       # Utilities
│   ├── date-utils.ts
│   ├── leave-data.ts          # Role constants, status helpers
│   └── utils.ts
├── pages/                     # Route handlers (fat components)
│   ├── AppLayout.tsx         # Layout wrapper (Outlet)
│   ├── ApprovalPage.tsx      # 200 lines
│   ├── CalendarPage.tsx      # 173 lines
│   ├── ConfigPage.tsx        # 498 lines
│   ├── DashboardPage.tsx     # 206 lines
│   ├── Index.tsx
│   ├── LeaveMyPage.tsx        # 256 lines
│   ├── LeaveNewPage.tsx      # 138 lines
│   ├── LoginPage.tsx         # 126 lines
│   ├── NotFound.tsx
│   ├── ReportsPage.tsx       # 113 lines
│   ├── SummaryPage.tsx       # 329 lines
│   └── ViolationsPage.tsx    # 440 lines
├── store/                     # Global store (Zustand)
│   └── useStore.ts           # Departments + LeaveTypes + LeaveRequests + Balances + Configs
├── test/
└── main.tsx + App.tsx         # Entry points
```

### Pages → Features Mapping

| Page | Feature | Role Access |
|------|---------|-------------|
| LoginPage | auth | public |
| DashboardPage | dashboard | Staff, Leader, Director, Admin |
| LeaveNewPage | leave-requests | Staff, Leader |
| LeaveMyPage | leave-requests | Staff, Leader |
| ApprovalPage | approval | Leader, Director |
| CalendarPage | calendar | Staff, Leader, Director, Admin |
| SummaryPage | summary | Director |
| ReportsPage | reports | Director |
| ViolationsPage | violations | Director |
| ConfigPage | config | Admin |

### What's Feature-Specific vs Shared

**Shared (Tier 1):**
- `ui/` — 49 shadcn/ui components
- `api/client.ts` — base HTTP client
- `use-mobile.tsx`, `use-toast.ts` — generic hooks
- `lib/utils.ts`, `lib/date-utils.ts` — formatters

**Feature-Specific (Tier 3):**
- Pages are fat — mix business logic + UI
- API files per domain (`auth`, `leave-*`, etc.)
- `LeaveBalanceCard`, `LeaveHistory`, `LeaveRequestForm` (unused)
- `useStore` swells with all domain data

---

## Target VSA Structure

### Simple VSA (~10 features)

```
src/
├── app/
│   ├── App.tsx               # Route definitions + providers
│   ├── router.tsx            # Route map
│   ├── providers.tsx        # QueryClient, TooltipProvider, etc.
│   └── main.tsx
├── features/
│   ├── auth/                 # Login + auth context
│   │   ├── api/
│   │   │   ├── auth.api.ts
│   │   │   └── types.ts      # AuthUser
│   │   ├── components/
│   │   │   └── login-form.tsx
│   │   ├── contexts/
│   │   │   └── auth-context.tsx
│   │   ├── hooks/
│   │   │   ├── use-auth.ts
│   │   │   └── use-auth-redirect.ts
│   │   └── index.ts
│   ├── dashboard/            # Dashboard metrics + recent activity
│   │   ├── components/
│   │   │   ├── dashboard-page.tsx
│   │   │   ├── dashboard-metrics.tsx
│   │   │   └── recent-requests-list.tsx
│   │   ├── hooks/
│   │   │   ├── use-dashboard-stats.ts
│   │   │   └── use-recent-requests.ts
│   │   └── index.ts
│   ├── leave-requests/       # Create, edit, cancel, list (my)
│   │   ├── api/
│   │   │   ├── leave-requests.api.ts
│   │   │   ├── leave-balances.api.ts
│   │   │   └── types.ts
│   │   ├── components/
│   │   │   ├── leave-new-form.tsx
│   │   │   ├── leave-my-page.tsx
│   │   │   ├── leave-my-table.tsx
│   │   │   ├── leave-edit-dialog.tsx
│   │   │   └── leave-balance-card.tsx
│   │   ├── hooks/
│   │   │   ├── use-leave-requests.ts
│   │   │   ├── use-leave-balances.ts
│   │   │   └── use-submit-leave-request.ts
│   │   └── index.ts
│   ├── approval/             # Approve/reject requests
│   │   ├── api/
│   │   │   └── types.ts
│   │   ├── components/
│   │   │   ├── approval-page.tsx
│   │   │   ├── approval-table.tsx
│   │   │   ├── reject-dialog.tsx
│   │   │   └── detail-dialog.tsx
│   │   ├── hooks/
│   │   │   ├── use-approval-requests.ts
│   │   │   └── use-approval-actions.ts
│   │   └── index.ts
│   ├── calendar/             # View calendar + list
│   │   ├── components/
│   │   │   ├── calendar-page.tsx
│   │   │   ├── calendar-grid.tsx
│   │   │   └── calendar-list.tsx
│   │   └── index.ts
│   ├── summary/              # Director: dept summary + pie chart
│   │   ├── components/
│   │   │   ├── summary-page.tsx
│   │   │   ├── dept-summary-table.tsx
│   │   │   └── type-pie-chart.tsx
│   │   ├── hooks/
│   │   │   └── use-dept-summary.ts
│   │   └── index.ts
│   ├── reports/              # Charts + CSV export
│   │   ├── components/
│   │   │   ├── reports-page.tsx
│   │   │   ├── dept-bar-chart.tsx
│   │   │   └── type-pie-chart.tsx
│   │   └── index.ts
│   ├── violations/           # Track over-limit users/depts
│   │   ├── api/
│   │   │   └── types.ts
│   │   ├── components/
│   │   │   ├── violations-page.tsx
│   │   │   ├── violation-metrics.tsx
│   │   │   ├── violation-dept-table.tsx
│   │   │   ├── violation-emp-table.tsx
│   │   │   ├── violation-chart.tsx
│   │   │   ├── emp-detail-dialog.tsx
│   │   │   └── dept-detail-dialog.tsx
│   │   ├── hooks/
│   │   │   ├── use-employee-violations.ts
│   │   │   └── use-department-violations.ts
│   │   └── index.ts
│   ├── config/              # Admin: system + leave types + approval flow
│   │   ├── api/
│   │   │   ├── config.api.ts
│   │   │   ├── leave-types.api.ts
│   │   │   ├── system-configs.api.ts
│   │   │   └── types.ts
│   │   ├── components/
│   │   │   ├── config-page.tsx
│   │   │   ├── general-settings.tsx
│   │   │   ├── default-days-settings.tsx
│   │   │   ├── leave-type-manager.tsx
│   │   │   ├── approval-flow-manager.tsx
│   │   │   ├── leave-type-dialog.tsx
│   │   │   └── approval-dialog.tsx
│   │   ├── hooks/
│   │   │   ├── use-leave-types.ts
│   │   │   ├── use-approval-config.ts
│   │   │   └── use-system-configs.ts
│   │   └── index.ts
│   ├── layout/               # Sidebar + header layout
│   │   ├── api/
│   │   │   └── departments.api.ts
│   │   ├── components/
│   │   │   ├── app-layout.tsx
│   │   │   ├── app-sidebar.tsx
│   │   │   ├── app-header.tsx
│   │   │   └── nav-link.tsx
│   │   └── index.ts
│   └── shared-reference-data/  # Role constants, status helpers
│       ├── constants/
│       │   └── app-roles.ts   # AppRoles, roleLabels
│       ├── helpers/
│       │   └── approval-status.ts
│       └── index.ts
├── shared/                    # Tier 1 infrastructure
│   ├── ui/                   # shadcn/ui components (49 files)
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   └── date-utils.ts
│   └── api/
│       └── client.ts         # Base API client
└── test/
```

### Feature Sizes After Split

| Feature | Components | Hooks | Lines (est.) |
|---------|-----------|-------|-------------|
| auth | 2 | 2 | ~150 |
| layout | 4 | 0 | ~300 |
| dashboard | 3 | 2 | ~220 |
| leave-requests | 5 | 3 | ~400 |
| approval | 4 | 2 | ~250 |
| calendar | 3 | 0 | ~200 |
| summary | 3 | 1 | ~350 |
| reports | 3 | 0 | ~130 |
| violations | 7 | 2 | ~500 |
| config | 8 | 3 | ~550 |

---

## Migration Order

### Phase 1: Shared Infrastructure (Foundation)
1. Move `api/client.ts` → `shared/api/`
2. Move `ui/` → `shared/ui/`
3. Move `lib/utils.ts`, `lib/date-utils.ts` → `shared/lib/`
4. Move `hooks/` → `shared/hooks/`
5. Move `lib/leave-data.ts` → `shared-reference-data/`
6. Create `shared-reference-data/index.ts`

### Phase 2: App Layer
7. Extract `providers.tsx` from `App.tsx`
8. Extract `router.tsx` from `App.tsx`
9. Create `app/App.tsx` (thin, imports features)

### Phase 3: Core Features (in dependency order)
10. **auth** — smallest, no deps on others
11. **layout** — sidbar/header, depends on auth
12. **dashboard** — uses auth + store data
13. **leave-requests** — main CRUD feature
14. **approval** — depends on leave-requests for types
15. **calendar** — depends on leave-requests
16. **summary** — depends on calendar/data
17. **reports** — depends on summary/data
18. **violations** — depends on reports/data
19. **config** — depends on leave-requests

### Phase 4: Cleanup
20. Remove old `store/useStore.ts` — replace with per-feature stores
21. Update all imports to feature public API
22. Add `index.ts` barrel exports per feature
23. Configure ESLint boundary rules

---

## State Management Strategy

**Current:** Single Zustand store (`useStore`) with all data + `AuthContext`

**After:**
- `auth`: `AuthContext` stays (cross-feature auth state)
- `layout`: local state only
- `dashboard`: local state + TanStack Query
- `leave-requests`: TanStack Query for all server state (list, balances, mutations)
- `approval`: local state + TanStack Query
- `calendar`: local state + TanStack Query
- `summary`: local state + TanStack Query
- `config`: local state + TanStack Query mutations

**Data Flow:**
- TanStack Query for all server state (caching, refetching, mutations)
- Local useState/useReducer for UI state
- No Zustand stores — entirely replaced by TanStack Query
- AuthContext remains global (required by layout)

---

## Risks & Notes

1. **Store replacement** — `useStore.ts` has 5 domains. Replace entirely with TanStack Query hooks per feature.
2. **ViolationsPage** (440 lines) — largest page, will split into 4-5 components
3. **ConfigPage** (498 lines) — second largest, will split into 4 components
4. **LeaveHistory / LeaveRequestForm** — appear unused; verify before migration
5. **Chart components** — recharts usage in violations/reports/summary can be extracted to `shared/` once used in 3+ features

---

## Files to Delete After Migration

- `src/contexts/AuthContext.tsx` → moves to `features/auth/`
- `src/store/useStore.ts` → replaced by TanStack Query hooks per feature
- `src/components/LeaveHistory.tsx` → appears unused
- `src/components/LeaveRequestForm.tsx` → appears unused

## Files to Update (Routes)

- `App.tsx` → thin wrapper importing from features
- `main.tsx` → imports from `app/providers`

---

**Status:** Analysis complete. Ready for implementation.
