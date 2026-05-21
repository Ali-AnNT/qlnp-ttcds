using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Auth;
using QLNP.Api.Features.LeaveRequests;

namespace QLNP.Api.Features.LeaveRequests.Cancel;

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
        Post("/api/leave-requests/{id}/cancel");
        Roles("QLNP.CB.PCM", "QLNP.LD.PCM");
        Tags("Leave Requests");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var id = Route<long>("id");
        var currentUser = _currentUser.GetCurrentUser();

        var entity = await _data.GetByIdAsync(id, ct);
        if (entity is null) { await Send.NotFoundAsync(ct); return; }

        // Owner check
        if (entity.UserId != currentUser.UserId)
        {
            await Send.ForbiddenAsync(ct); return;
        }

        // Status check (BRULE-006)
        if (entity.Status is not ("pending" or "approved_leader"))
        {
            AddError("Chỉ có thể hủy đơn đang chờ duyệt hoặc đã được trưởng phòng duyệt");
            await Send.ErrorsAsync(409, ct); return;
        }

        entity.Status = "cancelled";
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
