using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using QLNP.Api.Shared.Domain;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;

namespace QLNP.Api.Features.LeaveBalances.My;

internal sealed class MyLeaveBalanceEndpoint : EndpointWithoutRequest<Result<List<LeaveBalanceDto>>> {
    public AppDbContext Db { get; set; } = null!;
    public ICurrentUserProvider CurrentUser { get; set; } = null!;

    public override void Configure() {
        Get("/my");
        Group<LeaveBalanceGroup>();
        Options(x => x.RequireAuthorization());
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var user = CurrentUser.GetCurrentUser();
        var year = Query<int?>("year", isRequired: false);
        var primaryRole = user.Roles.FirstOrDefault();

        var effectiveYear = year ?? DateTime.UtcNow.Year;

        // Lazy-seed: ensure balance row exists for this user+year
        await LeaveBalanceSeeding.EnsureBalancesAsync(Db, user.UserId, effectiveYear, ct, primaryRole);

        var query = Db.LeaveBalances
            .Where(b => b.UserId == user.UserId);

        if (year.HasValue)
            query = query.Where(b => b.Year == year.Value);

        var items = await query
            .OrderBy(b => b.Year)
            .Select(b => new LeaveBalanceDto(
                b.Id, b.UserId,
                b.Year, b.TotalDays, b.UsedDays,
                b.TotalDays - b.UsedDays,
                b.Role))
            .ToListAsync(ct);

        await Send.OkAsync(Result<List<LeaveBalanceDto>>.Ok(items), ct);
    }
}