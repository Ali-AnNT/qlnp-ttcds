using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Auth;
using QLNP.Api.Features.LeaveRequests;

namespace QLNP.Api.Features.LeaveRequests.Approve;

internal sealed class Endpoint : EndpointWithoutRequest<Response>
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
        Put("/api/leave-requests/{id}/approve");
        Roles("QLNP.LD.PCM", "QLNP.GD.PGD");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<long>("id");
        var currentUser = _currentUser.GetCurrentUser();

        var entity = await _data.GetByIdAsync(id, ct);
        if (entity is null) { await Send.NotFoundAsync(ct); return; }

        var isLeader = currentUser.Roles.Contains("QLNP.LD.PCM");
        var isDirector = currentUser.Roles.Contains("QLNP.GD.PGD");

        // Auto-select role based on entity status (handles dual-role users)
        if (isDirector && entity.Status == "approved_leader")
        {
            // GD.PGD approves approved_leader → approved_director
            entity.Status = "approved_director";
            entity.ApprovedBy = currentUser.UserId;
            entity.ApprovedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;

            if (!await _data.UpsertBalanceAsync(entity, ct))
            {
                AddError("Nhân viên đã vượt quá định mức ngày phép");
                await Send.ErrorsAsync(422, ct); return;
            }
        }
        else if (isLeader && entity.Status == "pending")
        {
            // LD.PCM scope: cùng phòng AND không phải đơn của mình
            if (entity.UserId == currentUser.UserId)
            {
                await Send.ForbiddenAsync(ct); return;
            }
            if (entity.User.PhongBanId == null || entity.User.PhongBanId != currentUser.PhongBanId)
            {
                await Send.ForbiddenAsync(ct); return;
            }

            entity.Status = "approved_leader";
            entity.ApprovedBy = currentUser.UserId;
            entity.ApprovedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            AddError("Không thể duyệt đơn ở trạng thái này");
            await Send.ErrorsAsync(409, ct); return;
        }

        try
        {
            await _data.SaveAsync(ct);
        }
        catch (DbUpdateException)
        {
            AddError("Không thể xử lý đơn xin nghỉ");
            await Send.ErrorsAsync(409, ct); return;
        }

        await Send.OkAsync(new Response(entity.MapToDto()), ct);
    }
}