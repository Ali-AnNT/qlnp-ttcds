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
            .Include(lr => lr.User)
                .ThenInclude(u => u!.DonVi)
            .Include(lr => lr.LeaveType)
            .AsQueryable();

        if (user.Roles.Contains(AppRoles.Director) || user.Roles.Contains(AppRoles.Admin)) {
            // No filter
        }
        else if (user.Roles.Contains(AppRoles.Leader)) {
            query = query.Where(lr => lr.User.PhongBanId == user.PhongBanId);
        }
        else {
            query = query.Where(lr => lr.UserId == user.UserId);
        }

        var items = await query
            .OrderByDescending(lr => lr.CreatedAt)
            .Select(lr => new LeaveRequestDto(
                lr.Id, lr.UserId, lr.User.HoTen ?? "",
                lr.User.DonViId,
                lr.User.DonVi != null ? lr.User.DonVi.TenDonVi ?? "" : "",
                lr.LeaveTypeId, lr.LeaveType.Name,
                lr.StartDate, lr.EndDate, lr.TotalDays,
                lr.Reason, lr.Status, lr.ApprovedLevel, lr.RequestedApproverId,
                lr.ApprovedBy, lr.ApprovedAt, lr.RejectedReason, lr.CreatedAt, lr.UpdatedAt))
            .ToListAsync(ct);

        await Send.OkAsync(Result<List<LeaveRequestDto>>.Ok(items), ct);
    }
}