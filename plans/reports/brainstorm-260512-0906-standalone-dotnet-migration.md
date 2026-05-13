# Brainstorm: Standalone Embed + Supabase → .NET Migration

## Problem

Nhúng app QLNP vào website khác, bỏ Supabase, chuyển sang SQL Server + .NET backend.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend style | Minimal API + Dapper | Nhẹ, ít boilerplate, user preference |
| Auth mode | Dual: tự login (standalone) + nhận JWT từ host (embed) | Linh hoạt 2 chế độ |
| Frontend strategy | Refactor dần, giữ UI/UX | Giảm risk, giữ nguyên giao diện |
| Supabase | Bỏ hoàn toàn | Xóa package, xóa integrations/supabase/ |

## Architecture

```
Host Website
  └─ iframe ─ React App
       ├─ AuthContext (JWT: own or host)
       ├─ Zustand Store
       └─ api/client.ts (fetch + JWT intercept)
            │
            ▼ POST/GET /api/*
ASP.NET Minimal API (.NET 9)
  ├─ JwtMiddleware (own + host issuer)
  ├─ Dapper ──► SQL Server
  └─ Services: AuthService, LeaveService, BalanceService
```

### DB Migration: PostgreSQL → SQL Server

| PG Type | SQL Server Type |
|---------|-----------------|
| UUID | UNIQUEIDENTIFIER |
| TEXT | NVARCHAR(MAX) |
| TIMESTAMPTZ | DATETIME2 |
| NUMERIC(5,1) | DECIMAL(5,1) |
| BOOLEAN | BIT |

6 tables: departments, employees, leave_types, leave_balances, leave_requests, leave_config.

### API Endpoints

```
POST /api/auth/login           # username + pw → JWT
POST /api/auth/exchange        # host JWT → app JWT
GET  /api/auth/me              # current user

GET/POST /api/departments
PUT/DELETE /api/departments/{id}

GET/POST /api/employees
PUT/DELETE /api/employees/{id}

GET/POST /api/leave-types
PUT/DELETE /api/leave-types/{id}

GET/POST /api/leave-requests           # role-based filtering
PUT /api/leave-requests/{id}           # approve/reject
DELETE /api/leave-requests/{id}        # cancel

GET /api/leave-balances
GET /api/leave-balances/my

GET /api/config
PUT /api/config/{key}
```

### Frontend API Layer

```
src/api/
├── client.ts            # fetch wrapper: JWT attach, 401 handler, base URL
├── auth-api.ts          # login(), exchangeToken(), getMe()
├── employee-api.ts      # getAll(), getById(), create(), update(), delete()
├── department-api.ts    # getAll(), getById(), create(), update(), delete()
├── leave-type-api.ts    # getAll(), create(), update(), delete()
├── leave-request-api.ts # getAll(), create(), update(), approve(), reject()
├── leave-balance-api.ts # getAll(), getMy()
└── config-api.ts        # getAll(), update()

src/auth/auth-context.tsx  # JWT store, token refresh, host postMessage listener
src/store/useStore.ts      # refactor: supabase → api/*
```

## Phases

| # | Phase | Tasks | Priority |
|---|-------|-------|----------|
| 1 | .NET Backend + SQL Server | 12-15 | P0 |
| 2 | Frontend refactor (bỏ Supabase) | 6-8 | P1 |
| 3 | Standalone embedding | 5-7 | P2 |

## Key Risks

- **Password migration**: Supabase lưu plaintext → phải BCrypt hash lại toàn bộ khi migrate
- **UUID mapping**: UNIQUEIDENTIFIER có thể khác format với PG UUID
- **Approval workflow**: 2 cấp LD.PCM → GD.PGD, phải test kỹ state machine
- **Host JWT validation**: Cần public key endpoint từ host để validate token

## Unresolved

- Host website public key / JWKS endpoint có sẵn không?
- SQL Server instance đã có hay cần setup mới?
- Cần seed data mẫu như Supabase không?
