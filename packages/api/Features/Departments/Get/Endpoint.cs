using FastEndpoints;

namespace QLNP.Api.Features.Departments.Get;

internal sealed class Endpoint : EndpointWithoutRequest<DepartmentDto> {
    private readonly Data _data;

    public Endpoint(Data data) => _data = data;

    public override void Configure() {
        Get("/api/departments/{id:long}");
        Options(x => x.RequireAuthorization());
        Tags("Departments");
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var id = Route<long>("id");

        var result = await _data.GetByIdAsync(id, ct);
        if (result is null) {
            await Send.NotFoundAsync(ct);
            return;
        }

        await Send.OkAsync(result, ct);
    }
}
