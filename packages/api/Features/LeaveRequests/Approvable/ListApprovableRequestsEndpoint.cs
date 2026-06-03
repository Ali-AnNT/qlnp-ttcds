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
/// Returns all pending leave requests within the current user's role-scope so
/// approvers can see the full picture (including requests waiting on a lower
/// level). Per-request <c>CanCurrentUserApprove</c> is set so FE can enable
/// approve/reject actions only when the user is the correct level. Staff
/// users are rejected by the <c>Roles()</c> gate before the handler runs.
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

        // Role-scope: which pending requests can this user even SEE?
        // (approval action gating happens per-request via CanCurrentUserApprove)
        if (user.Roles.Contains(AppRoles.Director) || user.Roles.Contains(AppRoles.Admin)) {
            // Director/Admin: see all pending
        }
        else if (user.Roles.Contains(AppRoles.Leader)) {
            // Leader: same PhongBanId only
            var leaderDeptUsers = await Db.UserMaster
                .Where(u => u.PhongBanId == user.PhongBanId && u.UserPortalId != null)
                .Select(u => (long)u.UserPortalId!)
                .ToListAsync(ct);
            query = query.Where(lr => leaderDeptUsers.Contains(lr.UserId));
        }

        var pendingRequests = await query
            .OrderByDescending(lr => lr.CreatedAt)
            .ToListAsync(ct);

        // Pre-load requester PhongBanIds in batch
        var requesterInfo = await LeaveRequestUserLookup.LoadUserInfoBatchAsync(
            Db, pendingRequests.Select(lr => lr.UserId), ct);

        // Per-request: compute CanCurrentUserApprove at the request's next level
        var items = new List<LeaveRequestDto>();
        foreach (var request in pendingRequests) {
            var configs = await Db.LeaveConfigs
                .Where(c => c.LeaveTypeId == request.LeaveTypeId)
                .OrderBy(c => c.ApprovalLevel)
                .ToListAsync(ct);

            var canCurrentUserApprove = false;
            if (configs.Count > 0) {
                var flow = ApprovalHelper.GetApprovalFlow(configs);
                var targetLevel = request.ApprovedLevel + 1;
                var requesterPhongBanId = requesterInfo.TryGetValue(request.UserId, out var info)
                    ? info.phongBanId
                    : (long?)null;

                var (canApprove, _) = ApprovalHelper.CanApproveAtLevel(
                    user, request, requesterPhongBanId, flow, targetLevel);
                canCurrentUserApprove = canApprove;
            }

            var info2 = requesterInfo.GetValueOrDefault(request.UserId);
            items.Add(request.MapToDto(
                info2.hoTen ?? "",
                info2.donViId,
                info2.tenDonVi ?? "",
                canCurrentUserApprove));
        }

        await Send.OkAsync(Result<List<LeaveRequestDto>>.Ok(items), ct);
    }
}
