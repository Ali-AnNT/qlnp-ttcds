using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;
using QLNP.Api.Features.LeaveRequests;

namespace QLNP.Api.Features.LeaveRequests.List;

internal sealed class ListLeaveRequestsEndpoint : EndpointWithoutRequest<Result<List<LeaveRequestDto>>> {
    public AppDbContext Db { get; set; } = null!;
    public ICurrentUserProvider CurrentUser { get; set; } = null!;

    public override void Configure() {
        Get("");
        Group<LeaveRequestGroup>();
        Options(x => x.RequireAuthorization());
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var user = CurrentUser.GetCurrentUser();
        var query = Db.LeaveRequests
            .Include(lr => lr.LeaveType)
            .AsQueryable();

        if (user.Roles.Contains(AppRoles.Director) || user.Roles.Contains(AppRoles.Admin)) {
            // No filter
        }
        else if (user.Roles.Contains(AppRoles.Leader)) {
            // Leader can only see requests from same PhongBan — filter by user lookup
            var leaderDeptUsers = await Db.UserMaster
                .Where(u => u.PhongBanId == user.PhongBanId && u.UserPortalId != null)
                .Select(u => (long)u.UserPortalId!)
                .ToListAsync(ct);
            query = query.Where(lr => leaderDeptUsers.Contains(lr.UserId));
        }
        else {
            query = query.Where(lr => lr.UserId == user.UserId);
        }

        var requests = await query
            .OrderByDescending(lr => lr.CreatedAt)
            .ToListAsync(ct);

        // Load user info batch for DTO mapping
        var userInfos = await LeaveRequestUserLookup.LoadUserInfoBatchAsync(
            Db, requests.Select(lr => lr.UserId), ct);

        var items = requests.Select(lr => {
            var info = userInfos.GetValueOrDefault(lr.UserId);
            return new LeaveRequestDto(
                lr.Id, lr.UserId, info.hoTen ?? "",
                info.donViId, info.tenDonVi ?? "",
                lr.LeaveTypeId, lr.LeaveType?.Name ?? "",
                lr.StartDate, lr.EndDate, lr.TotalDays,
                lr.Reason, lr.Status, lr.ApprovedLevel, lr.RequestedApproverId,
                lr.ApprovedBy, lr.ApprovedAt, lr.RejectedReason, lr.CreatedAt, lr.UpdatedAt);
        }).ToList();

        await Send.OkAsync(Result<List<LeaveRequestDto>>.Ok(items), ct);
    }
}
