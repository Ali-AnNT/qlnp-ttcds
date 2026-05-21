using FastEndpoints;
using QLNP.Api.Auth;

namespace QLNP.Api.Features.LeaveBalances.List;

internal sealed class Endpoint : EndpointWithoutRequest<List<LeaveBalanceDto>>
{
    private readonly Data _data;
    private readonly ICurrentUserProvider _currentUser;

    public Endpoint(Data data, ICurrentUserProvider currentUser)
    {
        _data = data;
        _currentUser = currentUser;
    }

    public override void Configure()
    {
        Get("/api/leave-balances");
        Roles("QLNP.GD.PGD", "QLNP.QTHT", "QLNP.LD.PCM", "QLNP.CB.PCM");
        Tags("Leave Balances");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var year = Query<int?>("year");
        var user = _currentUser.GetCurrentUser();
        var userId = user.Roles.Contains("QLNP.CB.PCM") ? user.UserId : (long?)null;
        var items = await _data.GetAllAsync(year, userId, ct);
        await Send.OkAsync(items, ct);
    }
}
