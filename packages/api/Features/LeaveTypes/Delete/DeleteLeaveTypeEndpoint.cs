using QLNP.Api.Shared.Groups;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;
using QLNP.Api.Shared.Domain;

namespace QLNP.Api.Features.LeaveTypes.Delete;

internal sealed class DeleteLeaveTypeEndpoint : EndpointWithoutRequest {
    public AppDbContext Db { get; set; } = null!;

    public override void Configure() {
        Delete("/{id}");
        Group<LeaveTypeGroup>();
        Roles(AppRoles.Admin);
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var id = Route<long>("id");

        var leaveType = await Db.LeaveTypes.FindAsync([id], ct);
        if (leaveType is null || !leaveType.IsActive) {
            await Send.NotFoundAsync(ct);
            return;
        }

        var hasRequests = await Db.LeaveRequests.AnyAsync(r => r.LeaveTypeId == id, ct);
        if (hasRequests) {
            AddError("Không thể xóa: loại nghỉ đang được sử dụng trong đơn xin nghỉ");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        leaveType.IsActive = false;

        // If this leave type was configured as the default, reset to the first active leave type
        var defaultConfig = await Db.SystemConfigs
            .FirstOrDefaultAsync(c => c.ConfigKey == "default_leave_type_id", ct);
        if (defaultConfig is not null && defaultConfig.ConfigValue == id.ToString()) {
            var firstActive = await Db.LeaveTypes
                .Where(lt => lt.IsActive && lt.Id != id)
                .OrderBy(lt => lt.Id)
                .FirstOrDefaultAsync(ct);
            defaultConfig.ConfigValue = firstActive?.Id.ToString() ?? "0";
        }

        await Db.SaveChangesAsync(ct);

        await Send.NoContentAsync(ct);
    }
}