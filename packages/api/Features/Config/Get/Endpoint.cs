using FastEndpoints;

namespace QLNP.Api.Features.Config.Get;

internal sealed class Endpoint : EndpointWithoutRequest<List<ConfigDto>>
{
    private readonly Data _data;

    public Endpoint(Data data) => _data = data;

    public override void Configure()
    {
        Get("/api/config");
        Options(x => x.RequireAuthorization());
        Tags("Config");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var items = await _data.GetAllAsync(ct);
        await Send.OkAsync(items, ct);
    }
}
