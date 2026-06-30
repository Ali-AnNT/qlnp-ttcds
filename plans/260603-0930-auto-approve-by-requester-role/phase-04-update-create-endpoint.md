---
phase: 4
title: "Update Create Endpoint"
status: done
priority: P1
effort: "30min"
dependencies: [2, 3]
---

# Phase 4: Update Create Endpoint

## Overview

Add auto-approve logic to `CreateLeaveRequestEndpoint.cs` and expand allowed roles to include Director and Admin. After creating the request, check if the requester's role matches any approval level — if yes, auto-approve those levels; if no match but requester has approver role, auto-approve all levels.

## Requirements

- Functional: Auto-approve levels based on `GetAutoApproveLevel` return value
- Functional: Allow Director and Admin roles to create leave requests
- Non-functional: Single transaction — entity save + auto-approve in one `SaveChangesAsync`

## Architecture

After existing `SaveChangesAsync` (line 55), add:
1. Load `LeaveConfig` for the leave type
2. Build approval flow via `ApprovalHelper.GetApprovalFlow`
3. Call `ApprovalHelper.GetAutoApproveLevel(currentUser, flow)`
4. Apply auto-approve based on return value
5. Save changes again (or combine into single save)

**Transaction strategy:** Wrap entity creation + auto-approve in a single `SaveChangesAsync` call by deferring the first save. Set all fields before saving.

## Related Code Files

- Modify: `packages/api/Features/LeaveRequests/Create/CreateLeaveRequestEndpoint.cs`

## Implementation Steps

1. Update `Configure()` — add Director and Admin roles:
   ```csharp
   Roles(AppRoles.Staff, AppRoles.Leader, AppRoles.Director, AppRoles.Admin);
   ```

2. Add using for `ApprovalHelper` and `ApprovalBalanceService` if not present

3. Move LeaveConfig validation BEFORE first SaveChanges (currently missing — zero config check only in Approve endpoint):
   ```csharp
   var configs = await Db.LeaveConfigs
       .Where(c => c.LeaveTypeId == r.LeaveTypeId)
       .ToListAsync(ct);
   if (configs.Count == 0) {
       AddError(r => r.LeaveTypeId, "Chưa cấu hình phê duyệt cho loại phép này");
   }
   ```

4. After `ThrowIfAnyErrors()` and entity mapping, but BEFORE `SaveChangesAsync`:
   - Build flow and compute auto-approve level
   - Apply auto-approve to entity fields

   ```csharp
   // Auto-approve logic
   var flow = ApprovalHelper.GetApprovalFlow(configs);
   var maxLevel = ApprovalHelper.GetMaxLevel(flow);
   var autoLevel = ApprovalHelper.GetAutoApproveLevel(currentUser, flow);

   if (autoLevel == -1 || (autoLevel > 0 && autoLevel >= maxLevel)) {
       // Auto-approve all levels → status = approved
       entity.ApprovedLevel = maxLevel;
       entity.Status = "approved";
       entity.ApprovedBy = currentUser.UserId;
       entity.ApprovedAt = DateTime.UtcNow;
   } else if (autoLevel > 0) {
       // Partial auto-approve → still pending
       entity.ApprovedLevel = autoLevel;
       entity.ApprovedBy = currentUser.UserId;
       entity.ApprovedAt = DateTime.UtcNow;
   }
   // else autoLevel == 0 → default pending (no changes needed)
   ```

5. Single `SaveChangesAsync` call (remove the early save, save once with all fields set)

6. After save, if fully auto-approved → deduct balance:
   ```csharp
   if (entity.Status == "approved") {
       await ApprovalBalanceService.UpsertBalanceForApprovalAsync(entity, Db, ct);
       await Db.SaveChangesAsync(ct); // save balance change
   }
   ```

7. Compile check: `dotnet build packages/api`

## Success Criteria

- [ ] Director and Admin can create leave requests (no 403)
- [ ] Staff creates request → Status=pending, ApprovedLevel=0 (unchanged behavior)
- [ ] Leader creates NPN → Status=pending, ApprovedLevel=1, ApprovedBy=self
- [ ] Leader creates NKL → Status=approved, ApprovedLevel=1, balance deducted
- [ ] Director creates NPN → Status=approved, ApprovedLevel=2, balance deducted
- [ ] Director creates NKL → Status=approved, ApprovedLevel=1, balance deducted (auto-all)
- [ ] Admin creates any → Status=approved, balance deducted
- [ ] Zero LeaveConfig → creation blocked (403)
- [ ] Compile passes

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Balance not deducted on full auto-approve | MEDIUM | Explicit check `Status == "approved"` after save, separate SaveChanges for balance |
| Two SaveChanges calls (entity + balance) | LOW | Both in same HTTP request, EF tracks changes |
| Frontend expects pending after creation | MEDIUM | DTO returns correct status; FE already renders based on Status field |