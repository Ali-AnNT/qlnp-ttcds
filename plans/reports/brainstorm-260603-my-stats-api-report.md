# Brainstorm Report: My Stats API

**Date**: 2026-06-03  
**Status**: Approved  
**Branch**: feat/update-deploy-cjs-ttcds-preset

## Problem Statement

Dashboard hiện tại tính 4 con số (ngày phép còn lại, đơn pending, đơn approved, tổng ngày nghỉ) hoàn toàn client-side — fetch ALL leave-requests + leave-balances rồi aggregate. Không scale, không hiệu quả, và frontend phải gọi 3+ endpoints để hiển thị 4 con số.

Cần thêm 1 API endpoint server-side trả về 4 con số này cho current user.

## Requirements (Confirmed)

| # | Metric | Field | Source | Type |
|---|--------|-------|--------|------|
| 1 | Ngày phép còn lại | `remainingDays` | LeaveBalance SUM(TotalDays - UsedDays) current year | decimal |
| 2 | Đơn đang chờ duyệt | `pendingCount` | LeaveRequest COUNT WHERE Status=pending | int |
| 3 | Đơn đã duyệt | `approvedCount` | LeaveRequest COUNT WHERE Status=approved | int |
| 4 | Tổng ngày đã nghỉ | `usedDays` | LeaveBalance SUM(UsedDays) current year | decimal |

**Scope**: Current user only, current year only. Route: `GET /api/my-stats`.

## Evaluated Approaches

### A. New endpoint `GET /api/my-stats` ✅ CHOSEN
- Pros: Clean separation, single call, explicit contract, auto-seed balance
- Cons: New group + endpoint files

### B. Extend `/api/leave-balances/my`
- Pros: Less code
- Cons: Mixed concerns, different response shape, breaks SRP

### C. Two endpoints (balance + request counts)
- Pros: More RESTful per-resource
- Cons: Over-engineering for 4 numbers, 2 calls instead of 1

## Final Design

### Architecture

```
GET /api/my-stats → MyStatsEndpoint
                     ├── MyStatsGroup (prefix: "api/my-stats")
                     ├── MyStatsRequest (empty — UserId from JWT)
                     └── MyStatsResponse {
                           remainingDays: decimal,
                           pendingCount:  int,
                           approvedCount: int,
                           usedDays:      decimal
                         }
```

### DB Queries (2 queries, 1 endpoint)

1. `SELECT SUM(TotalDays), SUM(UsedDays) FROM LeaveBalances WHERE UserId=@me AND Year=@currentYear`
2. `SELECT Status, COUNT(*) FROM LeaveRequests WHERE UserId=@me GROUP BY Status` → extract pending + approved counts

### File Structure

```
packages/api/Features/
├── MyStats/
│   ├── MyStatsEndpoint.cs      ← Endpoint logic
│   └── MyStatsResponse.cs      ← Response DTO
├── Shared/Groups/
│   └── MyStatsGroup.cs         ← Route prefix "api/my-stats"
```

### Edge Cases

1. **No LeaveBalance** → auto-seed from LeaveType defaults (same pattern as `MyLeaveBalanceEndpoint`)
2. **No LeaveRequests** → pendingCount=0, approvedCount=0
3. **Year boundary** → balance auto-seeded for new year, request counts = 0

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Year filter | Current year only | Dashboard needs current year; multi-year adds YAGNI complexity |
| Cancelled/Rejected | Not counted | Only pending + approved per requirements |
| Auto-seed balance | Yes | Follows existing `MyLeaveBalanceEndpoint` pattern |
| Separate group | `MyStatsGroup` | Response shape differs from LeaveBalance, SRP |

## Next Steps

→ `/ck:plan` to create implementation plan