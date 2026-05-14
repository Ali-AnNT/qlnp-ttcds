---
title: .NET 9 FastEndpoints + Vertical Slice Architecture Migration
status: pending
priority: P0
effort: xlarge
branch: rebuid-bundle
tags: [dotnet, fastendpoints, vertical-slice, sqlserver, dapper]
created: 2026-05-13
updated: 2026-05-13
source:
  - plans/reports/brainstorm-260512-0906-standalone-dotnet-migration.md
  - docs/vision/brd.md
  - docs/vision/srs.md
---

## Overview

Refactor QLNP từ Supabase sang .NET 9 + FastEndpoints + Vertical Slice Architecture + SQL Server. Hỗ trợ standalone login + embed mode (iframe) với dual-issuer JWT. Giữ nguyên UI/UX, refactor dần frontend.

**Timeline:** 10 working days (2 tuần)

**Architecture Pattern:** Vertical Slice — code tổ chức theo feature (Login, CreateLeave, ApproveLeave...) thay vì layer ngang (Controllers/Services/Repositories). Mỗi slice là một folder chứa Endpoint + Request + Response + Validator, tự quản lý data access qua Dapper. Không tách Service/Repository layer riêng (YAGNI) — logic nghiệp vụ nằm trong endpoint handler.

**API Framework:** FastEndpoints — REPR pattern (Request-EndPoint-Response), mỗi endpoint là class kế thừa `Endpoint<TRequest, TResponse>`. Pipeline: `Validator → PreProcessor → HandleAsync() → PostProcessor → Response`.

**File naming convention (C#):** PascalCase cho tất cả C# files: `LoginEndpoint.cs`, `CreateLeaveRequestEndpoint.cs`. Mỗi class 1 file riêng.

## Daily Progress

| Day | Phase | VSA Folders / Scope | Status |
|-----|-------|---------------------|--------|
| 1 | Setup + DB | Scaffold `Features/` + `Auth/` + `Data/`, SQL Server schema, Dapper, FastEndpoints | [ ] |
| 2 | Auth Slices | `Features/Auth/Login/`, `Exchange/`, `Me/` — dual-issuer JWT (HS256+RS256), BCrypt, JwtMiddleware | [ ] |
| 3 | Employee + Dept Slices | `Features/Employees/{List,GetById,Create,Update,Delete}/`, tương tự `Departments/` | [ ] |
| 4 | Leave Slices | `Features/LeaveTypes/{List,Create,Update,Delete}/`, `LeaveRequests/{List,Create,Update,Approve,Reject,Cancel}/`, `LeaveBalances/{List,My}/` | [ ] |
| 5 | Config + Seed | `Features/Config/{Get,Update,GetGeneral}/`, Health, seed data, password migration | [ ] |
| 6 | Frontend API Layer | Fetch wrapper + 6 API modules, `exchangeToken()` cho embed | [ ] |
| 7 | Auth + Store | AuthContext JWT (standalone + exchange), refactor Zustand → API calls | [ ] |
| 8 | Page Refactor P1 | Dashboard, Login, LeaveNew, LeaveMy, Calendar | [ ] |
| 9 | Page Refactor P2 | Approval, Summary, Reports, Violations, Config, AppLayout | [ ] |
| 10 | Embed Mode | Iframe detection, postMessage bridge (auth + resize), remove Supabase | [ ] |
| 11 | Test + Docs + Review | Integration test, docs update, final review, PR | [ ] |

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| **FastEndpoints** thay vì Minimal API | Mỗi endpoint là 1 class (REPR) → dễ test, pipeline rõ ràng, FluentValidation tích hợp sẵn |
| **Vertical Slice Architecture** thay vì N-tier | Code theo feature, không theo layer kỹ thuật. Thêm/sửa feature = làm trong 1 folder. Giảm coupling, tăng cohesion |
| **Dual-issuer JWT** (own HS256 + host RS256) | BE tự xử lý cả 2 chế độ auth. Host gửi JWT qua postMessage → exchange token. Không phụ thuộc gateway |
| Dapper (không EF Core) | SQL thuần, kiểm soát hiệu năng. Phù hợp team quen SQL |
| BCrypt hash password (cost 12) | Thay thế plaintext Supabase, đạt chuẩn bảo mật |
| SQL Server UNIQUEIDENTIFIER | Map từ PostgreSQL UUID, dùng NEWSEQUENTIALID() cho PK |
| Frontend API layer (fetch, không SDK) | Tách biệt backend, type-safe generics, JWT intercept tự động |

## VSA Feature Structure

```
backend/QlnpApi/Features/
├── Auth/
│   ├── Login/LoginEndpoint.cs         (POST /api/auth/login)
│   ├── Exchange/ExchangeEndpoint.cs   (POST /api/auth/exchange)
│   └── Me/MeEndpoint.cs               (GET /api/auth/me)
├── Employees/
│   ├── List/ListEmployeesEndpoint.cs   (GET /api/employees)
│   ├── Create/CreateEmployeeEndpoint.cs(POST /api/employees)
│   ├── Update/UpdateEmployeeEndpoint.cs(PUT /api/employees/{id})
│   └── Delete/DeleteEmployeeEndpoint.cs(DELETE /api/employees/{id})
├── Departments/
│   ├── List/ListDepartmentsEndpoint.cs
│   ├── Create/CreateDepartmentEndpoint.cs
│   ├── Update/UpdateDepartmentEndpoint.cs
│   └── Delete/DeleteDepartmentEndpoint.cs
├── LeaveTypes/
│   ├── List/ListLeaveTypesEndpoint.cs
│   ├── Create/CreateLeaveTypeEndpoint.cs
│   ├── Update/UpdateLeaveTypeEndpoint.cs
│   └── Delete/DeleteLeaveTypeEndpoint.cs
├── LeaveRequests/
│   ├── List/ListLeaveRequestsEndpoint.cs      (role-based filtering)
│   ├── Create/CreateLeaveRequestEndpoint.cs   (overlap + balance check)
│   ├── Update/UpdateLeaveRequestEndpoint.cs   (pending only)
│   ├── Approve/ApproveLeaveRequestEndpoint.cs (state machine)
│   ├── Reject/RejectLeaveRequestEndpoint.cs
│   └── Cancel/CancelLeaveRequestEndpoint.cs
├── LeaveBalances/
│   ├── List/ListLeaveBalancesEndpoint.cs
│   └── My/MyLeaveBalanceEndpoint.cs
└── Config/
    ├── Get/GetConfigEndpoint.cs
    └── Update/UpdateConfigEndpoint.cs
```

**Shared (cross-cutting):**
- `Data/DbConnectionFactory.cs` — SQL Server IDbConnection
- `Middleware/JwtMiddleware.cs` — Validate token từ 2 issuer
- `Auth/JwtService.cs` — Generate + validate JWT

## Endpoint Template (FastEndpoints REPR)

```csharp
// LoginRequest.cs — record DTO
// LoginResponse.cs — record DTO
// LoginValidator.cs — FluentValidation rules
// LoginEndpoint.cs — Endpoint<LoginRequest, LoginResponse>
//   Configure(): Post("/api/auth/login"), AllowAnonymous()
//   HandleAsync(): BCrypt verify → JWT generate → SendAsync(response)
```

## Key Risks

| Risk | Mitigation |
|------|------------|
| Password migration: Supabase plaintext → BCrypt | Script export users, BCrypt hash từng password, verify sau migrate |
| UUID → UNIQUEIDENTIFIER mapping | SQL type mapping table, verify row count từng bảng |
| Approval 2-level state machine | Unit test state transitions, verify trong e2e |
| Dual-issuer JWT validation | Middleware check `iss` claim → route đến validator tương ứng |
| Host public key endpoint availability | Fallback: nếu host key unavailable, embed mode redirect → standalone login |

## Related Docs

- `docs/vision/brd.md` — Business Requirements (migration plan)
- `docs/vision/srs.md` — Software Requirements (TO-BE architecture)
- `docs/system-architecture.md` — TO-BE architecture diagrams
- `docs/code-standards.md` — .NET + FastEndpoints coding conventions
- `docs/project-roadmap.md` — Migration phases & timeline
