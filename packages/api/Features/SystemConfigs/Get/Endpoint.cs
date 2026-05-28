using FastEndpoints;

namespace QLNP.Api.Features.SystemConfigs.Get;

internal sealed class Endpoint : EndpointWithoutRequest<List<SystemConfigDto>> {
    private readonly Data _data;

    public Endpoint(Data data) => _data = data;

    public override void Configure() {
        Get("/api/system-configs");
        Options(x => x.RequireAuthorization());
        Tags("SystemConfigs");
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var items = await _data.GetAllAsync(ct);
        await Send.OkAsync(items, ct);
    }
}