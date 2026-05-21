---
title: "2-Week Finalization: Migration Supabase → .NET + Embed/Token"
status: in-progress
priority: P0
effort: large
branch: toanhv/add-apis-for-qlnp
created: 2026-05-14
start: 2026-05-14
end: 2026-05-27
blockedBy: []
source:
  - docs/vision/brd.md
  - docs/vision/srs.md
  - docs/vision/tasks.md
---

# Plan: 2-Week Finalization — .NET Migration + Embed/Token

## Mục tiêu

1. Implement 17 FastEndpoints theo VSP (hiện 0/17 file `.cs`)
2. Bỏ Supabase hoàn toàn (`packages/web/supabase/`, deps)
3. Embed/Token: postMessage từ host → `/api/auth/me` → dashboard

## Trạng thái hiện tại (updated 2026-05-20)

| Hạng mục | Status |
|----------|--------|
| API scaffold + EF Core + Entities | ✅ Done |
| System tables read-only | ✅ Done |
| JWT Bearer Authentication | ✅ Done |
| `ICurrentUserProvider` + `CurrentUserProvider` | ✅ Done |
| Frontend `api/client.ts` + AuthContext | ✅ Done |
| Features/ folder structure | ✅ Done |
| **Backend Endpoints (19 implemented)** | ✅ Done — see route map below |
| CSP `frame-ancestors` middleware | ✅ Done |
| **Auth/Me missing RequireAuthorization** | ⚠️ Bug — no auth guard on GET /api/auth/me |
| **LeaveRequests/List too permissive** | ⚠️ Bug — CB.PCM sees ALL requests, no dept filter |
| **10/19 endpoints missing try/catch** | ⚠️ Risk — DB errors → raw 500 |
| Dev mode token input UI | ❌ Pending |
| Supabase folder cleanup | ❌ Pending |
| Tests | ❌ Pending |

## API Route Map (Actual — 19 endpoints)

| # | Method | Path | Auth | ICurrentUser | Error Handling |
|---|--------|------|------|:---:|---|
| 1 | GET | `/api/auth/me` | ⚠️ NONE | ✅ | InvalidOperationException → 401 |
| 2 | GET | `/api/config` | Any auth | ❌ | None |
| 3 | PUT | `/api/config` | QLNP.QTHT | ❌ | DbUpdateException → 409 |
| 4 | GET | `/api/config/user-role/{id}` | QLNP.QTHT | ❌ | Null check → 404 |
| 5 | GET | `/api/departments/{id}` | Any auth | ❌ | None |
| 6 | GET | `/api/departments` | Any auth | ❌ | None |
| 7 | GET | `/api/leave-balances` | GD.PGD, QTHT, LD.PCM | ❌ | None |
| 8 | GET | `/api/leave-balances/my` | Any auth | ✅ | None |
| 9 | POST | `/api/leave-requests/{id}/approve` | LD.PCM, GD.PGD | ✅ | DbUpdateException → 409 |
| 10 | POST | `/api/leave-requests/{id}/cancel` | CB.PCM, LD.PCM | ✅ | DbUpdateException → 409 |
| 11 | POST | `/api/leave-requests` | CB.PCM, LD.PCM | ✅ | DbUpdateException → 409 |
| 12 | GET | `/api/leave-requests` | ⚠️ Any auth (too permissive) | ❌ | None |
| 13 | GET | `/api/leave-requests/my` | Any auth | ✅ | None |
| 14 | POST | `/api/leave-requests/{id}/reject` | LD.PCM, GD.PGD | ✅ | DbUpdateException → 409 |
| 15 | PUT | `/api/leave-requests/{id}` | CB.PCM, LD.PCM | ✅ | DbUpdateException → 409 |
| 16 | POST | `/api/leave-types` | QTHT | ❌ | DbUpdateException → 409 |
| 17 | DELETE | `/api/leave-types/{id}` | QTHT | ❌ | None |
| 18 | GET | `/api/leave-types` | Any auth | ❌ | None |
| 19 | PUT | `/api/leave-types/{id}` | QTHT | ❌ | None |

## Known Issues (from audit 2026-05-20)

| # | Issue | Severity | Affected Endpoints |
|---|-------|----------|-------------------|
| 1 | Auth/Me no `RequireAuthorization()` | HIGH | `/api/auth/me` |
| 2 | LeaveRequests/List no role/dept scoping | HIGH | `/api/leave-requests` |
| 3 | Missing try/catch → raw 500 on DB errors | MED | 10 of 19 endpoints |
| 4 | Connection string hardcoded in AppDbContextFactory | MED | Design-time only |
| 5 | CurrentUserProvider silent-fail on missing claims | MED | All ICurrentUser users |
| 6 | No ILogger usage anywhere | LOW | All endpoints |
| 7 | Missing security headers (X-Content-Type-Options, etc.) | LOW | Global |

## Phases

| Phase | Day | Nội dung | Status |
|-------|-----|----------|--------|
| [01](phase-01-day1-auth-me-endpoint.md) | Day 1 (14/5) | Auth/Me endpoint + CSP + smoke test | ✅ completed |
| [02](phase-02-day2-leave-types.md) | Day 2 (15/5) | LeaveTypes slice (4 endpoints) | ✅ completed |
| [03](phase-03-day3-leave-requests-p1.md) | Day 3 (18/5) | LeaveRequests List/Create/Update + My | ✅ completed |
| [04](phase-04-day4-leave-requests-p2.md) | Day 4 (19/5) | LeaveRequests Approve/Reject/Cancel | ✅ completed |
| [05](phase-05-day5-balances-config-departments.md) | Day 5 (20/5) | LeaveBalances + Config + Departments | ✅ completed |
| [06](phase-06-day6-fix-known-issues.md) | Day 6 (21/5) | Fix known issues (auth guard, scoping, error handling) | ❌ pending |
| [07](phase-07-day7-dev-token-ui.md) | Day 7 (22/5) | Dev token input UI (frontend) | ❌ pending |
| [08](phase-08-day8-embed-host-sample.md) | Day 8 (25/5) | Embed host sample + docs | ❌ pending |
| [09](phase-09-day9-supabase-cleanup.md) | Day 9 (26/5) | Supabase cleanup + integration testing | ❌ pending |
| [10](phase-10-day10-tests-docs-release.md) | Day 10 (27/5) | Unit tests + docs + release | ❌ pending |

> **Note:** Phase 06 was originally "Dev token input UI" but shifted to fix known issues first (security bugs > features). Dev token UI moves to Phase 07.

## Refs

- BRD: [docs/vision/brd.md](../../docs/vision/brd.md)
- SRS: [docs/vision/srs.md](../../docs/vision/srs.md)
- Tasks: [docs/vision/tasks.md](../../docs/vision/tasks.md)
- Sub-plans: [LeaveRequests P1](../260515-0233-day3-leave-requests-p1/plan.md), [LeaveRequests P2](../260515-0839-day4-leave-requests-p2/plan.md)