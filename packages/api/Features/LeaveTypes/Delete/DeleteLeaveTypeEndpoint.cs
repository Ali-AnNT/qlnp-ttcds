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
        await Db.SaveChangesAsync(ct);

        await Send.NoContentAsync(ct);
    }
}