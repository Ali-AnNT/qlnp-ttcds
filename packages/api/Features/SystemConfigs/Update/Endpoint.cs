using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Auth;
using QLNP.Api.Shared.Services;

namespace QLNP.Api.Features.SystemConfigs.Update;

internal sealed class Endpoint : Endpoint<List<SystemConfigDto>, Response> {
    private readonly Data _data;
    private readonly ILeaveBalanceService _balanceService;

    public Endpoint(Data data, ILeaveBalanceService balanceService) {
        _data = data;
        _balanceService = balanceService;
    }

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

        // Recalculate all current-year balances after config change
        await _balanceService.RecalculateCurrentYearAsync(ct);

        await Send.OkAsync(new Response("Cập nhật cấu hình hệ thống thành công"), ct);
    }
}
