---
phase: 2
title: "Approval Logic Refactor"
status: pending
priority: P1
effort: "4h"
dependencies: [1]
---

# Phase 2: Approval Logic Refactor

## Overview

Rewrite Approve, Reject, Cancel endpoints to use config-driven N-level approval logic. Remove all `isSingleLevel` branching and `approved_leader` status references. Extract shared approval config query and scope-checking into reusable helpers.

## Requirements

- Functional: Approve endpoint works for N levels with multi-role OR logic
- Functional: Reject endpoint works for any approver at the current level
- Functional: Cancel endpoint allows cancel while `ApprovedLevel < maxLevel`
- Functional: If no LeaveConfig exists for a LeaveType, return 403 "Chưa cấu hình phê duyệt"
- Functional: Any approver role at the current level can approve/reject (OR logic)
- Functional: Scope rules per role: LD.PCM = same department, all others = no scope check
- Functional: Balance deduction only on final approval (when `ApprovedLevel == maxLevel`)
- Functional: Audit trail records `ApprovedLevel` changes

## Architecture

### Core approval flow:

```
1. Get LeaveConfigs for request.LeaveTypeId
2. If no configs → return 403 "Chưa cấu hình phê duyệt"
3. Group configs by ApprovalLevel, sort ascending → levels[]
4. currentLevel = request.ApprovedLevel + 1
5. If currentLevel > levels.Max → 409 "Đơn đã được phê duyệt"
6. Get roles for currentLevel from configs
7. Check if currentUser.Roles intersects with level roles
8. If not → 403 Forbidden
9. Apply scope check for matching role (LD.PCM = same dept, others = no check)
10. On approve: ApprovedLevel++, if ApprovedLevel == maxLevel → Status = "approved" + UpsertBalance
11. On reject: Status = "rejected"
```

### New shared helper: `ApprovalHelper`

Extract common logic into a static helper class:

```csharp
public static class ApprovalHelper
{
    // Get ordered levels and their roles for a LeaveType
    public static Dictionary<int, List<string>> GetApprovalFlow(List<LeaveConfig> configs)

    // Check if a user can approve at a given level with scope rules
    public static bool CanApproveAtLevel(
        CurrentUser user, LeaveRequest request,
        Dictionary<int, List<string>> flow, int targetLevel)

    // Get max level from flow
    public static int GetMaxLevel(Dictionary<int, List<string>> flow)
}
```

### Scope rules (kept simple, extendable):

```csharp
// Role-based scope check — can be extended with a config column later
if (approverRole == "QLNP.LD.PCM")
{
    // Same department, not own request
    return request.UserId != user.UserId
        && request.User.PhongBanId == user.PhongBanId;
}
// All other roles: no scope restriction
return true;
```

## Related Code Files

- Modify: `packages/api/Features/LeaveRequests/Approve/Endpoint.cs` — full rewrite
- Modify: `packages/api/Features/LeaveRequests/Approve/Data.cs` — replace `GetApprovalLevelsAsync` with `GetApprovalConfigsAsync`
- Modify: `packages/api/Features/LeaveRequests/Reject/Endpoint.cs` — full rewrite
- Modify: `packages/api/Features/LeaveRequests/Reject/Data.cs` — same Data change
- Modify: `packages/api/Features/LeaveRequests/Cancel/Endpoint.cs` — rewrite
- Modify: `packages/api/Features/LeaveRequests/Cancel/Data.cs` — same Data change
- Modify: `packages/api/Features/LeaveRequests/List/Data.cs` — update role-based filtering for N-level approval
- Modify: `packages/api/Features/LeaveRequests/Create/Data.cs` — update overlap check
- Modify: `packages/api/Features/LeaveRequests/Update/Data.cs` — update overlap check
- Modify: `packages/api/Features/Reports/Export/Models.cs` — update status labels
- Create: `packages/api/Features/LeaveRequests/ApprovalHelper.cs` — shared helper

## Implementation Steps

1. **Create `ApprovalHelper.cs`** in `Features/LeaveRequests/`:
   - `GetApprovalFlow(List<LeaveConfig>) → Dictionary<int, List<string>>` — groups configs by ApprovalLevel
   - `CanApproveAtLevel(CurrentUser, LeaveRequest, flow, targetLevel) → (bool canApprove, string? errorMessage)`
   - `GetMaxLevel(Dictionary<int, List<string>>) → int`
   - Scope rules: LD.PCM = same dept check, GD.PGD and others = no scope check

2. **Create shared `Data.cs` base** — all three Data classes (Approve, Reject, Cancel) share the same `GetApprovalConfigsAsync`:
   ```csharp
   public async Task<List<LeaveConfig>> GetApprovalConfigsAsync(long leaveTypeId, CancellationToken ct) =>
       await _db.LeaveConfigs
           .Where(c => c.LeaveTypeId == leaveTypeId)
           .OrderBy(c => c.ApprovalLevel)
           .ToListAsync(ct);
   ```
   Replace `GetApprovalLevelsAsync` in all three Data classes.

3. **Rewrite `Approve/Endpoint.cs`**:
   - Remove `isSingleLevel` / `isLeader` / `isDirector` branching
   - Get approval flow via `ApprovalHelper.GetApprovalFlow`
   - Determine current level: `request.ApprovedLevel + 1`
   - Use `ApprovalHelper.CanApproveAtLevel` for auth check
   - On approve: `request.ApprovedLevel++`
   - If `request.ApprovedLevel == maxLevel`: `request.Status = "approved"`, call `UpsertBalanceAsync`
   - Else: `request.Status = "pending"` (stays pending, level incremented)
   - Set `request.ApprovedBy` and `request.ApprovedAt`
   - Remove `Roles("QLNP.LD.PCM", "QLNP.GD.PGD")` hardcode — role check is now dynamic from config
   - Keep authorization but expand: any role in configs can access, validate at handler level

4. **Rewrite `Reject/Endpoint.cs`**:
   - Same flow as Approve for determining current level and role check
   - On reject: `request.Status = "rejected"`, `request.RejectedReason = reason`

5. **Rewrite `Cancel/Endpoint.cs`**:
   - Get approval flow configs
   - Can cancel if `request.Status == "pending"` (regardless of ApprovedLevel)
   - Cannot cancel if `request.Status == "approved"` (fully approved) or `request.Status == "rejected"`
   - Note: if partial approval cancellation is needed later, add it as a separate feature with balance reversal

6. **ApprovedBy field handling**:
   - Keep `ApprovedBy` as the last approver at any level
   - Each level's approver is tracked via `LeaveRequestAudit` (FieldName = "ApprovedLevel", NewValue = "1", "2", etc.)
   - On each approval: set `request.ApprovedBy = currentUser.UserId`, `request.ApprovedAt = DateTime.UtcNow`
   - This means `ApprovedBy` shows the most recent approver, not necessarily the final one

7. **Update `List/Data.cs`**:
   - Update manual projection to include `lr.ApprovedLevel` in `LeaveRequestDto` constructor (List/Data.cs uses manual projection, not `MapToDto()`)
   - Role-based filtering logic stays the same (GD.PGD/QTHT see all, LD.PCM sees same-dept, others see own) — the frontend ApprovalPage handles approval-level filtering

8. **Update `Create/Data.cs`** overlap check:
   - Replace `lr.Status == "approved_leader" || lr.Status == "approved"` with `lr.Status == "approved"`
   - Since `approved_leader` no longer exists, only `approved` matters for overlap

9. **Update `Update/Data.cs`** overlap check:
   - Same change as Create

10. **Update `Reports/Export/Models.cs`**:
    - Replace `approved_leader` status label with `approved` label
    - Remove `approved_director` label
    - Add `ApprovedLevel` column to export if needed

11. **Update `LeaveRequestAudit`**:
    - When `ApprovedLevel` changes, write audit entry with FieldName = "ApprovedLevel"

12. **Remove role hardcodes from `Configure()`**:
    - In Approve/Reject endpoints, remove `Roles("QLNP.LD.PCM", "QLNP.GD.PGD")`
    - Replace with `Options(x => x.RequireAuthorization())` — role check happens inside handler via config

## Success Criteria

- [ ] Approve endpoint: N-level approval works correctly (tested with 1-level, 2-level, 3-level configs)
- [ ] Approve endpoint: Multi-role OR logic works (any role at current level can approve)
- [ ] Approve endpoint: Scope check works (LD.PCM same dept, others no scope)
- [ ] Approve endpoint: Balance deduction only on final approval
- [ ] Reject endpoint: Works for any approver at current level
- [ ] Cancel endpoint: Works for pending and partially approved requests
- [ ] List/Data.cs role-based filtering updated for N-level approval
- [ ] No `approved_leader` status references remain in backend code
- [ ] No `isSingleLevel` branching remains
- [ ] `ApprovalHelper` extracted as reusable helper
- [ ] `dotnet build` succeeds

## Risk Assessment

- **Auth regression**: Removing `Roles()` attribute means all authenticated users can hit the endpoint. Mitigated by handler-level role check from config.
- **No config = 403**: If a LeaveType has no LeaveConfig rows, approval is blocked. This is intentional — forces admin to configure.
- **ApprovedLevel edge case**: If configs are changed while a request is in progress, the request's ApprovedLevel may become invalid. Mitigation: re-query configs on each approval action.

## Security Considerations

- Role check must happen INSIDE the handler, not just via `Roles()` attribute
- Scope check (same department) must be verified on every approval action
- Cannot approve own request — enforced for LD.PCM role
- No config = no approval (fail closed)