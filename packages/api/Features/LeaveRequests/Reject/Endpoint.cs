using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Auth;
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
        Roles("QLNP.LD.PCM", "QLNP.GD.PGD");
        Tags("Leave Requests");
    }

    public override async Task HandleAsync(Request r, CancellationToken ct)
    {
        var id = Route<long>("id");
        var currentUser = _currentUser.GetCurrentUser();

        var entity = await _data.GetByIdAsync(id, ct);
        if (entity is null) { await Send.NotFoundAsync(ct); return; }

        var isLeader = currentUser.Roles.Contains("QLNP.LD.PCM");
        var isDirector = currentUser.Roles.Contains("QLNP.GD.PGD");

        // Determine approval flow from LeaveConfig
        var approvalLevels = await _data.GetApprovalLevelsAsync(entity.LeaveTypeId, ct);
        var maxLevel = approvalLevels.Count > 0 ? approvalLevels.Max() : 2;
        var isSingleLevel = maxLevel <= 1;

        if (isSingleLevel)
        {
            // 1-level: LD.PCM or GD.PGD can reject pending requests
            if (entity.Status != "pending")
            {
                AddError("Không thể từ chối đơn ở trạng thái này");
                await Send.ErrorsAsync(409, ct); return;
            }

            if (isLeader)
            {
                // LD.PCM: same department scope check, cannot reject own request
                if (entity.UserId == currentUser.UserId ||
                    entity.User.PhongBanId == null ||
                    entity.User.PhongBanId != currentUser.PhongBanId)
                {
                    await Send.ForbiddenAsync(ct); return;
                }
            }
            // GD.PGD: no scope check
        }
        else
        {
            // 2-level: LD.PCM rejects pending (with scope check), GD.PGD rejects approved_leader
            if (isLeader && entity.Status == "pending")
            {
                if (entity.UserId == currentUser.UserId ||
                    entity.User.PhongBanId == null ||
                    entity.User.PhongBanId != currentUser.PhongBanId)
                {
                    await Send.ForbiddenAsync(ct); return;
                }
            }
            else if (isDirector && entity.Status == "approved_leader")
            {
                // GD.PGD rejects approved_leader — no scope check
            }
            else
            {
                AddError("Không thể từ chối đơn ở trạng thái này");
                await Send.ErrorsAsync(409, ct); return;
            }
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