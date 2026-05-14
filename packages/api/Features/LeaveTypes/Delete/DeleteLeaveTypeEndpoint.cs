using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.LeaveTypes.Delete;

public class DeleteLeaveTypeEndpoint : EndpointWithoutRequest
{
    private readonly AppDbContext _db;

    public DeleteLeaveTypeEndpoint(AppDbContext db) => _db = db;

    public override void Configure()
    {
        Delete("/api/leave-types/{id}");
        Roles("quantri");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<long>("id");

        var leaveType = await _db.LeaveTypes.FindAsync([id], ct);
        if (leaveType is null || !leaveType.IsActive)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        var hasRequests = await _db.LeaveRequests.AnyAsync(r => r.LeaveTypeId == id, ct);
        if (hasRequests)
        {
            AddError("Không thể xóa: loại nghỉ đang được sử dụng trong đơn xin nghỉ");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        leaveType.IsActive = false;
        await _db.SaveChangesAsync(ct);

        await Send.NoContentAsync(ct);
    }
}
