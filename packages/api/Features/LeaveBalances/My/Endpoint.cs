using FastEndpoints;
using QLNP.Api.Auth;

namespace QLNP.Api.Features.LeaveBalances.My;

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
        Get("/api/leave-balances/my");
        Options(x => x.RequireAuthorization());
        Tags("Leave Balances");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var user = _currentUser.GetCurrentUser();
        var year = Query<int?>("year", isRequired: false);
        var items = await _data.GetByUserIdAsync(user.UserId, year, ct);
        await Send.OkAsync(items, ct);
    }
}
