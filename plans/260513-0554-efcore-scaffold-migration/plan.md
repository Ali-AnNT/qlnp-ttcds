---
title: "QLNP .NET 9 + EF Core + Scaffold Migration"
description: "Migration QLNP từ Supabase sang .NET 9 + FastEndpoints + EF Core + SQL Server, scaffold USER_MASTER + DM_DONVI, Code First cho bảng mới"
status: completed
priority: P0
branch: "rebuid-bundle"
tags: [dotnet, fastendpoints, efcore, sqlserver, scaffold, code-first]
blockedBy: []
blocks: []
supersedes: ["260513-0221-dotnet-migration-refactor"]
created: "2026-05-13T05:55:40.452Z"
createdBy: "ck:plan"
source: skill
---

# QLNP .NET 9 + EF Core + Scaffold Migration

## Overview

Migration QLNP-TTCDS từ Supabase BaaS → .NET 9 + FastEndpoints + Vertical Slice Architecture + EF Core + SQL Server.

**Phát hiện quan trọng:** SQL Server hiện có `USER_MASTER` (82 users) và `DM_DONVI` (144 đơn vị) → scaffold 2 bảng này thay vì tạo mới `employees` + `departments`.

## Key Architecture Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | **EF Core** (not Dapper) | Code First, migration management, type safety |
| 2 | **Scaffold** USER_MASTER + DM_DONVI | Tận dụng bảng có sẵn, không duplicate |
| 3 | **bigint PK** (not UUID) | Đồng bộ với hệ thống cũ |
| 4 | **API Gateway SSO** | Gateway validate trước, API chỉ đọc user từ headers |
| 5 | **5 bảng QLNP** (not 6) | Bỏ employees + departments |
| 6 | Exclude bảng cũ khỏi migration | Chỉ quản lý bảng mới qua EF migrations |

## Architecture

```
Browser → API Gateway (SSO validate) → QLNP.Api (FastEndpoints + EF Core) → SQL Server
  │                                        │
  └── Headers: X-User-Id, ...              ├── Entities/ (scaffold + Code First)
                                           ├── Features/ (VSA endpoints)
                                           ├── Data/AppDbContext.cs
                                           └── Middleware/CurrentUserMiddleware.cs
```

## Database

- **Scaffold (read from DB):** USER_MASTER, DM_DONVI
- **Code First (EF managed):** user_roles, leave_types, leave_balances, leave_requests, leave_config

## Phases

| Phase | Name | Status | Effort | Priority |
|-------|------|--------|--------|----------|
| 1 | [Scaffold Project & EF Core Setup](./phase-01-scaffold-project-ef-core-setup.md) | ✅ Done | 1h | P0 |
| 2 | [Scaffold Existing Tables & Entities](./phase-02-scaffold-existing-tables-entities.md) | ✅ Done | 1h | P0 |
| 3 | [Create QLNP Entities & Migration](./phase-03-create-qlnp-entities-migration.md) | ✅ Done | 2h | P0 |
| 4 | [Core Middleware & Program.cs](./phase-04-core-middleware-program-cs.md) | ✅ Done | 1h | P0 |
| 5 | [Frontend API Layer Refactor](./phase-05-frontend-api-layer-refactor.md) | ✅ Done | 3h | P1 |
| 6 | [Auth & Store Refactor](./phase-06-auth-store-refactor.md) | ✅ Done | 2h | P1 |
| 7 | [Page Refactor P1](./phase-07-page-refactor-p1.md) | ✅ Done | 3h | P1 |
| 8 | [Page Refactor P2](./phase-08-page-refactor-p2.md) | ✅ Done | 3h | P1 |
| 9 | [Embed Mode & Cleanup](./phase-09-embed-mode-cleanup.md) | ✅ Done | 2h | P2 |
| 10 | [Testing & Documentation](./phase-10-testing-documentation.md) | ✅ Done | 2h | P2 |

## Key Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| EF Core v10 pulled instead of v9 | Build fail | Pin version 9.0.x |
| Scaffold tạo entity không mong muốn | Dư thừa entity | Chỉ scaffold USER_MASTER + DM_DONVI, `--table` flag |
| Gateway headers chưa xác định | Middleware placeholder | Code configurable header names |
| Migration include bảng cũ | EF cố quản lý bảng hệ thống | Exclude trong OnModelCreating |

## Source Docs

- `docs/vision/brd.md` — Business Requirements
- `docs/vision/srs.md` — Software Requirements
- `docs/code-standards.md` — Code conventions
- `docs/system-architecture.md` — TO-BE architecture
- `plans/reports/brainstorm-260513-0543-existing-system-schema-design.md` — Design decisions
