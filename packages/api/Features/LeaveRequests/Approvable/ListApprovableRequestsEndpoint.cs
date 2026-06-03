using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Domain;
using QLNP.Api.Shared.Groups;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;
using QLNP.Api.Features.LeaveRequests;

namespace QLNP.Api.Features.LeaveRequests.Approvable;

/// <summary>
/// Returns pending leave requests the current user is allowed to approve at the
/// next approval level. Filtering is config-driven via ApprovalHelper so FE only
/// needs a single API call. Registered before ListLeaveRequestsEndpoint to
/// prevent the generic GET "" route from shadowing "approvable".
/// </summary>
internal sealed class ListApprovableRequestsEndpoint
    : EndpointWithoutRequest<Result<List<LeaveRequestDto>>> {
    public AppDbContext Db { get; set; } = null!;
    public ICurrentUserProvider CurrentUser { get; set; } = null!;

    public override void Configure() {
        Get("approvable");
        Group<LeaveRequestGroup>();
        Roles(AppRoles.Leader, AppRoles.Director, AppRoles.Admin);
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var user = CurrentUser.GetCurrentUser();
        var query = Db.LeaveRequests
            .Include(lr => lr.LeaveType)
            .Where(lr => lr.Status == "pending");

        if (user.Roles.Contains(AppRoles.Director) || user.Roles.Contains(AppRoles.Admin)) {
            // Director/Admin: all pending requests
        }
        else if (user.Roles.Contains(AppRoles.Leader)) {
            // Leader: same PhongBanId only (self-approval blocked later by ApprovalHelper)
            var leaderDeptUsers = await Db.UserMaster
                .Where(u => u.PhongBanId == user.PhongBanId && u.UserPortalId != null)
                .Select(u => (long)u.UserPortalId!)
                .ToListAsync(ct);
            query = query.Where(lr => leaderDeptUsers.Contains(lr.UserId));
        }
        else {
            // Staff role has no approval rights — return empty list
            await Send.OkAsync(Result<List<LeaveRequestDto>>.Ok([]), ct);
            return;
        }

        var pendingRequests = await query
            .OrderByDescending(lr => lr.CreatedAt)
            .ToListAsync(ct);

        // Pre-load requester PhongBanIds in batch to avoid N+1 in the filter loop
        var requesterInfo = await LeaveRequestUserLookup.LoadUserInfoBatchAsync(
            Db, pendingRequests.Select(lr => lr.UserId), ct);

        var approvable = new List<LeaveRequest>();
        foreach (var request in pendingRequests) {
            var configs = await Db.LeaveConfigs
                .Where(c => c.LeaveTypeId == request.LeaveTypeId)
                .OrderBy(c => c.ApprovalLevel)
                .ToListAsync(ct);

            if (configs.Count == 0) continue; // no config = not approvable

            var flow = ApprovalHelper.GetApprovalFlow(configs);
            var targetLevel = request.ApprovedLevel + 1;
            var requesterPhongBanId = requesterInfo.TryGetValue(request.UserId, out var info)
                ? info.phongBanId
                : (long?)null;

            var (canApprove, _) = ApprovalHelper.CanApproveAtLevel(
                user, request, requesterPhongBanId, flow, targetLevel);

            if (canApprove) approvable.Add(request);
        }

        // Map filtered requests to DTOs using the pre-loaded user info
        var items = approvable.Select(lr => {
            var info = requesterInfo.GetValueOrDefault(lr.UserId);
            return lr.MapToDto(info.hoTen ?? "", info.donViId, info.tenDonVi ?? "");
        }).ToList();

        await Send.OkAsync(Result<List<LeaveRequestDto>>.Ok(items), ct);
    }
}
