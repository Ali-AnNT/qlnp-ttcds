using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Auth;

namespace QLNP.Api.Features.Config.Update;

internal sealed class Endpoint : Endpoint<Request, Response> {
    private readonly Data _data;

    public Endpoint(Data data) => _data = data;

    public override void Configure() {
        Put("/api/config");
        Roles(AppRoles.Admin);
        Tags("Config");
    }

    public override async Task HandleAsync(Request r, CancellationToken ct) {
        try {
            await _data.ReplaceAllAsync(r.Items, ct);
        }
        catch (DbUpdateException) {
            AddError("Không thể cập nhật cấu hình");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        await Send.OkAsync(new Response("Cập nhật cấu hình thành công"), ct);
    }
}
