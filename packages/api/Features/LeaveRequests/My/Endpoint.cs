using FastEndpoints;
using QLNP.Api.Auth;

namespace QLNP.Api.Features.LeaveRequests.My;

internal sealed class Endpoint : EndpointWithoutRequest<List<LeaveRequestDto>>
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
        Get("/api/leave-requests/my");
        Options(x => x.RequireAuthorization());
        Tags("Leave Requests");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var user = _currentUser.GetCurrentUser();
        var items = await _data.GetByUserIdAsync(user.UserId, ct);
        await Send.OkAsync(items, ct);
    }
}
