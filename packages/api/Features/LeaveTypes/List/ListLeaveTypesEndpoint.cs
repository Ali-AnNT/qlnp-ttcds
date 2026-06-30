using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using QLNP.Api.Shared.Domain;
using QLNP.Api.Shared;
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
        var q = Query<string?>("q", isRequired: false);
        var includeInactive = Query<bool?>("includeInactive", isRequired: false) ?? false;
        var term = q?.Trim().ToLower();

        var items = await Db.LeaveTypes
            .WhereIf(!includeInactive, t => t.IsActive)
            .WhereIf(!string.IsNullOrEmpty(term), t => t.Name.ToLower().Contains(term!) || t.Code.ToLower().Contains(term!))
            .OrderBy(t => t.Name)
            .Select(t =>
                new LeaveTypeDto(t.Id, t.Name, t.Code, t.DefaultDays, t.Description, t.IsActive))
            .ToListAsync(ct);

        await Send.OkAsync(Result<List<LeaveTypeDto>>.Ok(items), ct);
    }
}