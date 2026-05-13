# System Architecture - QLNP-TTCDS

## Current Architecture (AS-IS)

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

## Target Architecture (TO-BE): FastEndpoints + Vertical Slice Architecture

### High-Level

```
Host Website (optional)
  └─ iframe ─ React SPA (Vite)
       ├─ AuthContext (JWT: own + host)
       ├─ Zustand Store
       └─ api/client.ts (fetch + JWT intercept)
            │
            ▼ POST/GET /api/*
ASP.NET 9 FastEndpoints API
  ├─ JwtMiddleware (own issuer HS256 + host issuer RS256)
  ├─ Features/                 ← Vertical Slices
  │   ├─ Auth/Login/           LoginEndpoint + Request + Response + Validator
  │   ├─ Auth/Exchange/        ExchangeEndpoint
  │   ├─ Auth/Me/              MeEndpoint
  │   ├─ Employees/            List/Create/Update/Delete
  │   ├─ Departments/          List/Create/Update/Delete
  │   ├─ LeaveRequests/        List/Create/Update/Approve/Reject/Cancel
  │   ├─ LeaveBalances/        List/My
  │   └─ Config/               Get/Update
  ├─ Data/DbConnectionFactory  (SQL Server IDbConnection)
  └─ SQL Server
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
- Mỗi feature là một vertical slice khép kín: Endpoint + Request DTO + Response DTO + Validator + Handler logic + Data access
- Không có Controllers, Services, Repositories layer dùng chung — mỗi slice tự quản lý data access qua Dapper
- Cross-cutting concerns (JWT validation, DB connection, logging) nằm trong middleware hoặc shared utilities
- Thêm feature mới = thêm 1 folder trong Features/, không đụng đến code hiện có

## Component Tree

```mermaid
graph TD
    App[App.tsx]
    App --> QCP[QueryClientProvider]
    QCP --> TP[TooltipProvider]
    TP --> BR[BrowserRouter]
    BR --> LP[LoginPage /login]
    BR --> AG[AuthGuard /]
    AG --> AL[AppLayout]
    AL --> AS[AppSidebar]
    AL --> AH[AppHeader]
    AL --> OUT[Outlet]
    OUT --> DP[DashboardPage]
    OUT --> LNP[LeaveNewPage]
    OUT --> LMP[LeaveMyPage]
    OUT --> AP[ApprovalPage]
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

## Data Flow (TO-BE)

```mermaid
sequenceDiagram
    participant User as User (Browser)
    participant Component as React Component
    participant Store as Zustand Store
    participant API as api/client.ts
    participant FE as FastEndpoints Endpoint
    participant DB as SQL Server

    User->>Component: Form submit
    Component->>Store: action(payload)
    Store->>API: fetch("/api/leave-requests", { method: POST, body })
    API->>API: Attach JWT Authorization header
    API->>FE: HTTP Request
    FE->>FE: FluentValidation (auto)
    FE->>FE: PreProcessor (optional)
    FE->>DB: Dapper query
    DB-->>FE: Result rows
    FE->>FE: PostProcessor (optional)
    FE-->>API: JSON Response
    API-->>Store: Response data
    Store->>Store: set(state => newState)
    Store-->>Component: Re-render with new state
    Component-->>User: Updated UI

    Note over FE,DB: Mỗi endpoint handler tự quản lý data access qua Dapper
```

## Database ERD

```mermaid
erDiagram
    departments ||--o{ employees : "has"
    departments {
        uuid id PK
        string name
        string code
    }
    employees ||--o{ leave_requests : "creates"
    employees ||--o{ leave_balances : "has"
    employees {
        uuid id PK
        uuid department_id FK
        string username UK
        string password_hash
        string full_name
        string job_title
        app_role role
        string phone
        string email
        bool is_active
    }
    leave_types ||--o{ leave_requests : "categorizes"
    leave_types ||--o{ leave_balances : "tracks"
    leave_types ||--o{ approval_config : "configured"
    leave_types {
        uuid id PK
        string name
        string code UK
        number default_days
        string description
        bool is_active
    }
    leave_requests {
        uuid id PK
        uuid employee_id FK
        uuid leave_type_id FK
        date start_date
        date end_date
        number total_days
        string reason
        string status
        uuid approved_by FK
        timestamp approved_at
        string rejected_reason
    }
    leave_balances {
        uuid id PK
        uuid employee_id FK
        uuid leave_type_id FK
        number year
        number total_days
        number used_days
    }
    approval_config {
        uuid id PK
        uuid leave_type_id FK
        number approval_level
        app_role approver_role
    }
    leave_config {
        uuid id PK
        string config_key UK
        string config_value
        string description
    }
```

## Authentication Flow (TO-BE)

```mermaid
sequenceDiagram
    participant User as User Browser
    participant Login as LoginPage
    participant API as api/client.ts
    participant FE as FastEndpoints LoginEndpoint
    participant DB as SQL Server

    User->>Login: Enter username + password
    Login->>API: POST /api/auth/login { username, password }
    API->>FE: HTTP Request
    FE->>FE: LoginValidator (FluentValidation)
    FE->>DB: SELECT * FROM employees WHERE username=@user
    DB-->>FE: Employee row (password_hash)
    FE->>FE: BCrypt.Verify(password, password_hash)
    FE->>FE: Generate JWT (HS256, exp=8h)
    FE-->>API: { token, profile }
    API->>API: AuthContext.setToken(token)
    API-->>Login: Success
    Login->>User: navigate("/")

    Note over FE,DB: BCrypt hash verification + JWT generation replaces plaintext comparison
```

### Embed Auth Flow (TO-BE)

```mermaid
sequenceDiagram
    participant Host as Host Website
    participant R as React SPA (iframe)
    participant FE as FastEndpoints ExchangeEndpoint

    Host->>R: postMessage({ type: "auth", token: hostJWT })
    R->>R: AuthContext listener receives token
    R->>FE: POST /api/auth/exchange { hostJWT }
    FE->>FE: Validate host JWT (RS256 public key)
    FE->>FE: Find/verify employee by host claims
    FE->>FE: Generate app JWT (HS256)
    FE-->>R: { token, profile }
    R->>R: AuthContext.setToken(token)
    R-->>R: Auto-authenticated, no login form
```

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

## Deployment Architecture (TO-BE)

```mermaid
graph TD
    subgraph "Static Hosting (Vercel / Netlify / Nginx)"
        SPA[React SPA static files]
    end
    subgraph "Application Server (IIS / Docker / Cloud Run)"
        API[ASP.NET 9 + FastEndpoints]
        MW[JwtMiddleware]
    end
    subgraph "Database Server"
        DB[SQL Server]
    end
    subgraph "External"
        Host[Host Website with iframe]
    end
    subgraph "User"
        Browser[Browser]
    end

    Browser -->|HTTPS| SPA
    Browser -->|HTTPS| API
    Host -->|postMessage JWT| SPA
    API --> MW
    MW --> DB
```

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **FastEndpoints** thay vì Minimal API | Mỗi endpoint là 1 class riêng (REPR pattern) → dễ test, dễ maintain, pipeline behaviors rõ ràng (Validator → PreProcessor → Handler → PostProcessor) |
| **Vertical Slice Architecture** thay vì N-tier | Code tổ chức theo feature, không theo layer kỹ thuật. Thêm/sửa feature = làm việc trong 1 folder, không lan sang các layer khác → giảm coupling, tăng cohesion |
| Dapper thay vì EF Core | Viết SQL thuần, kiểm soát hiệu năng truy vấn. Phù hợp với team quen SQL |
| Single Zustand store | Simple app, limited state surface area. Avoids prop drilling and context explosion |
| Role-based sidebar (not route guards) | SPA UX: all routes mounted, navigation elements hidden by role. Simple and effective for intranet |
| Business days calculation (date-fns) | Standard for government/education leave tracking |
| shadcn/ui (Radix primitives) | Production-ready accessible components, customizable via CSS variables |
| No SSR | Intranet app behind auth, no SEO needed. SPA is simpler to deploy and maintain |
| BCrypt hash + JWT auth | Replaces plaintext Supabase auth. JWT với 2 issuer (own + host) hỗ trợ cả standalone và embed mode |
