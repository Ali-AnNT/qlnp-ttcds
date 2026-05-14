# Project Management Report: .NET Migration 10-Day Plan

**Date:** 2026-05-13 02:21 UTC
**Source:** brainstorm-260512-0906-standalone-dotnet-migration.md
**Branch:** rebuid-bundle
**Plan dir:** plans/260513-0221-dotnet-migration-refactor/

## Summary

Lập kế hoạch 10 ngày làm việc (2 tuần) refactor QLNP-TTCDS: bỏ Supabase, chuyển sang .NET 9 Minimal API + SQL Server, hỗ trợ standalone + iframe embed.

## Work Breakdown

| Day | Focus | Files Created | Files Modified | Est. hrs |
|-----|-------|---------------|----------------|----------|
| 1 | .NET scaffold + DB schema | 7 | 0 | 8 |
| 2 | Auth + Employee/Dept APIs | 7 | 0 | 8 |
| 3 | Leave APIs (types, requests, balances) | 5 | 0 | 8 |
| 4 | Config API + seed + password migration | 5 | 0 | 8 |
| 5 | Frontend API client layer | 8 | 0 | 8 |
| 6 | AuthContext + refactor Zustand store | 2 | 2 | 8 |
| 7 | Page refactor P1 (5 pages) | 0 | 5 | 8 |
| 8 | Page refactor P2 (5 pages + layout) | 0 | 8 | 8 |
| 9 | Embed mode + remove Supabase | 2 | 4 | 8 |
| 10 | Testing, integration, docs | 0 | 6-8 | 8 |

**Total:** ~34 files created, ~25 files modified, ~1 file deleted (supabase/)

## Deliverables per Phase

### Backend (.NET 9)
- 16 API endpoints (auth: 3, employee: 5, department: 5, leave-type: 4, leave-request: 8, balance: 3, config: 2, health: 1)
- JWT dual-mode auth (own + host issuer)
- SQL Server 6 tables schema
- Dapper data access
- BCrypt password hashing
- Seed data: 4 depts, 10 employees, 3 leave types, sample requests

### Frontend (React)
- 8 API client modules
- fetch wrapper with JWT intercept
- AuthContext replacing Supabase auth
- Refactored Zustand store → API calls
- All 13 pages updated
- Embed mode: postMessage bridge, auto-resize

### Removed
- `@supabase/supabase-js` package
- `src/integrations/supabase/` (463 lines)
- All Supabase env vars

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Password migration plaintext → BCrypt | Day 4 dedicated migrate script |
| UUID ↔ UNIQUEIDENTIFIER mismatch | Sequential GUIDs, test early (Day 1) |
| Approval 2-level state machine | Day 3 explicit state transitions |
| Host JWT unknown public key | Day 2 configurable, Day 9 test |
| Frontend regression after refactor | Day 10 manual E2E + vitest suite |

## Resolved Questions

| # | Question | Answer | Impact |
|---|----------|--------|--------|
| 1 | SQL Server connection string? | Đã có | Khởi tạo thẳng |
| 2 | Host JWT validation? | Gateway đã check → BE chỉ check auth nội bộ | Bỏ dual-issuer, đơn giản hóa auth |
| 3 | SSL cert cho JWT? | Chưa cần | Dev với symmetric key |
| 4 | Seed data mẫu? | Chưa cần | Tạo tối thiểu để test |
| 5 | Deploy target? | IIS | Cấu hình web.config, IIS hosting model
