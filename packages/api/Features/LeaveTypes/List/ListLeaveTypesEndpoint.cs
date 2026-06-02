using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using QLNP.Api.Shared.Domain;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.LeaveTypes.List;

internal sealed class ListLeaveTypesEndpoint : EndpointWithoutRequest<Result<List<LeaveTypeDto>>> {
    public AppDbContext Db { get; set; } = null!;

    public override void Configure() {
        Get("");
        Group<LeaveTypeGroup>();
        Options(x => x.RequireAuthorization());
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var items = await Db.LeaveTypes
            .Where(t => t.IsActive)
            .OrderBy(t => t.Name)
            .ToListAsync(ct);

        var dtos = items.Select(t =>
            new LeaveTypeDto(t.Id, t.Name, t.Code, t.DefaultDays, t.Description, t.IsActive)).ToList();

        await Send.OkAsync(Result<List<LeaveTypeDto>>.Ok(dtos), ct);
    }
}