# System Architecture - QLNP-TTCDS

## Supabase Prototype (DEPRECATED)

```
Browser (React SPA)
    |
    | HTTPS (REST + RPC)
    v
Supabase (Backend-as-a-Service)
    |--- PostgreSQL Database
    |--- Row Level Security (RLS)
    |--- SECURITY DEFINER RPC Functions
```

**Status**: Removed. Replaced by .NET API + SQL Server in Phase 1 migration.

## Current Architecture (Phase 1): .NET 9 + EF Core + Gateway Auth

### High-Level

```
Host Website (SSO Portal)
  └─ iframe ─ React SPA (Vite)
       ├─ AuthContext (JWT in localStorage + postMessage)
       ├─ Zustand Store (data only, no auth)
       └─ api/client.ts (fetch + Bearer JWT)
            │
            ▼ GET/POST/PUT/DELETE /api/*
ASP.NET 9 FastEndpoints API
  ├─ CurrentUserMiddleware (gateway headers: X-User-Id, X-User-Name, X-User-FullName)
  │   └─ Dev mode fallback (userId=1, role=quantri)
  ├─ Features/                     ← Vertical Slices (endpoints WIP)
  │   ├─ Auth/Me/                  MeEndpoint (scaffolded)
  │   ├─ Config/Get, Update, UserRole/
  │   ├─ LeaveBalances/List, My/
  │   ├─ LeaveRequests/List, Create, Update, Approve, Reject, Cancel/
  │   └─ LeaveTypes/List, Create, Update, Delete/
  ├─ Data/AppDbContext              (EF Core 9 + SQL Server)
  │   ├─ System tables: USER_MASTER, DM_DONVI (ExcludeFromMigrations)
  │   └─ App tables: UserRoles, LeaveTypes, LeaveBalances, LeaveRequests, LeaveConfigs
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
- Mỗi feature là một vertical slice khép kín: Endpoint + Request DTO + Response DTO + Validator + Handler logic
- Data access qua EF Core DbContext (DI inject), không có repository layer riêng
- Cross-cutting concerns (current user resolution, DB connection, logging) nằm trong middleware hoặc shared utilities
- Thêm feature mới = thêm 1 folder trong Features/, không đụng đến code hiện có

## Component Tree

```mermaid
graph TD
    App[App.tsx]
    App --> QCP[QueryClientProvider]
    QCP --> TP[TooltipProvider]
    TP --> AP[AuthProvider - AuthContext]
    AP --> BR[BrowserRouter]
    BR --> LP[LoginPage /login]
    BR --> AG[AuthGuard /]
    AG --> AL[AppLayout]
    AL --> AS[AppSidebar]
    AL --> AH[AppHeader]
    AL --> OUT[Outlet]
    OUT --> DP[DashboardPage]
    OUT --> LNP[LeaveNewPage]
    OUT --> LMP[LeaveMyPage]
    OUT --> APV[ApprovalPage]
    OUT --> CP[CalendarPage]
    OUT --> SP[SummaryPage]
    OUT --> RP[ReportsPage]
    OUT --> VP[ViolationsPage]
    OUT --> CFP[ConfigPage]
    OUT --> NF[NotFound]

    AS --> MenuItems[MenuItems filtered by user.role]
    AH --> BC[Breadcrumb]
    AH --> UserMenu[User Avatar + Dropdown]
```

## Data Flow

```mermaid
sequenceDiagram
    participant User as User (Browser)
    participant Component as React Component
    participant Store as Zustand Store
    participant API as api/client.ts
    participant FE as FastEndpoints Endpoint
    participant DbCtx as AppDbContext
    participant DB as SQL Server

    User->>Component: Form submit
    Component->>Store: action(payload)
    Store->>API: fetch("/api/leave-requests", { method: POST, body })
    API->>API: Attach JWT Authorization header
    API->>FE: HTTP Request
    FE->>FE: Resolve CurrentUser from HttpContext.Items
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

    Note over FE,DB: Mỗi endpoint handler dùng AppDbContext qua DI injection
```

## Database ERD

### System Tables (scaffolded, read-only, ExcludeFromMigrations)

**DM_DONVI** (22 properties): DonViId (PK), MaDonVi, TenDonVi, TenVietTat, DonViCapChaId, Cap, CapDonViId, LoaiDonViId, SoNha, DuongId, TinhThanhId, QuanHuyenId, PhuongXaId, DiaChiDayDu, DienThoai, Fax, Email, Website, MoTa, Used, Latitude, Longitude

**USER_MASTER** (9 properties): UserMasterId (PK), UserName, HoTen, PhongBanId, DonViId, UserPortalId, CanBoId, LaDonViChinh, Used

### QLNP Tables (Code First, managed by EF Core migrations)

```mermaid
erDiagram
    USER_MASTER ||--o{ UserRoles : "has role"
    USER_MASTER ||--o{ LeaveRequests : "creates"
    USER_MASTER ||--o{ LeaveBalances : "has"
    DM_DONVI ||--o{ USER_MASTER : "belongs to"

    UserRoles {
        bigint UserId PK_FK
        string Role "max 10"
    }
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
        bigint ApprovedBy FK_nullable
        datetime2 ApprovedAt_nullable
        string RejectedReason_nullable
        datetime2 CreatedAt "default SYSUTCDATETIME"
        datetime2 UpdatedAt_nullable
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
```

### Seed Data
- LeaveTypes: `annual` (12 days), `sick` (0 days), `personal` (3 days)
- UserRoles: userId=1, role="quantri"

## Authentication Flow

### Gateway Auth via SSO Portal (current)

```mermaid
sequenceDiagram
    participant Host as SSO Portal (host)
    participant R as React SPA (iframe)
    participant API as FastEndpoints API
    participant DB as SQL Server

    Note over Host,DB: User already authenticated on SSO Portal
    Host->>R: postMessage({ type: "auth", token: jwt })
    R->>R: AuthContext stores JWT in localStorage
    R->>API: GET /api/auth/me (Bearer JWT)
    API->>API: CurrentUserMiddleware reads gateway headers
    API->>DB: Lookup USER_MASTER + UserRoles
    API-->>R: { userId, userName, fullName, donViId, role }
    R->>R: AuthState updated, app rendered
```

### Dev Mode (standalone)

```mermaid
sequenceDiagram
    participant Dev as Developer Browser
    participant API as FastEndpoints API

    Note over Dev,API: DevMode:Enabled = true, no gateway headers
    Dev->>API: GET /api/auth/me (any/no JWT)
    API->>API: CurrentUserMiddleware fallback (userId=1, role=quantri)
    API-->>Dev: { userId: 1, userName: "admin", fullName: "Administrator", role: "quantri" }
```

**Note**: Login form removed. Authentication delegated to SSO Portal. The API trusts gateway headers from the reverse proxy/IIS (X-User-Id, X-User-Name, X-User-FullName).

## Approval Workflow

```mermaid
stateDiagram-v2
    [*] --> pending: Employee submits request
    pending --> approved_leader: LD.PCM approves (level 1)
    pending --> rejected: LD.PCM / GD.PGD rejects
    approved_leader --> approved_director: GD.PGD approves (level 2)
    approved_leader --> rejected: GD.PGD rejects
    pending --> cancelled: Employee cancels
    approved_leader --> cancelled: Employee cancels
    approved_director --> [*]: Final approved
    rejected --> [*]: Final rejected
    cancelled --> [*]: Final cancelled

    note right of approved_leader: Only if approval_config has level=2
    note right of pending: Status set to "pending"
```

## Deployment Architecture

```mermaid
graph TD
    subgraph "Static Hosting (Vercel / Netlify / Nginx)"
        SPA[React SPA static files]
    end
    subgraph "Application Server (IIS)"
        RP[Reverse Proxy / IIS ARR]
        API[ASP.NET 9 + FastEndpoints]
        MW[CurrentUserMiddleware]
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
    Browser -->|HTTPS| RP
    RP -->|gateway headers| API
    Host -->|postMessage JWT| SPA
    API --> MW
    MW --> DB
```

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **FastEndpoints** thay vì Minimal API | Mỗi endpoint là 1 class riêng (REPR pattern) → dễ test, dễ maintain, pipeline behaviors rõ ràng (Validator → PreProcessor → Handler → PostProcessor) |
| **EF Core** thay vì Dapper | Type-safe LINQ queries, migrations built-in, change tracking. Phù hợp khi làm việc với DB có sẵn (scaffold system tables + Code First app tables) |
| **Gateway Header Auth** thay vì JWT login | Hệ thống đã có SSO Portal. API đọc gateway headers (X-User-Id, X-User-Name, X-User-FullName) từ reverse proxy → không cần quản lý password hay JWT generation |
| **ExcludeFromMigrations** cho system tables | USER_MASTER, DM_DONVI là các bảng có sẵn của hệ thống khác. Không được phép thay đổi schema. EF Core chỉ đọc dữ liệu |
| **Vertical Slice Architecture** thay vì N-tier | Code tổ chức theo feature, không theo layer kỹ thuật. Thêm/sửa feature = làm việc trong 1 folder, không lan sang các layer khác → giảm coupling, tăng cohesion |
| Single Zustand store | Data-only state management. Auth state moved to React Context. Limited state surface area for intranet app |
| Role-based sidebar (not route guards) | SPA UX: all routes mounted, navigation elements hidden by role. Simple and effective for intranet |
| Business days calculation (date-fns) | Standard for government/education leave tracking |
| shadcn/ui (Radix primitives) | Production-ready accessible components, customizable via CSS variables |
| No SSR | Intranet app behind auth, no SEO needed. SPA is simpler to deploy and maintain |
| pnpm monorepo | `packages/api` (.NET 9) + `packages/web` (React SPA). Shared tooling, single repo |
