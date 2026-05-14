---
day: 10
title: Backend Endpoints P2
status: planned
priority: P0
effort: 1 day
date: 2026-05-15
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
| Create | `packages/api/Features/LeaveRequests/List/ListLeaveRequestsEndpoint.cs` |
| Create | `packages/api/Features/LeaveRequests/Create/CreateLeaveRequestEndpoint.cs` |
| Create | `packages/api/Features/LeaveRequests/Update/UpdateLeaveRequestEndpoint.cs` |
| Create | `packages/api/Features/LeaveRequests/Approve/ApproveLeaveRequestEndpoint.cs` |
| Create | `packages/api/Features/LeaveRequests/Reject/RejectLeaveRequestEndpoint.cs` |
| Create | `packages/api/Features/LeaveRequests/Cancel/CancelLeaveRequestEndpoint.cs` |
| Create | `packages/api/Features/LeaveBalances/List/ListLeaveBalancesEndpoint.cs` |
| Create | `packages/api/Features/LeaveBalances/My/MyLeaveBalanceEndpoint.cs` |
| Create | `packages/api/Features/Departments/List/ListDepartmentsEndpoint.cs` if needed |

## Implementation Steps

1. Implement role-filtered leave request list.
2. Implement create with date validation, business days, overlap check, active leave type check.
3. Implement update for owner and editable statuses only.
4. Implement approve state transitions:
   - LD.PCM: pending -> approved_leader.
   - GD.PGD/QTHT: pending or approved_leader -> approved_director.
5. Update `LeaveBalances.UsedDays` only when final-approved.
6. Implement reject for pending/approved_leader.
7. Implement cancel for owner and allowed statuses.
8. Implement balance list/my.
9. Build API.

## Todo List

- [ ] Leave request list.
- [ ] Create/update with validation.
- [ ] Approve/reject/cancel.
- [ ] Balance list/my.
- [ ] Department reference if needed.
- [ ] `dotnet build packages/api/QLNP.Api.csproj`.

## Success Criteria

- Leave workflow compiles and follows SRS status rules.
- Role filtering enforced server-side.
- Balance update is transactional with approval.

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

- Wire frontend to real endpoints.
