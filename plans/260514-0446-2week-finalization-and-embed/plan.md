---
title: "2-Week Finalization: Migration Supabase → .NET + Embed/Token"
status: in-progress
priority: P0
effort: large
branch: feat/efcore-migration-net9-fastendpoints
created: 2026-05-14
start: 2026-05-14
end: 2026-05-27
blockedBy: [260514-0713-jwt-auth-currentuser-provider]
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

## Trạng thái khởi điểm

| Hạng mục | Status |
|----------|--------|
| API scaffold + EF Core + Entities | ✅ Done |
| System tables read-only | ✅ Done |
| `CurrentUserMiddleware` + dev fallback | ✅ Done |
| Frontend `api/client.ts` + AuthContext | ✅ Done |
| Features/ folder structure (empty) | ✅ Done |
| **Backend Endpoints (17)** | ❌ 0% — Blocker |
| CSP `frame-ancestors` middleware | ❌ Pending |
| Dev mode token input UI | ❌ Pending |
| Supabase folder cleanup | ❌ Pending |
| Tests | ❌ Pending |

## Phases

| Phase | Day | Nội dung | Status |
|-------|-----|----------|--------|
| [01](phase-01-day1-auth-me-endpoint.md) | Day 1 (14/5) | Auth/Me endpoint + CSP + smoke test | pending |
| [02](phase-02-day2-leave-types.md) | Day 2 (15/5) | LeaveTypes slice (4 endpoints) | pending |
| [03](phase-03-day3-leave-requests-p1.md) | Day 3 (18/5) | LeaveRequests List/Create/Update | pending |
| [04](phase-04-day4-leave-requests-p2.md) | Day 4 (19/5) | LeaveRequests Approve/Reject/Cancel | pending |
| [05](phase-05-day5-balances-config.md) | Day 5 (20/5) | LeaveBalances + Config slices | pending |
| [06](phase-06-day6-dev-token-ui.md) | Day 6 (21/5) | Dev token input UI (frontend) | pending |
| [07](phase-07-day7-embed-host-sample.md) | Day 7 (22/5) | Embed host sample + docs | pending |
| [08](phase-08-day8-supabase-removal.md) | Day 8 (25/5) | Supabase cleanup | pending |
| [09](phase-09-day9-integration-testing.md) | Day 9 (26/5) | Integration E2E testing + bug fixes | pending |
| [10](phase-10-day10-tests-docs-release.md) | Day 10 (27/5) | Unit tests + docs + release | pending |

## Refs

- BRD: [docs/vision/brd.md](../../docs/vision/brd.md)
- SRS: [docs/vision/srs.md](../../docs/vision/srs.md)
- Tasks: [docs/vision/tasks.md](../../docs/vision/tasks.md)
