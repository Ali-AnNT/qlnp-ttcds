using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;
using QLNP.Api.Shared.Domain;

namespace QLNP.Api.Features.SystemConfigs.Update;

internal sealed class UpdateSystemConfigEndpoint : Endpoint<List<SystemConfigDto>, Result<Response>> {
    public AppDbContext Db { get; set; } = null!;
    public ILeaveBalanceService BalanceService { get; set; } = null!;

    public override void Configure() {
        Put("");
        Group<SystemConfigGroup>();
        Roles(AppRoles.Admin);
    }

    public override async Task HandleAsync(List<SystemConfigDto> req, CancellationToken ct) {
        // Validate default_leave_type_id references an active LeaveType
        var defaultLeaveTypeConfig = req.FirstOrDefault(c => c.ConfigKey == "default_leave_type_id");
        if (defaultLeaveTypeConfig is not null && long.TryParse(defaultLeaveTypeConfig.ConfigValue, out var leaveTypeId)) {
            var exists = await Db.LeaveTypes.AnyAsync(lt => lt.Id == leaveTypeId && lt.IsActive, ct);
            if (!exists) {
                AddError("default_leave_type_id", "Loại phép mặc định không tồn tại hoặc đã bị vô hiệu hóa");
                await Send.ErrorsAsync(400, ct);
                return;
            }
        }

        try {
            Db.SystemConfigs.RemoveRange(await Db.SystemConfigs.ToListAsync(ct));

            foreach (var item in req) {
                Db.SystemConfigs.Add(new SystemConfig {
                    ConfigKey = item.ConfigKey,
                    ConfigValue = item.ConfigValue,
                    Description = item.Description,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            await Db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException) {
            AddError("Không thể cập nhật cấu hình hệ thống");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        // Recalculate all current-year balances after config change
        await BalanceService.RecalculateCurrentYearAsync(ct);

        await Send.OkAsync(Result<Response>.Ok(new Response("Cập nhật cấu hình hệ thống thành công")), ct);
    }
}