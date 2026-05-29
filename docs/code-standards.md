# Code Standards - QLNP-TTCDS

## Frontend (React + TypeScript)

### Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| React components | PascalCase | `AppSidebar`, `LeaveNewPage` |
| Files (components) | kebab-case | `app-sidebar.tsx`, `app-layout.tsx`, `dashboard-page.tsx` |
| Files (pages) | PascalCase | `DashboardPage.tsx`, `LeaveNewPage.tsx` |
| Files (utilities/hooks) | kebab-case | `use-mobile.tsx`, `date-utils.ts`, `app-roles.ts` |
| Functions / methods | camelCase | `formatDate()`, `loadData()`, `handleLogin()` |
| Variables / state | camelCase | `currentUser`, `leaveRequests`, `isMobile` |
| TypeScript types / interfaces | PascalCase | `UserRole`, `LeaveRequest`, `AppState` |
| Zod schemas | camelCase, suffix `Schema` | `leaveRequestSchema` |
| Constants / labels | camelCase + `Labels` suffix | `roleLabels`, `leaveStatusLabels` |
| Env variables | UPPER_SNAKE_CASE, prefix `VITE_` | `VITE_API_URL` |
| C# classes/entities | PascalCase | `UserMaster`, `LeaveRequest`, `AppDbContext` |
| C# properties | PascalCase | `UserId`, `FullName`, `LeaveTypeId` |
| Database tables (system) | UPPER_SNAKE_CASE | `USER_MASTER`, `DM_DONVI` |
| Database tables (app) | PascalCase (EF Core default) | `LeaveRequests`, `LeaveBalances` |
| Database columns | PascalCase (EF Core default) | `UserId`, `StartDate`, `LeaveTypeId` |

## TypeScript

### Strictness
- TypeScript 5.8, strict mode in tsconfig
- All props, state, and function signatures typed explicitly
- Avoid `any` - use proper types from `@/features/shared-reference-data`, `@/features/auth`, and `@/api/*.api.ts`

### Type Imports
Import domain types from `@/features/shared-reference-data`, auth types from `@/features/auth`, layout types from `@/features/layout`, API DTOs from respective API modules:
```typescript
import type { UserRole, LeaveStatus } from "@/features/shared-reference-data";
import type { AuthUser } from "@/features/auth";
import type { DepartmentDto } from "@/features/layout";
```

### Union Types
Use string unions for fixed value sets:
```typescript
export type UserRole = "CB.PCM" | "LD.PCM" | "GD.PGD" | "QTHT";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
```

### Label Maps
Use Record<> objects for display labels:
```typescript
export const roleLabels: Record<UserRole, string> = {
  "CB.PCM": "Can bo phong chuyen mon",
  // ...
};
```

## Component Structure

### Page Components
- Default export (no named export wrapper)
- Located in `src/pages/` (legacy) or `src/features/{feature}/components/` (VSA-migrated)
- One component per file
- Legacy pages use Zustand store directly via hooks; VSA-migrated pages use TanStack Query hooks
- Legacy pages call `loadData()` on mount via `useEffect`; VSA-migrated pages rely on TanStack Query automatic fetching
- Must be wrapped in AppLayout via React Router `<Outlet />`

### Feature Components (VSA)
- Named exports for feature components
- Located in `src/features/{feature}/components/`
- Barrel `index.ts` re-exports public API
- Data fetching via TanStack Query hooks in `src/features/{feature}/hooks/`
- API type re-exports in `src/features/{feature}/api/`
- Props interface defined inline or at top

### Layout & UI Components
- Named exports for shared components
- Located in `src/shared/ui/` (shadcn/ui) or `src/components/` (app-level shared)
- Props interface defined inline or at top
- No default export (use named export pattern)

### shadcn/ui Components
- Auto-generated, located in `src/shared/ui/`
- Do NOT modify generated files manually
- Extend via wrapper components in `src/components/`

## Import Order

1. React / React Router imports
2. Auth feature imports (`@/features/auth`)
3. Dashboard feature imports (`@/features/dashboard`)
4. Layout feature imports (`@/features/layout`)
5. Shared reference data imports (`@/features/shared-reference-data`)
6. Store imports (`@/store/useStore`) -- legacy only, use TanStack Query hooks for VSA features
7. API module imports (`@/api/...`) -- or feature-local re-exports (`@/features/{feature}/api/...`)
8. Shared infrastructure imports (`@/shared/...` -- lib, hooks, ui, api/client)
9. TanStack Query imports (`@tanstack/react-query`)
10. Feature module imports (`@/features/...`)
11. Shared component imports (`@/components/...`) -- legacy, being migrated to features
12. Icon imports (lucide-react)
13. Type imports (last)

Use `@/` path alias for all internal imports:
```typescript
import { useAuth } from "@/features/auth";
import { AppLayout } from "@/features/layout";
import { useStore } from "@/store/useStore";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { type UserRole } from "@/features/shared-reference-data";
import { CalendarDays } from "lucide-react";
```

## State Management

### Auth Feature (`src/features/auth/`)
- Barrel `index.ts` exports: LoginPage, AuthProvider, useAuth, AuthGuard, authApi, AuthUser
- `contexts/auth-context.tsx`: Manages auth state: `user` (AuthUser | null), `loading`, `isEmbed`
- On mount: calls `GET /api/auth/me` to resolve current user
- Embed mode: listens for `postMessage({ type: "auth", token })` from host
- JWT stored in `localStorage` under key `"jwt"`
- `hooks/use-auth.ts`: Access auth state via `useAuth()` hook
- `hooks/use-auth-guard.tsx`: AuthGuard component (extracted from router.tsx), redirects to /login if no user
- `components/login-page.tsx`: SSO waiting screen + dev-only user selector
- `api/auth.api.ts` + `api/types.ts`: AuthUser type + authApi.me()

### Layout Feature (`src/features/layout/`)
- Barrel `index.ts` exports: AppLayout, AppSidebar, AppHeader, departmentsApi, DepartmentDto
- `components/app-layout.tsx`: Main layout with sidebar (collapsible, mobile responsive) + header + Outlet. Named export
- `components/app-sidebar.tsx`: Role-based navigation with menu filtering. Uses NavLink from react-router-dom
- `components/app-header.tsx`: Top bar with sidebar toggle, breadcrumb, user avatar + dropdown
- `api/departments.api.ts`: DepartmentDto type + departmentsApi.list()

### Zustand Store (`src/store/useStore.ts`)
- Data-only store (no auth state)
- State: departments (DepartmentDto[]), leaveTypes, leaveRequests, approvalConfigs
- Actions: loadData, addLeaveRequest, updateLeaveRequest
- getters: getDepartment, getLeaveType
- Imports `departmentsApi` and `DepartmentDto` from `@/features/layout`
- Access via selector pattern: `useStore(s => s.departments)`
- Never mutate state directly; always use set()

### TanStack React Query
- QueryClient created in `app/providers.tsx`, provided via QueryClientProvider
- Currently NOT used in pages (pages use Zustand directly)
- Prepared for future server state caching

## Component Pattern Example

```typescript
import { useEffect } from "react";
import { useAuth } from "@/features/auth";
import { useStore } from "@/store/useStore";
import { leaveStatusLabels, type LeaveStatus } from "@/features/shared-reference-data";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

const MyComponent = () => {
  const { user } = useAuth();
  const leaveRequests = useStore((s) => s.leaveRequests);
  const loadData = useStore((s) => s.loadData);

  useEffect(() => { loadData(); }, []);

  return (
    <div>...</div>
  );
};

export default MyComponent;
```

## Error Handling

- API calls return `ApiResponse<T>` = `{ data: T | null, error: string | null }`
- Display errors via Sonner toast: `toast.error("message")`
- Form validation: React Hook Form + Zod schema
- Network failures: client.ts catches exceptions, returns error string
- Entity validation: EF Core attributes ([MaxLength], [Required]) + FluentValidation per endpoint

## Formatting & Linting

- ESLint 9 flat config (`eslint.config.js`)
- React Hooks plugin for hooks rules
- TypeScript ESLint for TS-specific rules
- No strict prettier config; prioritize readability
- Indentation: tabs (2-space equivalent)

## CSS / Styling

- Tailwind utility classes ONLY (no custom CSS files except index.css)
- Use shadcn/ui theme CSS variables for colors
- Use `cn()` utility for conditional classes
- Status colors: semantic CSS classes (bg-warning, text-success, etc.)
- Responsive: mobile-first with md: breakpoint for desktop

## Backend (.NET 10 + FastEndpoints + EF Core + Vertical Slice Architecture)

### Project Structure

```
packages/api/
├── Program.cs                        # FastEndpoints + EF Core DI registration
├── Shared/                           # Cross-cutting shared code
│   ├── Domain/                       # Domain entities + services (namespace: QLNP.Api.Shared.Domain)
│   │   ├── UserMaster.cs             # Scaffolded from USER_MASTER
│   │   ├── DmDonvi.cs                # Scaffolded from DM_DONVI
│   │   ├── LeaveType.cs              # Code First
│   │   ├── LeaveBalance.cs           # Code First
│   │   ├── LeaveRequest.cs           # Code First (incl. ApprovedLevel for N-level approval)
│   │   ├── LeaveRequestAudit.cs      # Code First
│   │   ├── LeaveConfig.cs            # Code First
│   │   ├── SystemConfig.cs           # Code First (key-value settings)
│   │   ├── UserRole.cs               # Role constants
│   │   ├── ApprovalHelper.cs         # Shared N-level approval logic
│   │   ├── BusinessDayCalculator.cs  # T2-T6 inclusive count
│   │   ├── LeaveBalanceService.cs    # Domain service for balance operations
│   │   ├── ILeaveBalanceService.cs   # Interface for LeaveBalanceService
│   │   └── LeaveBalanceSeeding.cs    # Balance seeding logic
│   ├── Contracts/                     # Shared response envelopes (namespace: QLNP.Api.Shared.Contracts)
│   │   ├── Result.cs                 # Result<T> success/error envelope
│   │   └── PagedData.cs             # PagedData<T> paginated list envelope
│   ├── Groups/                        # FastEndpoints route groups (namespace: QLNP.Api.Shared.Groups)
│   │   ├── AuthGroup.cs             # /api/auth
│   │   ├── LeaveRequestGroup.cs     # /api/leave-requests
│   │   ├── LeaveTypeGroup.cs        # /api/leave-types
│   │   ├── LeaveBalanceGroup.cs     # /api/leave-balances
│   │   ├── DepartmentGroup.cs       # /api/departments
│   │   └── SystemConfigGroup.cs     # /api/system-configs
│   ├── Middleware/                    # (namespace: QLNP.Api.Shared.Middleware)
│   │   └── CurrentUser.cs            # CurrentUser record (UserId, DisplayName, UnitId, PhongBanId, DeviceId, Roles, UserIdUBTP, PhongBanIdUBTP, DonViIdUBTP)
│   └── LinqExtension.cs              # LINQ helpers
├── Infrastructure/
│   └── Auth/                          # Auth infrastructure (namespace: QLNP.Api.Infrastructure.Auth)
│       ├── ICurrentUserProvider.cs    # Interface for current user resolution
│       ├── CurrentUserProvider.cs     # Reads claims from ClaimsPrincipal (JWT)
│       └── Roles.cs                   # AppRoles constants (Admin, Director, Leader, Staff)
├── Data/
│   ├── AppDbContext.cs               # EF Core context + OnModelCreating + seed data
│   ├── AppDbContextFactory.cs        # Design-time factory for migrations
│   ├── SeedHelper.cs                 # Startup seeding logic
│   └── Migrations/                   # EF Core migrations
├── Features/                         # Vertical slices (VSA {Action}{Role}.cs pattern)
│   ├── Auth/Me/, DevLogin/          # Auth endpoints
│   ├── Departments/List/, Get/       # Department reference endpoints
│   ├── LeaveBalances/List/, My/      # Balance endpoints
│   ├── LeaveRequests/                 # Leave request endpoints
│   │   ├── Create/                    # CreateLeaveRequestEndpoint, Request, Validator, Mapper
│   │   ├── List/                      # ListLeaveRequestsEndpoint
│   │   ├── My/                        # MyLeaveRequestsEndpoint
│   │   ├── Update/                    # UpdateLeaveRequestEndpoint, Request, Validator, Mapper
│   │   ├── Approve/                   # ApproveLeaveRequestEndpoint
│   │   ├── Reject/                    # RejectLeaveRequestEndpoint, Request, Validator
│   │   ├── Cancel/                    # CancelLeaveRequestEndpoint
│   │   ├── LeaveRequestDto.cs        # Shared DTO (incl. ApprovedLevel)
│   │   └── LeaveRequestMapping.cs    # Shared DRY DTO mapping
│   ├── LeaveTypes/                    # Leave type CRUD (Admin-only)
│   │   ├── List/, Create/, Update/, Delete/  # Each: {Action}LeaveTypeEndpoint.cs
│   │   └── LeaveTypeDto.cs
│   ├── SystemConfigs/                 # System settings + approval config
│   │   ├── Get/, Update/             # SystemConfig endpoints
│   │   ├── GetLeaveConfigs/           # GetLeaveConfigsEndpoint
│   │   ├── ReplaceLeaveConfigs/       # ReplaceLeaveConfigsEndpoint
│   │   ├── SystemConfigDto.cs, LeaveConfigDto.cs
│   │   └── ReplaceLeaveConfigsResponse.cs
│   └── Reports/Export/                # ClosedXML .xlsx export
```

### Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Endpoint files | `{Action}{Role}.cs` VSA pattern | `CreateLeaveRequestEndpoint.cs`, `ListLeaveRequestsEndpoint.cs` |
| Endpoint classes | PascalCase, suffix `Endpoint` | `CreateLeaveRequestEndpoint`, `ListLeaveRequestsEndpoint` |
| Request DTOs | PascalCase, suffix `Request` | `CreateLeaveRequestRequest`, `UpdateSystemConfigRequest` |
| Response DTOs | PascalCase, suffix `Response` | `ReplaceLeaveConfigsResponse` |
| Validator classes | PascalCase, suffix `Validator` | `CreateLeaveRequestValidator`, `RejectLeaveRequestValidator` |
| Mapper classes | PascalCase, suffix `Mapper` | `CreateLeaveRequestMapper`, `UpdateLeaveRequestMapper` |
| Domain entities | In `Shared/Domain/`, PascalCase | `LeaveRequest.cs`, `SystemConfig.cs`, `ApprovalHelper.cs` |
| Route Groups | In `Shared/Groups/`, suffix `Group` | `LeaveRequestGroup`, `SystemConfigGroup` |
| Response envelopes | In `Shared/Contracts/`, generic `record` | `Result<T>`, `PagedData<T>` |
| Auth infrastructure | In `Infrastructure/Auth/` | `ICurrentUserProvider.cs`, `Roles.cs` (AppRoles constants) |
| Feature folders | PascalCase | `Auth/`, `LeaveRequests/`, `SystemConfigs/` |
| SQL tables (system) | UPPER_SNAKE_CASE | `USER_MASTER`, `DM_DONVI` |
| SQL tables (app) | PascalCase (EF default) | `LeaveRequests`, `LeaveBalances` |

### Endpoint Pattern (REPR + Property Injection)

```csharp
// {Action}{Role}.cs — e.g. CreateLeaveRequestEndpoint.cs
internal sealed class CreateLeaveRequestEndpoint
    : Endpoint<CreateLeaveRequestRequest, Result<LeaveRequestDto>, CreateLeaveRequestMapper>
{
    // Property injection — no constructor, no Data.cs class
    public AppDbContext Db { get; set; } = null!;
    public ICurrentUserProvider CurrentUser { get; set; } = null!;

    public override void Configure()
    {
        Post("");                      // Route prefix comes from Group<LeaveRequestGroup>()
        Group<LeaveRequestGroup>();    // Route group defines prefix: /api/leave-requests
        Roles(AppRoles.Staff, AppRoles.Leader);  // AppRoles constants, not magic strings
    }

    public override async Task HandleAsync(CreateLeaveRequestRequest r, CancellationToken ct)
    {
        var user = CurrentUser.GetCurrentUser();
        // ... business logic + EF Core queries directly via Db ...
    }
}
```

Key changes from pre-VSA:
- **Property injection** (`= null!;`) replaces constructor injection and `Data.cs` classes
- **Route Groups** (`Group<T>()`) define URL prefixes; endpoints use relative routes (`Post("")`, `Get("")`)
- **`AppRoles` constants** replace magic strings like `"CB.PCM"` — defined in `Infrastructure/Auth/Roles.cs`
- **`Result<T>`** envelope wraps all responses for consistent `{ Success, Data, Message, Errors }` format
- **No `Data.cs`** — endpoints query `Db` (AppDbContext) directly

### FastEndpoints Pipeline

```
HTTP Request
  → Route Group prefix (e.g. /api/leave-requests from LeaveRequestGroup)
  → JWT Bearer Authentication (Issuer/Audience/SigningKey validation)
  → Authorization (claims-based, Roles(AppRoles.*) attribute)
  → Validator.ValidateAsync()       [FluentValidation, auto]
  → Endpoint.HandleAsync()           [business logic + property-injected Db + CurrentUser]
  → Result<T> envelope response
```

### Data Access (EF Core)

- Endpoint nhận `AppDbContext` qua property injection (`Db { get; set; } = null!;`), không dùng constructor injection
- Domain entities in `Shared/Domain/` (namespace: `QLNP.Api.Shared.Domain`), not `Entities/`
- System tables (USER_MASTER, DM_DONVI): read-only, `ExcludeFromMigrations()`
- App tables (LeaveRequests, LeaveBalances, LeaveConfigs, SystemConfigs, LeaveRequestAudits, ...): Code First, managed by migrations
- LINQ queries thay vì SQL thuần, type-safe compile-time check
- Seed data configured trong `OnModelCreating`: LeaveTypes (5), LeaveConfigs (9 rows), SystemConfigs (8 key-value rows for system settings and role-based NPN defaults)

### API Conventions

- Request/Response dùng C# `record` types
- All responses wrapped in `Result<T>` envelope: `{ Success, Data, Message, Errors }`
- Paginated lists use `PagedData<T>`: `{ Items, TotalCount, Page, PageSize }`
- CurrentUser resolved from Claims via ICurrentUserProvider (UserId, DisplayName, UnitId, PhongBanId, Roles list)
- Role check: FastEndpoints `Roles(AppRoles.*)` with constants from `Infrastructure/Auth/Roles.cs`
- Multi-role users: `CurrentUser.Roles` là `List<string>`, nhiều roles possible (VD: LD.PCM + GD.PGD)
- Route Groups define URL prefixes: endpoints use relative routes (`Post("")`, `Get("")`)
- Error response dùng `AddError()` hoặc `ThrowError()` của FastEndpoints
- Dev mode: ICurrentUserProvider fallback to userId=1, roles=["QTHT"] khi anonymous (no JWT)

### N-Level Approval Pattern

Approval logic is config-driven and shared via `ApprovalHelper.cs` (in `Shared/Domain/`):

```csharp
// ApprovalHelper provides shared logic for N-level approval
var flow = ApprovalHelper.GetApprovalFlow(configs);  // groups LeaveConfigs by level
var maxLevel = ApprovalHelper.GetMaxLevel(flow);       // returns highest level
var (canApprove, error) = ApprovalHelper.CanApproveAtLevel(user, request, flow, targetLevel);
```

Key rules:
- `ApprovedLevel = 0` means no approvals (status = pending)
- `ApprovedLevel = maxLevel` means fully approved (status = approved)
- Intermediate ApprovedLevel (1..maxLevel-1) means partially approved (status stays pending)
- Balance deduction only on final approval (ApprovedLevel == maxLevel)
- OR logic per level: any role configured at a level can advance the request
- Scope: LD.PCM = same department check (not self); GD.PGD = no scope restriction
- `LeaveConfig.ApprovalLevel` supports 1-5 levels per leave type

## Git Practices

- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Keep commits focused and atomic
- No AI references in commit messages
- Branch: main (trunk-based)
- Vietnamese for commit descriptions where appropriate
