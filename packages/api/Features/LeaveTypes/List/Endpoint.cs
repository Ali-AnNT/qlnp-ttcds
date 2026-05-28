using FastEndpoints;

namespace QLNP.Api.Features.LeaveTypes.List;

internal sealed class Endpoint : EndpointWithoutRequest<List<LeaveTypeDto>> {
    private readonly Data _data;

    public Endpoint(Data data) => _data = data;

    public override void Configure() {
        Get("/api/leave-types");
        Options(x => x.RequireAuthorization());
        Tags("Leave Types");
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var items = await _data.GetActiveAsync(ct);

        var dtos = items.Select(t =>
            new LeaveTypeDto(t.Id, t.Name, t.Code, t.DefaultDays, t.Description, t.IsActive)).ToList();

        await Send.OkAsync(dtos, ct);
    }
}
