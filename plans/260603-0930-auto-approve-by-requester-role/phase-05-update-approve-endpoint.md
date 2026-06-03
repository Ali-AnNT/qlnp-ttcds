---
phase: 5
title: "Update Approve Endpoint"
status: done
priority: P2
effort: "10min"
dependencies: [3]
---

# Phase 5: Update Approve Endpoint

## Overview

Replace private balance methods in `ApproveLeaveRequestEndpoint.cs` with calls to shared `ApprovalBalanceService`. No behavior change — pure refactor for DRY.

## Requirements

- Functional: Same approval + balance deduction behavior as before
- Non-functional: Use shared service instead of private methods

## Related Code Files

- Modify: `packages/api/Features/LeaveRequests/Approve/ApproveLeaveRequestEndpoint.cs`

## Implementation Steps

1. Remove private method `UpsertBalanceForApprovalAsync` (lines 91-117)
2. Remove private method `ResolveTotalDaysAsync` (lines 119-143)
3. Replace call at line 76:
   ```csharp
   // Before:
   await UpsertBalanceForApprovalAsync(entity, ct);
   // After:
   await ApprovalBalanceService.UpsertBalanceForApprovalAsync(entity, Db, ct);
   ```
4. Add using for `QLNP.Api.Shared.Domain` if not already present
5. Compile check: `dotnet build packages/api`

## Success Criteria

- [ ] No private balance methods remain in Approve endpoint
- [ ] `ApprovalBalanceService.UpsertBalanceForApprovalAsync` called instead
- [ ] Manual approve flow works identically (pending → approved, balance deducted)
- [ ] Compile passes

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Logic drift | NONE | Verbatim extraction, same code |
| Missing using | LOW | Same namespace already imported |