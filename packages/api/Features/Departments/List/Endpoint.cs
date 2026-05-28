using FastEndpoints;

namespace QLNP.Api.Features.Departments.List;

internal sealed class Endpoint : EndpointWithoutRequest<List<DepartmentDto>> {
    private readonly Data _data;

    public Endpoint(Data data) => _data = data;

    public override void Configure() {
        Get("/api/departments");
        Options(x => x.RequireAuthorization());
        Tags("Departments");
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var items = await _data.GetAllAsync(ct);
        await Send.OkAsync(items, ct);
    }
}
