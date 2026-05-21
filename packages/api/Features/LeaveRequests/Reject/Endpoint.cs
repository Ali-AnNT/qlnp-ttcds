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

        // State machine — auto-select role based on entity status (handles dual-role users)
        if (isDirector && entity.Status == "approved_leader")
        {
            // GD.PGD rejects approved_leader — no scope check needed
        }
        else if (isLeader && entity.Status == "pending")
        {
            // LD.PCM rejects pending — apply scope check
            if (entity.UserId == currentUser.UserId ||
                entity.User.PhongBanId == null ||
                entity.User.PhongBanId != currentUser.PhongBanId)
            {
                await Send.ForbiddenAsync(ct); return;
            }
        }
        else
        {
            AddError("Không thể từ chối đơn ở trạng thái này");
            await Send.ErrorsAsync(409, ct); return;
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
