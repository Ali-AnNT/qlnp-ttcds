---
phase: 2
title: "Implement ApprovalHelper"
status: done
priority: P1
effort: "30min"
dependencies: [1]
---

# Phase 2: Implement ApprovalHelper

## Overview

Add `GetAutoApproveLevel` and `HasApproverRole` methods to `ApprovalHelper.cs`. These are the core logic for determining how many levels to auto-approve when an approver-role user creates a leave request.

## Requirements

- Functional: Determine auto-approve level based on requester's roles vs approval flow config
- Non-functional: Pure static methods, no side effects, easily unit-testable

## Architecture

`GetAutoApproveLevel` returns:
- `> 0` — highest matching level where requester's role appears in the flow
- `-1` — sentinel meaning "auto-approve ALL levels" (requester has approver role but no match in flow, e.g. Director sending NKL)
- `0` — no auto-approve (Staff, no matching role)

`HasApproverRole` returns true if user holds Leader, Director, or Admin role.

## Related Code Files

- Modify: `packages/api/Shared/Domain/ApprovalHelper.cs`
- Read: `packages/api/Infrastructure/Auth/Roles.cs`

## Implementation Steps

1. Add `ApproverRoles` constant array to `ApprovalHelper`:
   ```csharp
   private static readonly string[] ApproverRoles = [AppRoles.Leader, AppRoles.Director, AppRoles.Admin];
   ```

2. Add `HasApproverRole` method:
   ```csharp
   /// <summary>
   /// Checks if the user holds any approver-capable role (Leader, Director, or Admin).
   /// </summary>
   public static bool HasApproverRole(CurrentUser user) =>
       user.Roles.Any(r => ApproverRoles.Contains(r));
   ```

3. Add `GetAutoApproveLevel` method:
   ```csharp
   /// <summary>
   /// Determines auto-approve level for a requester based on their roles
   /// vs the configured approval flow.
   /// Returns:
   ///   > 0 = highest matching level (auto-approve 1..result)
   ///   -1  = no match but has approver role → auto-approve ALL levels
   ///   0   = no auto-approve (Staff or no role match)
   /// </summary>
   public static int GetAutoApproveLevel(CurrentUser user, Dictionary<int, List<string>> flow) {
       var matchLevel = 0;
       foreach (var (level, roles) in flow) {
           if (roles.Any(r => user.Roles.Contains(r)))
               matchLevel = Math.Max(matchLevel, level);
       }

       // No match in flow but user is an approver → they're above the chain
       if (matchLevel == 0 && HasApproverRole(user))
           return -1;

       return matchLevel;
   }
   ```

4. Add using for `AppRoles` if not already present

5. Compile check: `dotnet build packages/api`

## Success Criteria

- [ ] `GetAutoApproveLevel` returns correct values for all scenarios (Staff→0, Leader+NPN→1, Director+NPN→2, Director+NKL→-1, Admin→-1)
- [ ] `HasApproverRole` returns true for Leader/Director/Admin, false for Staff
- [ ] Existing methods (`GetApprovalFlow`, `CanApproveAtLevel`, `GetNextLevelRoles`) unchanged
- [ ] Code compiles without errors

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Sentinel -1 misunderstood | LOW | XML doc explains return values clearly |
| User with multiple roles | LOW | `Any()` checks all roles, returns highest match |
| Future roles not in ApproverRoles | MEDIUM | ApproverRoles array is centralized, easy to extend |