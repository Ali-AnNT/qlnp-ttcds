using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using QLNP.Api.Features.SystemConfigs;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.SystemConfigs.Get;

internal sealed class GetSystemConfigEndpoint : EndpointWithoutRequest<Result<List<SystemConfigDto>>> {
    public AppDbContext Db { get; set; } = null!;

    public override void Configure() {
        Get("");
        Group<SystemConfigGroup>();
        Options(x => x.RequireAuthorization());
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var items = await Db.SystemConfigs
            .OrderBy(c => c.ConfigKey)
            .Select(c => new SystemConfigDto(c.Id, c.ConfigKey, c.ConfigValue, c.Description, c.UpdatedAt))
            .ToListAsync(ct);

        await Send.OkAsync(Result<List<SystemConfigDto>>.Ok(items), ct);
    }
}