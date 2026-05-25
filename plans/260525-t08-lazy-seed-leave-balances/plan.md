---
title: "T-08: Lazy Seed LeaveBalances - Phương án C"
description: "Auto-seed LeaveBalance records lazily when users access leave balances, ensuring 'Ngày phép còn lại' always shows correct data instead of 0"
status: complete
priority: P2
branch: "plans/t01-t05-implementation-plans"
tags: [leave-balances, bug-fix, backend, frontend]
blockedBy: []
blocks: []
created: "2026-05-25T04:02:40.491Z"
createdBy: "ck:plan"
source: skill
---

# T-08: Lazy Seed LeaveBalances - Phương án C

## Problem

"Ngày phép còn lại" luôn hiển thị 0 vì bảng `LeaveBalances` trống hoàn toàn. `LeaveBalance` chỉ được tạo khi GĐ phê duyệt đơn (`approved_leader` → `approved_director`), nên trước khi bất kỳ đơn nào được duyệt, user không thấy ngày phép.

Root cause: `RemainingDays = TotalDays - UsedDays` được tính từ DB, nhưng chưa có balance record → API trả `[]` → frontend reduce = 0.

## Solution: Lazy Seed + Frontend Fallback

**Backend (C)**: Khi API `/leave-balances/my` hoặc `/leave-balances` được gọi, nếu user chưa có balance cho loại phép isActive nào trong năm hiện tại → tự động tạo balance với `TotalDays = LeaveType.DefaultDays`, `UsedDays = 0`.

**Seed script**: Tạo balance cho 4 users đã có role QLNP.

**Frontend (A-minimal)**: Fallback hiển thị khi API chưa trả data (loading state).

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Seed Logic](./phase-01-seed-logic.md) | Complete |
| 2 | [Seed Script](./phase-02-seed-script.md) | Complete |
| 3 | [Frontend Fallback](./phase-03-frontend-fallback.md) | Complete |
| 4 | [Verification](./phase-04-verification.md) | Complete |

## Key Files

- `packages/api/Features/LeaveBalances/My/Data.cs` — primary change
- `packages/api/Features/LeaveBalances/List/Data.cs` — secondary change
- `packages/api/Features/LeaveBalances/My/Endpoint.cs` — inject LeaveTypes
- `packages/api/Features/LeaveBalances/List/Endpoint.cs` — inject LeaveTypes
- `packages/web/src/pages/DashboardPage.tsx` — frontend display
- `packages/web/src/pages/SummaryPage.tsx` — admin summary
- `packages/api/Program.cs` — DI registration
- NEW: `packages/api/Features/LeaveBalances/Seed/Data.cs` — shared seed logic

## Dependencies

- No cross-plan dependencies
- DB has unique index `(UserId, LeaveTypeId, Year)` — supports upsert pattern