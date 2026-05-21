---
phase: 4
title: "Day 4 — LeaveRequests P2 (Approve/Reject/Cancel)"
status: completed
priority: P0
effort: "1d"
dependencies: [3]
completed_date: 2026-05-19
---

# Phase 04: Day 4 — LeaveRequests P2

## Overview

Implement LeaveRequests feature slice Phase 2: Approve, Reject, Cancel endpoints.

**Completed 2026-05-19.** Detailed sub-plan: [LeaveRequests P2](../260515-0839-day4-leave-requests-p2/plan.md)

## Endpoints Implemented

| Method | Path | Auth | ICurrentUser |
|--------|------|------|:---:|
| POST | `/api/leave-requests/{id}/approve` | LD.PCM, GD.PGD | ✅ |
| POST | `/api/leave-requests/{id}/reject` | LD.PCM, GD.PGD | ✅ |
| POST | `/api/leave-requests/{id}/cancel` | CB.PCM, LD.PCM | ✅ |

## Key Business Logic

- **Approve**: LD.PCM → `approved_leader` (same-dept check, self-deny), GD.PGD → `approved_director` (deducts from balance)
- **Reject**: LD.PCM reject `pending`, GD.PGD reject `approved_leader`. Requires reason.
- **Cancel**: owner-scoped, only `pending` or `approved_leader` status

## Code Files

- `Features/LeaveRequests/Approve/Endpoint.cs`, `Data.cs`, `Models.cs`
- `Features/LeaveRequests/Reject/Endpoint.cs`, `Data.cs`, `Models.cs`
- `Features/LeaveRequests/Cancel/Endpoint.cs`, `Data.cs`, `Models.cs`

## Verification (from sub-plan)

- [x] AC-007: LD.PCM duyệt → status = approved_leader, approved_by = LD id
- [x] AC-008: GD.PGD duyệt → status = approved_director, used_days tăng
- [x] AC-009: Từ chối + lý do → status = rejected
- [x] AC-010: Owner hủy đơn pending → status = cancelled
- [x] AC-011: LD.PCM không approve đơn phòng khác → 403
- [x] AC-012: used_days cập nhật đúng sau approved_director

## Deferred

- BRULE-003 ngoại lệ 1 cấp (skip-level approval) → needs LeaveConfigs slice ready

## Commit

`a004ebd feat(api): LeaveRequests P2 - Approve/Reject/Cancel (#5)`

## Next Steps

→ Phase 05: [Day 5 — LeaveBalances + Config + Departments](phase-05-day5-balances-config-departments.md)