using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Auth;
using QLNP.Api.Entities;
using QLNP.Api.Features.LeaveRequests;

namespace QLNP.Api.Features.LeaveRequests.Approve;

internal sealed class Endpoint : EndpointWithoutRequest<LeaveRequestDto>
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
        Post("/api/leave-requests/{id}/approve");
        Roles("QLNP.LD.PCM", "QLNP.GD.PGD", "QLNP.QTHT");
        Tags("Leave Requests");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<long>("id");
        var currentUser = _currentUser.GetCurrentUser();

        var entity = await _data.GetByIdAsync(id, ct);
        if (entity is null) { await Send.NotFoundAsync(ct); return; }

        // Get approval config for this leave type
        var configs = await _data.GetApprovalConfigsAsync(entity.LeaveTypeId, ct);
        if (configs.Count == 0)
        {
            AddError("Chưa cấu hình phê duyệt cho loại phép này");
            await Send.ErrorsAsync(403, ct); return;
        }

        var flow = ApprovalHelper.GetApprovalFlow(configs);
        var maxLevel = ApprovalHelper.GetMaxLevel(flow);
        var targetLevel = entity.ApprovedLevel + 1;

        // Check if already fully approved
        if (targetLevel > maxLevel)
        {
            AddError("Đơn đã được phê duyệt");
            await Send.ErrorsAsync(409, ct); return;
        }

        // Check if request is in correct state
        if (entity.Status != "pending")
        {
            AddError("Không thể duyệt đơn ở trạng thái này");
            await Send.ErrorsAsync(409, ct); return;
        }

        // Check if user can approve at this level
        var (canApprove, errorMessage) = ApprovalHelper.CanApproveAtLevel(currentUser, entity, flow, targetLevel);
        if (!canApprove)
        {
            AddError(errorMessage ?? "Bạn không có quyền phê duyệt đơn này");
            await Send.ErrorsAsync(403, ct); return;
        }

        // Approve: increment ApprovedLevel
        entity.ApprovedLevel = targetLevel;
        entity.ApprovedBy = currentUser.UserId;
        entity.ApprovedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        // If this is the final level, mark as approved and deduct balance
        if (targetLevel == maxLevel)
        {
            entity.Status = "approved";

            if (!await _data.UpsertBalanceAsync(entity, ct))
            {
                AddError("Nhân viên đã vượt quá định mức ngày phép");
                await Send.ErrorsAsync(422, ct); return;
            }
        }
        // Otherwise stays pending (partially approved)

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