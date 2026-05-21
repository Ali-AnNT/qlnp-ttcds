---
phase: 5
title: "Day 5 — LeaveBalances + Config + Departments"
status: completed
priority: P0
effort: "1d"
dependencies: [4]
completed_date: 2026-05-20
---

# Phase 05: Day 5 — LeaveBalances + Config + Departments

## Overview

Implement LeaveBalances, Config, and Departments feature slices. These were added beyond the original 2-week plan scope to support the LeaveRequests approve/reject flow and admin configuration.

**Completed 2026-05-20.** Code existed before plan phase file was created (from commit `a9d6e70`).

## Endpoints Implemented

### LeaveBalances

| Method | Path | Auth | ICurrentUser |
|--------|------|------|:---:|
| GET | `/api/leave-balances` | GD.PGD, QTHT, LD.PCM | ❌ |
| GET | `/api/leave-balances/my` | Any auth | ✅ |

- List: admin/director/leader view all balances, optional `?year=` filter
- My: current user's own balances, optional `?year=` filter

### Config

| Method | Path | Auth | ICurrentUser |
|--------|------|------|:---:|
| GET | `/api/config` | Any auth | ❌ |
| PUT | `/api/config` | QTHT | ❌ |
| GET | `/api/config/user-role/{userId}` | QTHT | ❌ |

- Get: returns all LeaveConfig items
- Update: replaces all config items (QTHT admin only)
- UserRole: returns role info for a specific user (QTHT admin only)

### Departments

| Method | Path | Auth | ICurrentUser |
|--------|------|------|:---:|
| GET | `/api/departments` | Any auth | ❌ |
| GET | `/api/departments/{id}` | Any auth | ❌ |

- Read-only access to DM_DONVI scaffold table
- Both endpoints: any authenticated user

## Code Files

### LeaveBalances
- `Features/LeaveBalances/List/Endpoint.cs`, `Data.cs`, `Models.cs`
- `Features/LeaveBalances/My/Endpoint.cs`, `Data.cs`, `Models.cs`
- `Features/LeaveBalances/LeaveBalanceDto.cs`

### Config
- `Features/Config/Get/Endpoint.cs`, `Data.cs`, `Models.cs`
- `Features/Config/Update/Endpoint.cs`, `Data.cs`, `Models.cs`
- `Features/Config/UserRole/Endpoint.cs`, `Data.cs`, `Models.cs`
- `Features/Config/ConfigDto.cs`

### Departments
- `Features/Departments/List/Endpoint.cs`, `Data.cs`
- `Features/Departments/Get/Endpoint.cs`, `Data.cs`
- `Features/Departments/DepartmentDto.cs`

## Known Issues

- LeaveBalances/List, Config/Get, Departments (both): no try/catch → DB errors return raw 500
- No input validation on Config/Update (bulk replace, no schema validation)

## Commit

`a9d6e70 feat(api): add Config, Departments, LeaveBalances, MyLeaveRequests endpoints + CORS`

## Next Steps

→ Phase 06: [Day 6 — Fix Known Issues](phase-06-day6-fix-known-issues.md)