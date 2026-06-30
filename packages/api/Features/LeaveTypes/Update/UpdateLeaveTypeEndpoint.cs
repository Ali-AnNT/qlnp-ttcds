using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;
using QLNP.Api.Shared.Domain;

namespace QLNP.Api.Features.LeaveTypes.Update;

internal sealed class UpdateLeaveTypeEndpoint : Endpoint<Request, Result<LeaveTypeDto>, Mapper> {
    public AppDbContext Db { get; set; } = null!;

    public override void Configure() {
        Put("/{id}");
        Group<LeaveTypeGroup>();
        Roles(AppRoles.Admin);
    }

    public override async Task HandleAsync(Request r, CancellationToken ct) {
        var id = Route<long>("id");
        if (r.Id != id) {
            AddError(r => r.Id, "ID trong URL không khớp với ID trong body");
            await Send.ErrorsAsync(400, ct);
            return;
        }

        // Business validation (DB-dependent)
        if (await Db.LeaveTypes.AnyAsync(t => t.Code == r.Code && t.Id != id && t.IsActive, ct))
            AddError(r => r.Code, "Mã loại nghỉ đã tồn tại");

        ThrowIfAnyErrors();

        var leaveType = await Db.LeaveTypes.FindAsync([id], ct);
        if (leaveType is null) {
            await Send.NotFoundAsync(ct);
            return;
        }

        await Map.UpdateEntityAsync(r, leaveType, ct);

        // If this leave type was deactivated and was the default, reset to the first remaining active type
        if (!leaveType.IsActive) {
            var defaultConfig = await Db.SystemConfigs
                .FirstOrDefaultAsync(c => c.ConfigKey == "default_leave_type_id", ct);
            if (defaultConfig is not null && defaultConfig.ConfigValue == id.ToString()) {
                var firstActive = await Db.LeaveTypes
                    .Where(lt => lt.IsActive && lt.Id != id)
                    .OrderBy(lt => lt.Id)
                    .FirstOrDefaultAsync(ct);
                defaultConfig.ConfigValue = firstActive?.Id.ToString() ?? "0";
            }
        }

        await Db.SaveChangesAsync(ct);

        var dto = new LeaveTypeDto(leaveType.Id, leaveType.Name, leaveType.Code,
            leaveType.DefaultDays, leaveType.Description, leaveType.IsActive);

        await Send.OkAsync(Result<LeaveTypeDto>.Ok(dto), ct);
    }
}
