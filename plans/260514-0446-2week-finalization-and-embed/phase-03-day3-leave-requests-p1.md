---
phase: 3
title: "Day 3 — LeaveRequests P1 (List/My/Create/Update)"
status: completed
priority: P0
effort: "1d"
dependencies: [2]
completed_date: 2026-05-18
---

# Phase 03: Day 3 — LeaveRequests P1

## Overview

Implement LeaveRequests feature slice Phase 1: List, My, Create, Update endpoints theo Vertical Slice Pattern.

**Completed 2026-05-18.** Detailed sub-plan: [LeaveRequests P1](../260515-0233-day3-leave-requests-p1/plan.md)

## Endpoints Implemented

| Method | Path | Auth | ICurrentUser |
|--------|------|------|:---:|
| GET | `/api/leave-requests` | Any auth | ❌ |
| GET | `/api/leave-requests/my` | Any auth | ✅ |
| POST | `/api/leave-requests` | CB.PCM, LD.PCM | ✅ |
| PUT | `/api/leave-requests/{id}` | CB.PCM, LD.PCM | ✅ |

## Key Business Logic

- **Create**: validates business days >= 1, checks date overlap with existing approved requests
- **Update**: owner-scoped, pending-only, re-validates business days + overlap (excludes self)
- **List**: returns all requests (any authenticated) — ⚠️ no role/dept scoping (known issue)
- **My**: returns current user's own requests only

## Code Files

- `Features/LeaveRequests/List/Endpoint.cs`, `Data.cs`, `Models.cs`
- `Features/LeaveRequests/My/Endpoint.cs`, `Data.cs`, `Models.cs`
- `Features/LeaveRequests/Create/Endpoint.cs`, `Data.cs`, `Models.cs`, `Mapper.cs`
- `Features/LeaveRequests/Update/Endpoint.cs`, `Data.cs`, `Models.cs`, `Mapper.cs`
- `Features/LeaveRequests/LeaveRequestDto.cs`, `LeaveRequestMapping.cs`
- `Features/LeaveRequests/BusinessDayCalculator.cs` (shared utility)

## Known Issues

- `GET /api/leave-requests` không filter theo role/phòng → CB.PCM xem được tất cả đơn (vi phạm BRD)

## Commit

`4d419e2 feat(api): Leave Requests P1 + Auto Migration (#4)`

## Next Steps

→ Phase 04: [Day 4 — LeaveRequests P2 (Approve/Reject/Cancel)](phase-04-day4-leave-requests-p2.md)