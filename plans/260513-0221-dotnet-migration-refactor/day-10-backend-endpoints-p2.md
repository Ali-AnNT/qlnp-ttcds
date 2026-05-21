---
day: 10
title: Backend Endpoints P2
status: completed
priority: P0
effort: 1 day
date: 2026-05-15
completed: 2026-05-18
---

# Day 10: Backend Endpoints P2

## Context Links

- `packages/api/Features/LeaveRequests`
- `packages/api/Features/LeaveBalances`
- `packages/api/Entities/LeaveRequest.cs`
- `docs/vision/srs.md`

## Overview

Implement core leave workflow endpoints and balance queries.

## Key Insights

- This is the highest-risk backend work.
- Approval state machine must be explicit.
- Balance updates happen only on final director approval.

## Requirements

- LeaveRequests list/create/update/approve/reject/cancel.
- LeaveBalances list/my.
- Department reference endpoint if frontend department filters require it.
- Business-day calculation and overlap detection.

## Architecture

Endpoint handler owns use-case logic. Shared private helper methods are acceptable only inside same endpoint file when small.

## Related Code Files

| Action | File |
|--------|------|
| Created | `packages/api/Features/LeaveRequests/List/Endpoint.cs`, `Data.cs`, `Models.cs` |
| Created | `packages/api/Features/LeaveRequests/Create/Endpoint.cs`, `Data.cs`, `Models.cs`, `Mapper.cs` |
| Created | `packages/api/Features/LeaveRequests/Update/Endpoint.cs`, `Data.cs`, `Models.cs`, `Mapper.cs` |
| Created | `packages/api/Features/LeaveRequests/Approve/Endpoint.cs`, `Data.cs`, `Models.cs` |
| Created | `packages/api/Features/LeaveRequests/Reject/Endpoint.cs`, `Data.cs`, `Models.cs` |
| Created | `packages/api/Features/LeaveRequests/Cancel/Endpoint.cs`, `Data.cs`, `Models.cs` |
| Created | `packages/api/Features/LeaveRequests/My/Endpoint.cs`, `Data.cs`, `Models.cs` |
| Created | `packages/api/Features/LeaveBalances/List/Endpoint.cs`, `Data.cs`, `Models.cs` |
| Created | `packages/api/Features/LeaveBalances/My/Endpoint.cs`, `Data.cs`, `Models.cs` |
| Created | `packages/api/Features/Departments/List/Endpoint.cs`, `Data.cs` |
| Created | `packages/api/Features/Departments/Get/Endpoint.cs`, `Data.cs` |

## Implementation Notes

- LeaveRequests: Already existed, fixed HTTP methods (PUT→POST, DELETE→POST), fixed to return raw DTOs.
- LeaveRequests My: NEWLY CREATED.
- LeaveBalances List/My: NEWLY CREATED.
- Departments List/Get: NEWLY CREATED.
- LeaveRequestDto now includes donViId and updatedAt fields.
- All list endpoints return raw arrays instead of wrapped `{items: [...]}`.

## Todo List

- [x] Leave request list.
- [x] Create/update with validation.
- [x] Approve/reject/cancel.
- [x] Balance list/my.
- [x] Department reference endpoint(s).
- [x] `dotnet build packages/api/QLNP.Api.csproj` — 0 errors.

## Success Criteria

- Leave workflow compiles and follows SRS status rules. -- DONE
- Role filtering enforced server-side. -- DONE
- Balance update is transactional with approval. -- DONE

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Double approval double-counts balance | Check status before update and save in one transaction |
| Overlap query misses statuses | Include pending, approved_leader, approved_director |

## Security Considerations

- Users cannot approve own requests.
- LD.PCM cannot approve other departments.
- CB.PCM/LD.PCM can only create/update/cancel own requests.

## Next Steps

- Wire frontend to real endpoints (Day 11).
