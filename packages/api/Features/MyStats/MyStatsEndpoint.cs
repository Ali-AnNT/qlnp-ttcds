using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using QLNP.Api.Shared.Domain;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;

namespace QLNP.Api.Features.MyStats;

internal sealed class MyStatsEndpoint : EndpointWithoutRequest<Result<MyStatsResponse>> {
    public AppDbContext Db { get; set; } = null!;
    public ICurrentUserProvider CurrentUser { get; set; } = null!;

    public override void Configure() {
        Get("/");
        Group<MyStatsGroup>();
        Options(x => x.RequireAuthorization());
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var user = CurrentUser.GetCurrentUser();
        var year = DateTime.UtcNow.Year;
        var primaryRole = user.Roles.FirstOrDefault();

        // Lazy-seed: ensure balance row exists for this user+year
        await LeaveBalanceSeeding.EnsureBalancesAsync(Db, user.UserId, year, ct, primaryRole);

        // Query 1: aggregate balance totals for the current year
        var balanceAgg = await Db.LeaveBalances
            .Where(b => b.UserId == user.UserId && b.Year == year)
            .GroupBy(_ => 1)
            .Select(g => new {
                TotalDays = g.Sum(b => b.TotalDays),
                UsedDays = g.Sum(b => b.UsedDays)
            })
            .FirstOrDefaultAsync(ct);

        // Query 2: count leave requests grouped by status
        var statusCounts = await Db.LeaveRequests
            .Where(lr => lr.UserId == user.UserId)
            .GroupBy(lr => lr.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Status, x => x.Count, ct);

        var totalDays = balanceAgg?.TotalDays ?? 0;
        var usedDays = balanceAgg?.UsedDays ?? 0;
        var remainingDays = totalDays - usedDays;
        var pendingCount = statusCounts.GetValueOrDefault("pending");
        var approvedCount = statusCounts.GetValueOrDefault("approved");

        var response = new MyStatsResponse(remainingDays, pendingCount, approvedCount, usedDays);
        await Send.OkAsync(Result<MyStatsResponse>.Ok(response), ct);
    }
}
