---
title: "Day 3 — LeaveRequests P1 (List/Create/Update)"
status: complete
priority: P0
effort: "1d"
branch: feat/leave-requests-p1
created: 2026-05-15
blockedBy: []
blocks: [260515-0839-day4-leave-requests-p2]
blocks: []
source:
  - docs/vision/brd.md
  - docs/vision/srs.md
  - docs/vision/tasks.md
  - plans/reports/brainstorm-260515-0233-day3-leave-requests.md
---

# Plan: Day 3 — LeaveRequests P1

## Mục tiêu

Implement 3 endpoints LeaveRequests P1 theo Vertical Slice Pattern, thêm `RequestedApproverId` migration, và `BusinessDayCalculator` utility dùng chung.

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Setup: Migration + Shared Utilities](phase-01-setup-migration-and-shared.md) | complete | 30m |
| 2 | [List Endpoint](phase-02-list-endpoint.md) | complete | 30m |
| 3 | [Create Endpoint](phase-03-create-endpoint.md) | complete | 45m |
| 4 | [Update Endpoint](phase-04-update-endpoint.md) | complete | 30m |
| 5 | [Build + Smoke Test](phase-05-build-and-smoke-test.md) | complete | 15m |

## Key Decisions (từ Brainstorm)

- **List scope**: CB.PCM=own, LD.PCM=toàn phòng (PhongBanId), GD.PGD/QTHT=all
- **Overlap check**: chỉ với `approved_leader` + `approved_director` (BRULE-002)
- **RequestedApproverId**: nullable `long`, thêm EF migration ngay
- **BusinessDays**: server-side utility, không tin client
- **Role strings**: tuân theo BRD — `CB.PCM`, `LD.PCM`, `GD.PGD`, `QTHT` (đổi từ "nhanvien"/"lanhdao"/"quantri" cũ)
- **Seed migration**: thêm role entries vào `UserRoles` cho dev/testing

## Dependencies

- `CurrentUserProvider` (Day 1 ✅)
- `LeaveTypes` entity + table (Day 2 ✅)
- `AppDbContext` (InitialCreate migration ✅)
