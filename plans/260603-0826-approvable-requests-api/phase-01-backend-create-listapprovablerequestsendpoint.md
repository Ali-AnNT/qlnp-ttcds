---
phase: 1
title: "Backend: Create ListApprovableRequestsEndpoint"
status: pending
priority: P2
effort: "2h"
dependencies: []
---

# Phase 1: Backend — ListApprovableRequestsEndpoint

## Overview

Tạo endpoint `GET /api/leave-requests/approvable` trả về danh sách leave requests mà current user có quyền phê duyệt ở next approval level. Tận dụng `ApprovalHelper.CanApproveAtLevel` đã có sẵn.

## Requirements

- **Functional:** Trả về chỉ những pending requests mà current user's role match approval config ở next level. Leader chỉ thấy requests từ cùng PhongBanId, không thấy đơn của chính mình.
- **Non-functional:** Response time < 500ms cho 100 requests. N+1 query acceptable cho MVP (optimize later).

## Architecture

```
Request → ListApprovableRequestsEndpoint
  1. Get currentUser (ICurrentUserProvider)
  2. Query pending LeaveRequests (scoped by role/dept)
  3. For each request:
     a. Load LeaveConfigs for leaveTypeId
     b. Build approval flow (ApprovalHelper.GetApprovalFlow)
     c. Check CanApproveAtLevel(currentUser, request, requesterPhongBanId, flow, nextLevel)
  4. Filter: keep only where canApprove == true
  5. Batch load user info (LeaveRequestUserLookup)
  6. Map to LeaveRequestDto
  7. Return Result<List<LeaveRequestDto>>
```

**Route:** `GET /api/leave-requests/approvable`
**Auth:** RequireAuthorization + Roles(Leader, Director, Admin)
**Group:** `LeaveRequestGroup` (prefix: `api/leave-requests`)

**Important:** Must register BEFORE `ListLeaveRequestsEndpoint` (GET "") to avoid route conflict. FastEndpoints processes routes in registration order.

## Related Code Files

- **Create:** `packages/api/Features/LeaveRequests/Approvable/ListApprovableRequestsEndpoint.cs`
- **Reference:** `packages/api/Features/LeaveRequests/List/ListLeaveRequestsEndpoint.cs` (pattern to follow)
- **Reference:** `packages/api/Features/LeaveRequests/Approve/ApproveLeaveRequestEndpoint.cs` (approval logic)
- **Reference:** `packages/api/Shared/Domain/ApprovalHelper.cs` (reuse CanApproveAtLevel, GetApprovalFlow, GetNextLevelRoles)
- **Reference:** `packages/api/Features/LeaveRequests/LeaveRequestUserLookup.cs` (reuse LoadUserInfoBatchAsync)
- **Reference:** `packages/api/Features/LeaveRequests/LeaveRequestMapping.cs` (reuse MapToDto)

## Implementation Steps

1. Create directory `Features/LeaveRequests/Approvable/`
2. Create `ListApprovableRequestsEndpoint.cs`:
   ```csharp
   internal sealed class ListApprovableRequestsEndpoint 
       : EndpointWithoutRequest<Result<List<LeaveRequestDto>>>
   {
       public AppDbContext Db { get; set; } = null!;
       public ICurrentUserProvider CurrentUser { get; set; } = null!;

       public override void Configure()
       {
           Get("approvable");
           Group<LeaveRequestGroup>();
           Roles(AppRoles.Leader, AppRoles.Director, AppRoles.Admin);
       }

       public override async Task HandleAsync(CancellationToken ct)
       {
           var user = CurrentUser.GetCurrentUser();
           
           // Step 1: Query pending requests, scoped by role
           var query = Db.LeaveRequests
               .Include(lr => lr.LeaveType)
               .Where(lr => lr.Status == "pending");

           // Step 2: Role-based pre-filter
           if (user.Roles.Contains(AppRoles.Director) || user.Roles.Contains(AppRoles.Admin))
           {
               // Director/Admin can see all pending
           }
           else if (user.Roles.Contains(AppRoles.Leader))
           {
               // Leader: only same PhongBanId (excluding own requests handled later by ApprovalHelper)
               var leaderDeptUsers = await Db.UserMaster
                   .Where(u => u.PhongBanId == user.PhongBanId && u.UserPortalId != null)
                   .Select(u => (long)u.UserPortalId!)
                   .ToListAsync(ct);
               query = query.Where(lr => leaderDeptUsers.Contains(lr.UserId));
           }
           else
           {
               // Staff cannot approve anything
               await Send.OkAsync(Result<List<LeaveRequestDto>>.Ok([]), ct);
               return;
           }

           var pendingRequests = await query
               .OrderByDescending(lr => lr.CreatedAt)
               .ToListAsync(ct);

           // Step 3: Filter by approval config
           var approvable = new List<LeaveRequest>();
           foreach (var request in pendingRequests)
           {
               var configs = await Db.LeaveConfigs
                   .Where(c => c.LeaveTypeId == request.LeaveTypeId)
                   .OrderBy(c => c.ApprovalLevel)
                   .ToListAsync(ct);

               if (configs.Count == 0) continue; // no config = not approvable

               var flow = ApprovalHelper.GetApprovalFlow(configs);
               var targetLevel = request.ApprovedLevel + 1;

               // Load requester's PhongBanId for scope check
               var (_, _, _, requesterPhongBanId) = await LeaveRequestUserLookup
                   .LoadUserInfoAsync(Db, request.UserId, ct);

               var (canApprove, _) = ApprovalHelper.CanApproveAtLevel(
                   user, request, requesterPhongBanId, flow, targetLevel);

               if (canApprove) approvable.Add(request);
           }

           // Step 4: Batch load user info for DTO mapping
           var userInfos = await LeaveRequestUserLookup.LoadUserInfoBatchAsync(
               Db, approvable.Select(lr => lr.UserId), ct);

           var items = approvable.Select(lr => {
               var info = userInfos.GetValueOrDefault(lr.UserId);
               return lr.MapToDto(info.hoTen ?? "", info.donViId, info.tenDonVi ?? "");
           }).ToList();

           await Send.OkAsync(Result<List<LeaveRequestDto>>.Ok(items), ct);
       }
   }
   ```

3. Register endpoint in DI (FastEndpoints auto-discovers, but verify it loads before List endpoint)
4. Build and verify no compile errors

## Success Criteria

- [ ] `GET /api/leave-requests/approvable` returns 200 with list of `LeaveRequestDto` for authorized users
- [ ] Director/Admin sees all pending requests
- [ ] Leader sees only pending requests from same PhongBanId that they can approve at next level
- [ ] Leader cannot see their own requests
- [ ] Staff gets 403 Forbidden (no approval rights)
- [ ] Requests without LeaveConfig are excluded (not approvable)
- [ ] Endpoint compiles and builds without errors

## Risk Assessment

| Risk | Mitigation |
|------|-------------|
| N+1 query (1 config query per request) | Acceptable for MVP — pending requests typically <50. Can batch configs by leave type if needed later |
| Route conflict with `GET ""` (ListLeaveRequestsEndpoint) | Register `approvable` route before generic list route. FastEndpoints matches specific routes first |
| LoadUserInfoAsync called per-request in filter loop | Can optimize later by pre-loading PhongBanId from batch. Acceptable for MVP |

## Security Considerations

- Endpoint requires authentication + specific roles (Leader/Director/Admin)
- Staff users blocked at authorization level (403)
- Data scoped by role + department — no cross-department data leakage
- Leader self-approval blocked by `CanApproveAtLevel`