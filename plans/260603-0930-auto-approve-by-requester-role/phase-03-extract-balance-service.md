---
phase: 3
title: "Extract Balance Service"
status: done
priority: P1
effort: "20min"
dependencies: [1]
---

# Phase 3: Extract Balance Service

## Overview

Extract balance deduction logic (`UpsertBalanceForApprovalAsync` + `ResolveTotalDaysAsync`) from `ApproveLeaveRequestEndpoint.cs` into a shared static service class. Both Create (auto-approve) and Approve endpoints need this logic — DRY principle.

## Requirements

- Functional: Shared balance upsert logic used by both Create and Approve endpoints
- Non-functional: Static class (no DI registration needed), same behavior as current private methods

## Architecture

New file `ApprovalBalanceService.cs` in `Shared/Domain/` — same directory as `ApprovalHelper.cs` and domain entities. Static methods, takes `AppDbContext` as parameter (same pattern as `LeaveRequestUserLookup`).

## Related Code Files

- Create: `packages/api/Shared/Domain/ApprovalBalanceService.cs`
- Modify: `packages/api/Features/LeaveRequests/Approve/ApproveLeaveRequestEndpoint.cs`

## Implementation Steps

1. Create `ApprovalBalanceService.cs` with two static methods extracted from Approve endpoint:

   ```csharp
   namespace QLNP.Api.Shared.Domain;

   /// <summary>
   /// Shared service for upserting leave balances upon approval.
   /// Used by both manual approve and auto-approve flows.
   /// </summary>
   public static class ApprovalBalanceService {
       /// <summary>
       /// Upserts the leave balance for a request's user/year, adding TotalDays to UsedDays.
       /// Creates balance record if not exists (resolves default days from config + role).
       /// </summary>
       public static async Task UpsertBalanceForApprovalAsync(
           LeaveRequest entity, AppDbContext db, CancellationToken ct) { ... }

       /// <summary>
       /// Resolves total default days and role for a user's leave balance creation.
       /// Reads from SystemConfigs (max_annual_leave, default_days_*).
       /// </summary>
       private static async Task<(decimal totalDays, string? role)> ResolveTotalDaysAsync(
           string? userRole, AppDbContext db, CancellationToken ct) { ... }
   }
   ```

2. Copy logic verbatim from `ApproveLeaveRequestEndpoint.cs` lines 91-143 (private methods)
   - `UpsertBalanceForApprovalAsync` → public static, add `AppDbContext db` parameter
   - `ResolveTotalDaysAsync` → private static, add `AppDbContext db` parameter
   - Replace `Db.` references with `db.`

3. Update `ApproveLeaveRequestEndpoint.cs`:
   - Remove private methods `UpsertBalanceForApprovalAsync` and `ResolveTotalDaysAsync`
   - Replace call at line 76: `await UpsertBalanceForApprovalAsync(entity, ct)` → `await ApprovalBalanceService.UpsertBalanceForApprovalAsync(entity, Db, ct)`

4. Compile check: `dotnet build packages/api`

## Success Criteria

- [ ] `ApprovalBalanceService.cs` compiles with exact same logic as original private methods
- [ ] `ApproveLeaveRequestEndpoint.cs` uses `ApprovalBalanceService` instead of private methods
- [ ] No behavior change for existing approve flow (same balance deduction)
- [ ] Both methods are static, no DI registration needed

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Logic drift during copy | LOW | Verbatim copy, only change `Db` → `db` parameter |
| Missing using directive | LOW | Same namespace `QLNP.Api.Shared.Domain` |