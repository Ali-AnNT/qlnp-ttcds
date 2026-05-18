using FastEndpoints;

namespace QLNP.Api.Features.LeaveBalances.List;

internal sealed class Endpoint : EndpointWithoutRequest<List<LeaveBalanceDto>>
{
    private readonly Data _data;

    public Endpoint(Data data) => _data = data;

    public override void Configure()
    {
        Get("/api/leave-balances");
        Roles("QLNP.GD.PGD", "QLNP.QTHT", "QLNP.LD.PCM");
        Tags("Leave Balances");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var year = Query<int?>("year");
        var items = await _data.GetAllAsync(year, ct);
        await Send.OkAsync(items, ct);
    }
}
