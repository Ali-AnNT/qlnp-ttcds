using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.SystemConfigs.GetLeaveConfigs;

internal sealed class GetLeaveConfigsEndpoint : EndpointWithoutRequest<Result<List<LeaveConfigDto>>> {
    public AppDbContext Db { get; set; } = null!;

    public override void Configure() {
        Get("/leave-configs");
        Group<SystemConfigGroup>();
        Options(x => x.RequireAuthorization());
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var items = await Db.LeaveConfigs
            .Select(c => new LeaveConfigDto(c.Id, c.LeaveTypeId, c.ApprovalLevel, c.ApproverRole))
            .ToListAsync(ct);

        await Send.OkAsync(Result<List<LeaveConfigDto>>.Ok(items), ct);
    }
}