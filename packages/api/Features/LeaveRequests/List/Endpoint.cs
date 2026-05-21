using FastEndpoints;

namespace QLNP.Api.Features.LeaveRequests.List;

internal sealed class Endpoint : EndpointWithoutRequest<List<LeaveRequestDto>>
{
    private readonly Data _data;

    public Endpoint(Data data) => _data = data;

    public override void Configure()
    {
        Get("/api/leave-requests");
        Options(x => x.RequireAuthorization());
        Tags("Leave Requests");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var items = await _data.GetAsync(ct);
        await Send.OkAsync(items, ct);
    }
}
