using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Auth;

namespace QLNP.Api.Features.SystemConfigs.Update;

internal sealed class Endpoint : Endpoint<List<SystemConfigDto>, Response> {
    private readonly Data _data;

    public Endpoint(Data data) => _data = data;

    public override void Configure() {
        Put("/api/system-configs");
        Roles(AppRoles.Admin);
        Tags("SystemConfigs");
    }

    public override async Task HandleAsync(List<SystemConfigDto> req, CancellationToken ct) {
        try {
            await _data.ReplaceAllAsync(req, ct);
        }
        catch (DbUpdateException) {
            AddError("Không thể cập nhật cấu hình hệ thống");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        await Send.OkAsync(new Response("Cập nhật cấu hình hệ thống thành công"), ct);
    }
}