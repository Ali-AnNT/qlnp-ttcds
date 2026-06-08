using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;
using QLNP.Api.Features.LeaveRequests;
using QLNP.Api.Shared;
using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Domain;

namespace QLNP.Api.Features.Reports.Statistics;

internal sealed class StatisticsEndpoint : Endpoint<Request, Result<StatisticsResponse>> {
    public AppDbContext Db { get; set; } = null!;

    public override void Configure() {
        Get("/api/reports/statistics");
        Roles(AppRoles.Director);
        Tags("Reports");
    }

    public override async Task HandleAsync(Request req, CancellationToken ct) {
        var q = Db.LeaveRequests
            .Include(r => r.LeaveType)
            .AsQueryable();

        q = q.WhereIf(!string.IsNullOrEmpty(req.Status), r => r.Status == req.Status);
        q = q.WhereIf(req.From.HasValue, r => r.EndDate >= req.From!.Value.ToDateTime(TimeOnly.MinValue));
        q = q.WhereIf(req.To.HasValue, r => r.StartDate <= req.To!.Value.ToDateTime(TimeOnly.MaxValue));

        var requests = await q.OrderBy(r => r.StartDate).ToListAsync(ct);

        var userInfos = await LeaveRequestUserLookup.LoadUserInfoBatchAsync(
            Db, requests.Select(r => r.UserId), ct);

        var response = StatisticsMapper.Compute(requests, req.Period, userInfos);

        await Send.OkAsync(Result<StatisticsResponse>.Ok(response), ct);
    }
}
