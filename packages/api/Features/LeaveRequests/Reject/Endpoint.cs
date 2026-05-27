using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Auth;
using QLNP.Api.Entities;
using QLNP.Api.Features.LeaveRequests;

namespace QLNP.Api.Features.LeaveRequests.Reject;

internal sealed class Endpoint : Endpoint<Request, LeaveRequestDto>
{
    private readonly Data _data;
    private readonly ICurrentUserProvider _currentUser;

    public Endpoint(Data data, ICurrentUserProvider currentUser)
    {
        _data = data;
        _currentUser = currentUser;
    }

    public override void Configure()
    {
        Post("/api/leave-requests/{id}/reject");
        Roles("QLNP.LD.PCM", "QLNP.GD.PGD", "QLNP.QTHT");
        Tags("Leave Requests");
    }

    public override async Task HandleAsync(Request r, CancellationToken ct)
    {
        var id = Route<long>("id");
        var currentUser = _currentUser.GetCurrentUser();

        var entity = await _data.GetByIdAsync(id, ct);
        if (entity is null) { await Send.NotFoundAsync(ct); return; }

        // Only pending requests can be rejected
        if (entity.Status != "pending")
        {
            AddError("Không thể từ chối đơn ở trạng thái này");
            await Send.ErrorsAsync(409, ct); return;
        }

        // Get approval config for this leave type
        var configs = await _data.GetApprovalConfigsAsync(entity.LeaveTypeId, ct);
        if (configs.Count == 0)
        {
            AddError("Chưa cấu hình phê duyệt cho loại phép này");
            await Send.ErrorsAsync(403, ct); return;
        }

        var flow = ApprovalHelper.GetApprovalFlow(configs);
        var targetLevel = entity.ApprovedLevel + 1;

        // Check if user can reject at this level
        var (canApprove, errorMessage) = ApprovalHelper.CanApproveAtLevel(currentUser, entity, flow, targetLevel);
        if (!canApprove)
        {
            AddError(errorMessage ?? "Bạn không có quyền từ chối đơn này");
            await Send.ErrorsAsync(403, ct); return;
        }

        entity.Status = "rejected";
        entity.RejectedReason = r.RejectedReason;
        entity.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _data.SaveAsync(ct);
        }
        catch (DbUpdateException)
        {
            AddError("Không thể xử lý đơn xin nghỉ");
            await Send.ErrorsAsync(409, ct); return;
        }

        await Send.OkAsync(entity.MapToDto(), ct);
    }
}