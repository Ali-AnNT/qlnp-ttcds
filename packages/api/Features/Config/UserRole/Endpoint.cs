using FastEndpoints;

namespace QLNP.Api.Features.Config.UserRole;

internal sealed class Endpoint : EndpointWithoutRequest<UserRoleDto>
{
    private readonly Data _data;

    public Endpoint(Data data) => _data = data;

    public override void Configure()
    {
        Get("/api/config/user-role/{userId:long}");
        Roles("QLNP.QTHT");
        Tags("Config");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var userId = Route<long>("userId");

        var result = await _data.GetByUserIdAsync(userId, ct);
        if (result is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        await Send.OkAsync(result, ct);
    }
}
