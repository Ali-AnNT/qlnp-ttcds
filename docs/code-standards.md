# Code Standards - QLNP-TTCDS

## Frontend (React + TypeScript)

### Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| React components | PascalCase | `AppSidebar.tsx`, `LeaveNewPage.tsx` |
| Files (components) | PascalCase | `DashboardPage.tsx`, `LeaveRequestForm.tsx` |
| Files (utilities/hooks) | kebab-case | `use-mobile.tsx`, `date-utils.ts`, `leave-data.ts` |
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
- Avoid `any` - use proper types from `@/lib/leave-data.ts` and `@/api/*.api.ts`

### Type Imports
Import domain types from shared `@/lib/leave-data.ts`, API DTOs from respective API modules:
```typescript
import type { UserRole, LeaveStatus } from "@/lib/leave-data";
import type { DepartmentDto } from "@/api/departments.api";
```

### Union Types
Use string unions for fixed value sets:
```typescript
export type UserRole = "CB.PCM" | "LD.PCM" | "GD.PGD" | "QTHT";
export type LeaveStatus = "pending" | "approved_leader" | "approved_director" | "rejected" | "cancelled";
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
- Located in `src/pages/`
- One component per file
- Use Zustand store directly via hooks
- Call `loadData()` on mount via `useEffect`
- Must be wrapped in AppLayout via React Router `<Outlet />`

### Layout & UI Components
- Named exports for shared components
- Located in `src/components/`
- Props interface defined inline or at top
- No default export (use named export pattern)

### shadcn/ui Components
- Auto-generated, located in `src/components/ui/`
- Do NOT modify generated files manually
- Extend via wrapper components in `src/components/`

## Import Order

1. React / React Router imports
2. Context imports (`@/contexts/AuthContext`)
3. Store imports (`@/store/useStore`)
4. API module imports (`@/api/...`)
5. Library / utility imports (`@/lib/...`)
6. UI component imports (`@/components/ui/...`)
7. Shared component imports (`@/components/...`)
8. Icon imports (lucide-react)
9. Type imports (last)

Use `@/` path alias for all internal imports:
```typescript
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
```

## State Management

### AuthContext (`src/contexts/AuthContext.tsx`)
- Manages auth state: `user` (AuthUser | null), `loading`, `isEmbed`
- On mount: calls `GET /api/auth/me` to resolve current user
- Embed mode: listens for `postMessage({ type: "auth", token })` from host
- JWT stored in `localStorage` under key `"jwt"`
- Access via `useAuth()` hook

### Zustand Store (`src/store/useStore.ts`)
- Data-only store (no auth state)
- State: departments, leaveTypes, leaveRequests, approvalConfigs
- Actions: loadData, addLeaveRequest, updateLeaveRequest
- getters: getDepartment, getLeaveType
- Access via selector pattern: `useStore(s => s.departments)`
- Never mutate state directly; always use set()

### TanStack React Query
- QueryClient created in App.tsx, provided via QueryClientProvider
- Currently NOT used in pages (pages use Zustand directly)
- Prepared for future server state caching

## Component Pattern Example

```typescript
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/store/useStore";
import { leaveStatusLabels, type LeaveStatus } from "@/lib/leave-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

## Backend (.NET 9 + FastEndpoints + EF Core + Vertical Slice Architecture)

### Project Structure

```
packages/api/
├── Program.cs                        # FastEndpoints + EF Core DI registration
├── Entities/                         # Domain entities
│   ├── UserMaster.cs                 # Scaffolded from USER_MASTER
│   ├── DmDonvi.cs                    # Scaffolded from DM_DONVI
│   ├── UserRole.cs                   # Code First
│   ├── LeaveType.cs                  # Code First
│   ├── LeaveBalance.cs               # Code First
│   ├── LeaveRequest.cs               # Code First
│   └── LeaveConfig.cs                # Code First
├── Data/
│   ├── AppDbContext.cs               # EF Core context + OnModelCreating + seed data
│   ├── AppDbContextFactory.cs        # Design-time factory for migrations
│   └── Migrations/                   # EF Core migrations
├── Features/                         # Vertical slices
│   ├── Auth/Me/                      # MeEndpoint (implemented)
│   ├── Config/Get, Update, UserRole/ # Config endpoints
│   ├── LeaveBalances/List, My/
│   ├── LeaveRequests/
│   │   ├── List/ Create/ Update/     # P1 implemented (role-based filtering, business days, overlap)
│   │   ├── Approve/ Reject/ Cancel/  # Scaffolded (P2)
│   │   ├── BusinessDayCalculator.cs  # T2-T6 inclusive count
│   │   └── LeaveRequestDto.cs        # Shared DTO
│   └── LeaveTypes/List, Create, Update, Delete/  # Roles("QTHT")
├── Auth/
│   ├── ICurrentUserProvider.cs       # Interface for current user resolution
│   └── CurrentUserProvider.cs        # Reads claims from HttpContext
└── Middleware/
    └── CurrentUser.cs                # CurrentUser record (UserId, DisplayName, UnitId, PhongBanId, Roles, etc.)
```

### Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Endpoint classes | PascalCase, suffix `Endpoint` | `LoginEndpoint`, `CreateLeaveRequestEndpoint` |
| Request DTOs | PascalCase, suffix `Request` | `LoginRequest`, `CreateEmployeeRequest` |
| Response DTOs | PascalCase, suffix `Response` | `LoginResponse`, `EmployeeResponse` |
| Validator classes | PascalCase, suffix `Validator` | `LoginValidator` |
| Feature folders | PascalCase | `Auth/`, `LeaveRequests/`, `Config/` |
| SQL tables (system) | UPPER_SNAKE_CASE | `USER_MASTER`, `DM_DONVI` |
| SQL tables (app) | PascalCase (EF default) | `LeaveRequests`, `LeaveBalances` |

### Endpoint Pattern (REPR + EF Core)

```csharp
// {Feature}/Models.cs
internal sealed record Request(
    long LeaveTypeId, DateTime StartDate, DateTime EndDate,
    string Reason, long? RequestedApproverId);

internal sealed record Response(LeaveRequestDto LeaveRequest);

// {Feature}/Data.cs -- Data access via AppDbContext DI
internal sealed class Data
{
    private readonly AppDbContext _db;
    public Data(AppDbContext db) => _db = db;
    public async Task<LeaveRequest?> GetByIdAsync(long id, CancellationToken ct) =>
        await _db.LeaveRequests.Include(lr => lr.User).ThenInclude(u => u!.DonVi)
            .Include(lr => lr.LeaveType).FirstOrDefaultAsync(lr => lr.Id == id, ct);
}

// {Feature}/Endpoint.cs
internal sealed class Endpoint : Endpoint<Request, Response, Mapper>
{
    private readonly Data _data;
    private readonly ICurrentUserProvider _currentUser;

    public Endpoint(Data data, ICurrentUserProvider currentUser) { _data = data; _currentUser = currentUser; }

    public override void Configure()
    {
        Post("/api/leave-requests");
        Roles("CB.PCM", "LD.PCM");  // FastEndpoints role-based auth
    }

    public override async Task HandleAsync(Request r, CancellationToken ct)
    {
        var user = _currentUser.GetCurrentUser();  // Claims-based current user
        // ... business logic + EF Core queries via _data ...
    }
}
```

### FastEndpoints Pipeline

```
HTTP Request
  → Authentication/Authorization (claims-based, Roles() attribute)
  → Validator.ValidateAsync()     [FluentValidation, auto]
  → Endpoint.HandleAsync()         [business logic + Data class + EF Core]
  → HTTP Response
```

### Data Access (EF Core)

- Endpoint nhận `AppDbContext` qua constructor DI injection
- System tables (USER_MASTER, DM_DONVI): read-only, `ExcludeFromMigrations()`
- App tables (LeaveRequests, LeaveBalances, ...): Code First, managed by migrations
- LINQ queries thay vì SQL thuần, type-safe compile-time check
- Seed data configured trong `OnModelCreating`

### API Conventions

- Request/Response dùng C# `record` types
- CurrentUser resolved from Claims via ICurrentUserProvider (UserId, DisplayName, UnitId, PhongBanId, Roles list)
- Role check: FastEndpoints `Roles()` attribute (compile-time) hoặc `CurrentUser.Roles.Contains()` trong handler logic
- Multi-role users: `CurrentUser.Roles` là `List<string>`, nhiều roles possible (VD: LD.PCM + GD.PGD)
- Response format nhất quán: `{ data, error }` envelope
- Error response dùng `AddError()` hoặc `ThrowError()` của FastEndpoints
- Dev mode: CurrentUserMiddleware fallback to userId=1, roles=["QTHT"] khi không có gateway headers

## Git Practices

- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Keep commits focused and atomic
- No AI references in commit messages
- Branch: main (trunk-based)
- Vietnamese for commit descriptions where appropriate
