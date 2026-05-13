---
title: Standalone .NET Migration - 10-Day Refactor Plan
status: pending
priority: P0
effort: xlarge
branch: rebuid-bundle
tags: [dotnet, migration, refactor, sqlserver, api]
created: 2026-05-13
source: plans/reports/brainstorm-260512-0906-standalone-dotnet-migration.md
---

## Overview

Refactor QLNP từ Supabase sang .NET 9 Minimal API + SQL Server, hỗ trợ standalone + embed mode. Giữ nguyên UI/UX, refactor dần frontend.

**Timeline:** 10 working days (2 tuần)

## Daily Progress

| Day | Phase | Tasks | Status |
|-----|-------|-------|--------|
| 1 | Setup + DB | Scaffold .NET project, SQL Server schema, Dapper | [ ] |
| 2 | Auth + Core APIs | JWT auth (single issuer), Employee/Department APIs, IIS config | [ ] |
| 3 | Leave APIs | Leave Types, Leave Requests, Leave Balances APIs | [ ] |
| 4 | Config + Seed + Migration | Config API, seed data, password migration | [ ] |
| 5 | Frontend API Layer | 8 API client files + fetch wrapper | [ ] |
| 6 | Auth + Store | AuthContext JWT, refactor Zustand store | [ ] |
| 7 | Page Refactor P1 | Dashboard, Login, LeaveNew, LeaveMy, Calendar | [ ] |
| 8 | Page Refactor P2 | Approval, Summary, Reports, Violations, Config | [ ] |
| 9 | Embed Mode | postMessage, host JWT exchange, iframe support | [ ] |
| 10 | Integration + Docs | Testing, cleanup Supabase, docs update | [ ] |

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Gateway handles host auth → BE only internal JWT | Đơn giản hóa, bỏ dual-issuer, bỏ /api/auth/exchange |
| Deploy IIS (Windows) | In-process hosting, web.config |
| Symmetric JWT key (dev) | Chưa cần SSL cert |
| Seed data tối thiểu | Tạo đủ để test |

## Key Risks

- Password migration: Supabase plaintext → BCrypt
- UUID → UNIQUEIDENTIFIER mapping
- Approval workflow 2-level state machine
- IIS deployment: web.config, app pool config
