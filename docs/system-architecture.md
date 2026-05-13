# System Architecture - QLNP-TTCDS

## High-Level Architecture

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

## Data Flow

```mermaid
sequenceDiagram
    participant User as User (Browser)
    participant Component as React Component
    participant Store as Zustand Store
    participant Supabase as Supabase Client
    participant PG as PostgreSQL

    User->>Component: Form submit
    Component->>Store: action(payload)
    Store->>Supabase: supabase.from("table").insert(data)
    Supabase->>PG: SQL INSERT/UPDATE/SELECT
    PG-->>Supabase: Result row
    Supabase-->>Store: { data, error }
    Store->>Store: set(state => newState)
    Store-->>Component: Re-render with new state
    Component-->>User: Updated UI

    Note over Store,PG: RPC for verify_login bypasses REST, calls SQL function directly
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

## Authentication Flow

```mermaid
sequenceDiagram
    participant User as User Browser
    participant Login as LoginPage
    participant Store as useStore
    participant RPC as Supabase RPC
    participant DB as PostgreSQL

    User->>Login: Enter username + password
    Login->>Store: login(username, password)
    Store->>RPC: supabase.rpc("verify_login", {p_username, p_password})
    RPC->>DB: SELECT * FROM employees WHERE username=$1 AND password_hash=hash($2)
    DB-->>RPC: Employee row
    RPC-->>Store: [{ employee_id, emp_full_name, emp_role, ... }]
    Store->>DB: SELECT department_id FROM employees WHERE id = employee_id
    DB-->>Store: department_id
    Store->>Store: set({ currentUser })
    Store->>DB: loadData() - fetch all reference data
    Store-->>Login: return true
    Login->>User: navigate("/")

    Note over RPC,DB: verify_login is SECURITY DEFINER function - runs with owner privileges
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

## Deployment Architecture

```mermaid
graph TD
    subgraph "Hosting (Vercel / Netlify / Static)"
        SPA[Static SPA files]
    end
    subgraph "Supabase Cloud"
        PG[PostgreSQL 15]
        API[REST API]
        Auth[Auth Service]
    end
    subgraph "User"
        Browser[Browser]
    end

    Browser -->|HTTPS| SPA
    Browser -->|HTTPS| API
    API --> PG
    SPA -->|VITE_SUPABASE_URL env var| API
```

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Single Zustand store | Simple app, limited state surface area. Avoids prop drilling and context explosion |
| Supabase as sole backend | No dedicated API server needed. PostgreSQL + RLS + RPC handles all business logic |
| Role-based sidebar (not route guards) | SPA UX: all routes mounted, navigation elements hidden by role. Simple and effective for intranet |
| Business days calculation (date-fns) | Standard for government/education leave tracking. differenceInBusinessDays handles Vietnamese weekends automatically if locale configured |
| shadcn/ui (Radix primitives) | Production-ready accessible components, customizable via CSS variables |
| No SSR | Intranet app behind auth, no SEO needed. SPA is simpler to deploy and maintain |
| Password stored as hash in employees table | Custom auth via SECURITY DEFINER RPC. Not using Supabase Auth for simplicity in internal context |
