# System Architecture - QLNP-TTCDS

## ~~Supabase Prototype~~ (DEPRECATED — removed in Phase 1)

Supabase architecture replaced by .NET API + SQL Server. All Supabase code, deps, and migrations removed.

## Current Architecture (Phase 5): .NET 10 + EF Core + JWT Bearer Auth

### High-Level

```
Host Website (SSO Portal)
  └─ iframe ─ React SPA (Vite)
       ├─ app/                        ← App shell (App.tsx, providers, router)
       ├─ shared/                     ← Generic infrastructure (api client, lib, hooks, ui)
       │   ├─ api/client.ts (fetch + Bearer JWT)
       │   ├─ lib/ (utils, date-utils)
       │   ├─ hooks/ (use-mobile, use-toast)
       │   └─ ui/ (49 shadcn/ui components)
       ├─ features/                   ← Feature modules (VSA)
       │   ├─ auth/                    ← Auth feature (api, components, contexts, hooks)
       │   │   └─ index.ts            ← Barrel: LoginPage, AuthProvider, useAuth, AuthGuard, authApi
       │   ├─ dashboard/               ← Dashboard feature (components, hooks, api) [Phase 4]
       │   │   └─ index.ts            ← Barrel: DashboardPage, LeaveBalanceCard, useDashboardStats, useRecentRequests
       │   ├─ layout/                  ← Layout feature (components, api)
       │   │   └─ index.ts            ← Barrel: AppLayout, AppSidebar, AppHeader, departmentsApi
       │   ├─ leave-requests/          ← Leave requests feature (api, components, hooks) [Phase 5]
       │   │   └─ index.ts            ← Barrel: LeaveNewPage, LeaveMyPage, TanStack Query hooks
       │   ├─ config/                 ← Config feature (api, partial) [Phase 5]
       │   │   └─ index.ts            ← Barrel: leaveTypesApi, configApi, LeaveTypeDto, ConfigDto
       │   └─ shared-reference-data/  ← Types & labels split from old lib/leave-data.ts
       ├─ components/                 ← App-level shared components (sidebar, header, etc.)
       ├─ pages/                      ← Route page components (6 pages still using Zustand)
       ├─ store/useStore              ← Zustand Store (data only, no auth) — partially migrated
       └─ api/                        ← Feature API modules (departments, leave-*)
            │
            ▼ GET/POST/PUT/DELETE /api/*
ASP.NET 10 FastEndpoints API
  ├─ JWT Bearer Authentication (Issuer, Audience, SigningKey from appsettings.json)
  ├─ ICurrentUserProvider (reads ClaimsPrincipal from JWT, returns CurrentUser record)
  ├─ Features/                     ← Vertical Slices (VSA {Action}{Role}.cs pattern)
  │   ├─ Auth/Me/, DevLogin/       Auth endpoints
  │   ├─ Departments/List/, Get/   department reference endpoints
  │   ├─ LeaveBalances/List/, My/  balance endpoints + seed helpers
  │   ├─ LeaveRequests/List, Create, Update, Approve, Reject, Cancel, My/  ← config-driven N-level approval
  │   │   ├─ LeaveRequestMapping.cs (shared DRY DTO mapping, includes ApprovedLevel)
  │   │   └─ LeaveRequestDto.cs (shared DTO)
  │   ├─ LeaveTypes/List, Create, Update, Delete/  ← Roles(AppRoles.Admin)
  │   ├─ SystemConfigs/Get, Update, GetLeaveConfigs, ReplaceLeaveConfigs/  ← system settings + approval config
  │   └─ Reports/Export/           ClosedXML .xlsx export
  ├─ Shared/                        ← Cross-cutting shared code
  │   ├─ Domain/                    ← Entities, domain services, helpers
  │   │   ├─ LeaveRequest.cs, LeaveType.cs, LeaveBalance.cs, ... (all domain entities)
  │   │   ├─ ApprovalHelper.cs, BusinessDayCalculator.cs       (domain logic)
  │   │   ├─ LeaveBalanceService.cs, ILeaveBalanceService.cs    (domain service)
  │   │   └─ LeaveBalanceSeeding.cs                              (seeding logic)
  │   ├─ Contracts/                 ← Shared response envelopes
  │   │   ├─ Result<T>             (success/error envelope)
  │   │   └─ PagedData<T>          (paginated list envelope)
  │   ├─ Groups/                    ← FastEndpoints route groups
  │   │   └─ AuthGroup, LeaveRequestGroup, LeaveTypeGroup, LeaveBalanceGroup, DepartmentGroup, SystemConfigGroup
  │   └─ Middleware/
  │       └─ CurrentUser.cs         (CurrentUser record)
  ├─ Infrastructure/
  │   └─ Auth/                      ← Auth infrastructure
  │       ├─ ICurrentUserProvider.cs, CurrentUserProvider.cs, Roles.cs (AppRoles constants)
  ├─ Data/AppDbContext              (EF Core 9 + SQL Server)
  │   ├─ System tables: USER_MASTER, DM_DONVI (ExcludeFromMigrations)
  │   └─ App tables: LeaveTypes, LeaveBalances, LeaveRequests (incl. ApprovedLevel), LeaveConfigs, SystemConfigs, LeaveRequestAudits
  └─ SQL Server (existing `VI_NGHIPHEP` database)
```

### Vertical Slice Architecture Pattern

```
┌─────────────────────────────────────────────────────────┐
│  Traditional Layered (N-tier)    │  Vertical Slice      │
│                                  │                      │
│  Controllers/                    │  Features/           │
│    AuthController.cs             │    Auth/             │
│    EmployeeController.cs         │      Login/          │
│    LeaveController.cs            │        LoginEndpoint │
│  Services/                       │        LoginRequest  │
│    AuthService.cs                │        LoginResponse │
│    EmployeeService.cs            │        LoginValidator│
│    LeaveService.cs               │      Exchange/       │
│  Repositories/                   │        ...           │
│    AuthRepo.cs                   │      Me/             │
│    EmployeeRepo.cs               │        ...           │
│    LeaveRepo.cs                  │    Employees/        │
│                                  │      List/           │
│  Cross-cutting changes touch     │        ...           │
│  all layers → high coupling      │      Create/         │
│                                  │        ...           │
│                                  │                      │
│                                  │  Each slice is self- │
│                                  │  contained → low     │
│                                  │  coupling, easy to   │
│                                  │  change independently│
└─────────────────────────────────────────────────────────┘
```

**Nguyên tắc chính**:
- Mỗi feature là một vertical slice khép kín: Endpoint + Request DTO + Response DTO + Validator + Mapper + Handler logic
- VSA file naming: `{Action}{Role}.cs` pattern (e.g., `CreateLeaveRequestEndpoint.cs`, `ListLeaveRequestsEndpoint.cs`)
- Data access qua EF Core DbContext (property injection `= null!;`), không có repository layer riêng, không có Data.cs classes
- Domain entities in `Shared/Domain/` (namespace: `QLNP.Api.Shared.Domain`), not in `Entities/`
- Auth infrastructure in `Infrastructure/Auth/` (namespace: `QLNP.Api.Infrastructure.Auth`), not in `Auth/`
- Cross-cutting concerns (current user resolution, response envelopes, route groups) nằm trong `Shared/` (Contracts, Groups, Middleware)
- Route groups in `Shared/Groups/` define URL prefixes per feature area
- Response envelopes: `Result<T>` (success/error) and `PagedData<T>` (paginated lists) in `Shared/Contracts/`
- Thêm feature mới = thêm endpoint files trong Features/, thêm route group trong Shared/Groups/, không đụng đến code hiện có

## Component Tree

```mermaid
graph TD
    App[app/App.tsx]
    App --> Providers[app/providers.tsx]
    Providers --> QCP[QueryClientProvider]
    QCP --> TP[TooltipProvider]
    TP --> Toaster
    TP --> AP[AuthProvider - features/auth]
    App --> Router[app/router.tsx]
    Router --> BR[BrowserRouter]
    BR --> LP[LoginPage /login - features/auth]
    BR --> AG[AuthGuard / - features/auth/hooks]
    AG --> AL[AppLayout - features/layout]
    AL --> AS[AppSidebar - features/layout]
    AL --> AH[AppHeader - features/layout]
    AL --> OUT[Outlet]
    OUT --> DP[DashboardPage - features/dashboard]
    OUT --> LNP[LeaveNewPage - features/leave-requests]
    OUT --> LMP[LeaveMyPage - features/leave-requests]
    OUT --> APV[ApprovalPage - pages/]
    OUT --> CP[CalendarPage - pages/]
    OUT --> SP[SummaryPage - pages/]
    OUT --> RP[ReportsPage - pages/]
    OUT --> VP[ViolationsPage - pages/]
    OUT --> CFP[ConfigPage - pages/]
    OUT --> NF[NotFound]

    DP --> DS[useDashboardStats - TanStack Query]
    DP --> DR[useRecentRequests - TanStack Query]
    DP --> LBC[LeaveBalanceCard]

    AS --> MenuItems[MenuItems filtered by user.role]
    AH --> BC[Breadcrumb]
    AH --> UserMenu[User Avatar + Dropdown]
```

## Data Flow

### Dashboard (TanStack Query -- migrated)

```mermaid
sequenceDiagram
    participant User as User (Browser)
    participant Component as DashboardPage
    participant Hook as useDashboardStats / useRecentRequests
    participant API as shared/api/client.ts
    participant FE as FastEndpoints Endpoint
    participant DbCtx as AppDbContext
    participant DB as SQL Server

    User->>Component: Navigate to /
    Component->>Hook: useDashboardStats() / useRecentRequests()
    Hook->>API: fetch("/api/leave-balances/my", ...)
    Note over API: client.ts in src/shared/api/
    API->>API: Attach JWT Authorization header
    API->>FE: HTTP Request
    FE->>FE: Resolve CurrentUser via ICurrentUserProvider
    FE->>DbCtx: EF Core query (LINQ)
    DbCtx->>DB: SQL
    DB-->>DbCtx: Result rows
    DbCtx-->>FE: Entities
    FE-->>API: JSON Response
    API-->>Hook: Response data (cached by TanStack Query)
    Hook-->>Component: Re-render with cached data
    Component-->>User: Updated UI
```

### Legacy Pages (Zustand Store -- not yet migrated)

```mermaid
sequenceDiagram
    participant User as User (Browser)
    participant Component as React Component
    participant Store as Zustand Store
    participant API as shared/api/client.ts
    participant FE as FastEndpoints Endpoint
    participant DbCtx as AppDbContext
    participant DB as SQL Server

    User->>Component: Form submit
    Component->>Store: action(payload)
    Store->>API: fetch("/api/leave-requests", { method: POST, body })
    Note over API: client.ts in src/shared/api/
    API->>API: Attach JWT Authorization header
    API->>FE: HTTP Request
    FE->>FE: Resolve CurrentUser via ICurrentUserProvider (claims)
    FE->>FE: FluentValidation (auto)
    FE->>DbCtx: EF Core query (LINQ)
    DbCtx->>DB: SQL
    DB-->>DbCtx: Result rows
    DbCtx-->>FE: Entities
    FE-->>API: JSON Response
    API-->>Store: Response data
    Store->>Store: set(state => newState)
    Store-->>Component: Re-render with new state
    Component-->>User: Updated UI
```

Note: 6 pages still use Zustand Store (Approval, Calendar, Summary, Reports, Violations, Config). Dashboard, LeaveNew, and LeaveMy pages have been migrated to TanStack Query.

## Database ERD

### System Tables (scaffolded, read-only, ExcludeFromMigrations)

**DM_DONVI** (22 properties): DonViId (PK), MaDonVi, TenDonVi, TenVietTat, DonViCapChaId, Cap, CapDonViId, LoaiDonViId, SoNha, DuongId, TinhThanhId, QuanHuyenId, PhuongXaId, DiaChiDayDu, DienThoai, Fax, Email, Website, MoTa, Used, Latitude, Longitude

**USER_MASTER** (9 properties + DonVi nav prop): UserMasterId (PK), UserName, HoTen, PhongBanId, DonViId, UserPortalId, CanBoId, LaDonViChinh, Used. Navigation: DonVi -> DM_DONVI

### QLNP Tables (Code First, managed by EF Core migrations)

```mermaid
erDiagram
    USER_MASTER ||--o{ LeaveRequests : "creates"
    USER_MASTER ||--o{ LeaveBalances : "has"
    USER_MASTER ||--o{ LeaveRequestAudits : "changes"
    DM_DONVI ||--o{ USER_MASTER : "belongs to"
    LeaveTypes ||--o{ LeaveRequests : "categorizes"
    LeaveTypes ||--o{ LeaveBalances : "tracks"
    LeaveTypes ||--o{ LeaveConfigs : "configured"
    LeaveTypes {
        bigint Id PK
        string Name "max 100"
        string Code UK "max 20"
        decimal DefaultDays "5,1"
        string Description
        bool IsActive
    }
    LeaveRequests {
        bigint Id PK
        bigint UserId FK
        bigint LeaveTypeId FK
        date StartDate
        date EndDate
        decimal TotalDays "5,1"
        string Reason
        string Status "max 20"
        int ApprovedLevel "default 0"
        bigint RequestedApproverId FK_nullable
        bigint ApprovedBy FK_nullable
        datetime2 ApprovedAt_nullable
        string RejectedReason_nullable
        datetime2 CreatedAt "default SYSUTCDATETIME"
        datetime2 UpdatedAt_nullable
    }
    USER_MASTER ||--o| LeaveRequests : "requested approver"
    LeaveRequests ||--o{ LeaveRequestAudits : "audited by"
    LeaveRequestAudits {
        bigint Id PK
        bigint LeaveRequestId FK
        bigint ChangedBy FK
        datetime2 ChangedAt
        string FieldName
        string OldValue
        string NewValue
    }
    LeaveBalances {
        bigint Id PK
        bigint UserId FK
        bigint LeaveTypeId FK
        int Year
        decimal TotalDays "5,1"
        decimal UsedDays "5,1"
    }
    LeaveConfigs {
        bigint Id PK
        bigint LeaveTypeId FK
        int ApprovalLevel "CK >= 1"
        string ApproverRole "max 10"
    }
    SystemConfigs {
        bigint Id PK
        string ConfigKey UK "max 50"
        string ConfigValue "max 100"
        string Description_nullable "max 200"
        datetime2 UpdatedAt
    }
```

### Seed Data
- LeaveTypes: NPN (12 days), NO (30 days), NVR (3 days), NKL (0 days), NTS (180 days) -- seeded via `HasData` in `AppDbContext.OnModelCreating`
- LeaveConfigs: 9 rows seeded via `HasData` establishing the initial approval-level baseline per LeaveType. This baseline is required so `MigrateLegacyStatusesAsync` can correctly calculate max approval levels per LeaveType at startup. The `SystemConfigs/ReplaceLeaveConfigs` endpoint can overwrite these rows at runtime.

  | LeaveTypeId (Code) | ApprovalLevel | ApproverRole |
  |---------------------|---------------|--------------|
  | 1 (NPN)             | 1             | LD.PCM       |
  | 1 (NPN)             | 2             | GD.PGD       |
  | 2 (NO)              | 1             | LD.PCM       |
  | 2 (NO)              | 2             | GD.PGD       |
  | 3 (NVR)             | 1             | LD.PCM       |
  | 3 (NVR)             | 2             | GD.PGD       |
  | 4 (NKL)             | 1             | LD.PCM       |
  | 5 (NTS)             | 1             | LD.PCM       |
  | 5 (NTS)             | 2             | GD.PGD       |

- SystemConfigs: 8 rows seeded via `HasData` providing configurable system settings. Overwritable at runtime via `PUT /api/system-configs` (QTHT-only).

  | Id | ConfigKey | ConfigValue | Description |
  |----|-----------|-------------|-------------|
  | 1  | max_annual_leave | 12 | So ngay phep nam toi da |
  | 2  | min_request_days | 1 | So ngay toi thieu khi tao don |
  | 3  | max_carry_over | 5 | So ngay phep chuyen sang nam sau |
  | 4  | leave_cycle | yearly | Chu ky tinh phep |
  | 5  | default_days_CB.PCM | 14 | Mac dinh CB.PCM |
  | 6  | default_days_LD.PCM | 14 | Mac dinh LD.PCM |
  | 7  | default_days_GD.PGD | 16 | Mac dinh GD.PGD |
  | 8  | default_days_QTHT | 12 | Mac dinh QTHT |

- LeaveBalances: seeded on startup for active `USER_MASTER` users and lazily during `/leave-balances` reads. NPN TotalDays uses role-based defaults from SystemConfigs (`default_days_{role}`); correction applied for unused NPN balances that differ from role default
- Roles: resolved from JWT claims; dev-login maps known test users to roles. `UserRoles` table was dropped.

## Authentication Flow

### JWT Bearer Auth via SSO Portal (production)

```mermaid
sequenceDiagram
    participant Host as SSO Portal (host)
    participant R as React SPA (iframe)
    participant API as FastEndpoints API
    participant DB as SQL Server

    Note over Host,DB: User already authenticated on SSO Portal
    Host->>R: postMessage({ type: "auth", token: jwt })
    R->>R: features/auth/contexts stores JWT in localStorage
    R->>API: GET /api/auth/me (Bearer JWT)
    API->>API: JWT validation + ICurrentUserProvider reads claims
    API->>DB: Lookup USER_MASTER; roles come from JWT claims
    API-->>R: { userId, displayName, roles, ... }
    R->>R: AuthState updated, app rendered
```

### Dev Mode (standalone)

```mermaid
sequenceDiagram
    participant Dev as Developer Browser
    participant API as FastEndpoints API

    Note over Dev,API: JWT Bearer allows anonymous for /api/auth/me in dev
    Dev->>API: GET /api/auth/me (no JWT / anonymous)
    API->>API: ICurrentUserProvider fallback (userId=1, roles=["QTHT"])
    API-->>Dev: { userId: 1, displayName: "admin", roles: ["QTHT"] }
```

**Note**: Login form removed. Authentication delegated to SSO Portal which issues JWT. The API validates JWT via symmetric key (Jwt:SigningKey in appsettings.json). ICurrentUserProvider reads ClaimsPrincipal, no longer uses gateway headers or CurrentUserMiddleware.

## Approval Workflow (Config-Driven N-Level)

```mermaid
stateDiagram-v2
    [*] --> pending: Employee submits (ApprovedLevel=0)
    pending --> pending_partial: Approver at level N approves (ApprovedLevel=N, N < maxLevel)
    pending --> approved: Approver at maxLevel approves (ApprovedLevel=maxLevel, balance deducted)
    pending --> rejected: Any approver rejects
    pending_partial --> pending_partial: Next level approves (ApprovedLevel++)
    pending_partial --> approved: Final level approves (balance deducted)
    pending_partial --> rejected: Any approver rejects
    pending --> cancelled: Employee cancels (ApprovedLevel < maxLevel)
    pending_partial --> cancelled: Employee cancels (ApprovedLevel < maxLevel)
    approved --> [*]: Final approved
    rejected --> [*]: Final rejected
    cancelled --> [*]: Final cancelled

    note right of pending_partial: Status stays "pending", ApprovedLevel tracks progress
    note right of approved: Balance deducted only on final approval
```

**Design decisions:**
- `ApprovedLevel = 0` = no approvals (pending)
- `ApprovedLevel = maxLevel` = fully approved (status = approved)
- Status values: `pending | approved | rejected | cancelled` (no more approved_leader/approved_director)
- OR logic per level: any configured approver role can advance the request
- Scope: LD.PCM can only approve requests from same department (not own); GD.PGD has no scope restriction
- Balance deduction only on final approval (ApprovedLevel == maxLevel)
- `ApprovalHelper.cs` (in `Shared/Domain/`) provides shared logic: GetApprovalFlow, CanApproveAtLevel, GetMaxLevel, GetNextLevelRoles

## Deployment Architecture

```mermaid
graph TD
    subgraph "Static Hosting (Vercel / Netlify / Nginx)"
        SPA[React SPA static files]
    end
    subgraph "Application Server (IIS)"
        RP[Reverse Proxy / IIS ARR]
        API[ASP.NET 10 + FastEndpoints]
        AUTH[JWT Bearer Auth + ICurrentUserProvider]
    end
    subgraph "Database Server"
        DB[SQL Server - VI_NGHIPHEP]
    end
    subgraph "External"
        Host[SSO Portal with iframe]
    end
    subgraph "User"
        Browser[Browser]
    end

    Browser -->|HTTPS| SPA
    Browser -->|HTTPS + Bearer JWT| RP
    RP -->|JWT validated| API
    Host -->|postMessage JWT| SPA
    API --> AUTH
    AUTH --> DB
```

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **FastEndpoints** thay vì Minimal API | Mỗi endpoint là 1 class riêng (REPR pattern) → dễ test, dễ maintain, pipeline behaviors rõ ràng (Validator → PreProcessor → Handler → PostProcessor) |
| **EF Core** thay vì Dapper | Type-safe LINQ queries, migrations built-in, change tracking. Phù hợp khi làm việc với DB có sẵn (scaffold system tables + Code First app tables) |
| **JWT Bearer Auth** thay vì gateway headers | SSO Portal issues JWT, app nhận qua postMessage (iframe) hoặc Authorization header. API validates JWT via symmetric key. ICurrentUserProvider reads claims → CurrentUser record. Đã bỏ CurrentUserMiddleware và gateway headers |
| **ExcludeFromMigrations** cho system tables | USER_MASTER, DM_DONVI là các bảng có sẵn của hệ thống khác. Không được phép thay đổi schema. EF Core chỉ đọc dữ liệu |
| **Vertical Slice Architecture** thay vì N-tier | Code tổ chức theo feature, không theo layer kỹ thuật. VSA `{Action}{Role}.cs` file naming. Thêm/sửa feature = làm việc trong endpoint files, không lan sang các layer khác → giảm coupling, tăng cohesion. Property injection (`= null!;`) thay vì constructor injection; Data.cs classes eliminated |
| Zustand store (partial migration) | Data-only state management for legacy pages. Auth state in `features/auth/contexts/`. Dashboard migrated in Phase 4; LeaveNewPage and LeaveMyPage migrated in Phase 5. 6 pages still consume Zustand store (Approval, Calendar, Summary, Reports, Violations, Config). Full migration planned (Phases 6-12) |
| TanStack Query for server state | Dashboard uses TanStack Query hooks for data fetching with automatic caching. Will replace Zustand store for all remaining pages in subsequent VSA migration phases |
| Role-based sidebar (not route guards) | SPA UX: all routes mounted, navigation elements hidden by role. `AppSidebar` in `features/layout/`. Simple and effective for intranet |
| Business days calculation (date-fns) | Standard for government/education leave tracking |
| shadcn/ui (Radix primitives) | Production-ready accessible components, customizable via CSS variables |
| No SSR | Intranet app behind auth, no SEO needed. SPA is simpler to deploy and maintain |
| pnpm monorepo | `packages/api` (.NET 10) + `packages/web` (React SPA). Shared tooling, single repo |
