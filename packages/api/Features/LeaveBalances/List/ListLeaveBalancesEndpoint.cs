using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using QLNP.Api.Shared.Domain;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;

namespace QLNP.Api.Features.LeaveBalances.List;

internal sealed class ListLeaveBalancesEndpoint : EndpointWithoutRequest<Result<List<LeaveBalanceDto>>> {
    public AppDbContext Db { get; set; } = null!;
    public ICurrentUserProvider CurrentUser { get; set; } = null!;

    public override void Configure() {
        Get("");
        Group<LeaveBalanceGroup>();
        Roles(AppRoles.Director, AppRoles.Admin, AppRoles.Leader, AppRoles.Staff);
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var year = Query<int?>("year", isRequired: false);
        var user = CurrentUser.GetCurrentUser();
        var userId = user.Roles.Contains(AppRoles.Staff) ? user.UserId : (long?)null;

        var effectiveYear = year ?? DateTime.UtcNow.Year;

        // Lazy-seed: ensure balance rows exist before querying
        if (userId.HasValue) {
            await LeaveBalanceSeeding.EnsureBalancesAsync(Db, userId.Value, effectiveYear, ct);
        } else {
            // Admin view — seed for all active users
            var userIds = await Db.UserMaster
                .Where(u => u.Used == true && u.UserPortalId != null)
                .Select(u => (long)u.UserPortalId)
                .ToListAsync(ct);
            await LeaveBalanceSeeding.EnsureBalancesForUsersAsync(Db, userIds, effectiveYear, ct);
        }

        var query = Db.LeaveBalances.AsQueryable();

        if (year.HasValue)
            query = query.Where(b => b.Year == year.Value);

        if (userId.HasValue)
            query = query.Where(b => b.UserId == userId.Value);

        var items = await query
            .OrderBy(b => b.UserId).ThenBy(b => b.Year)
            .Select(b => new LeaveBalanceDto(
                b.Id, b.UserId,
                b.Year, b.TotalDays, b.UsedDays,
                b.TotalDays - b.UsedDays,
                b.Role))
            .ToListAsync(ct);

        await Send.OkAsync(Result<List<LeaveBalanceDto>>.Ok(items), ct);
    }
}
