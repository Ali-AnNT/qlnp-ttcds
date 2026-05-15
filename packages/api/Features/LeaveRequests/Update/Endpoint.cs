using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Auth;

namespace QLNP.Api.Features.LeaveRequests.Update;

internal sealed class Endpoint : Endpoint<Request, Response, Mapper>
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
        Put("/api/leave-requests/{id}");
        Roles("CB.PCM", "LD.PCM");
    }

    public override async Task HandleAsync(Request r, CancellationToken ct)
    {
        var id = Route<long>("id");

        var entity = await _data.GetByIdAsync(id, ct);
        if (entity is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        var currentUser = _currentUser.GetCurrentUser();

        // Owner check
        if (entity.UserId != currentUser.UserId)
        {
            await Send.ForbiddenAsync(ct);
            return;
        }

        // Status check
        if (entity.Status != "pending")
        {
            AddError("Chỉ có thể sửa đơn đang chờ duyệt");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        // Business days
        var totalDays = BusinessDayCalculator.Count(r.StartDate, r.EndDate);
        if (totalDays < 1)
        {
            AddError("Khoảng thời gian không có ngày làm việc");
            await Send.ErrorsAsync(422, ct);
            return;
        }

        // Overlap (exclude self)
        if (await _data.HasOverlapAsync(currentUser.UserId, r.StartDate, r.EndDate, id, ct))
        {
            AddError("Trùng lịch với đơn đã được duyệt");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        // Apply changes
        entity.LeaveTypeId = r.LeaveTypeId;
        entity.StartDate = r.StartDate;
        entity.EndDate = r.EndDate;
        entity.TotalDays = totalDays;
        entity.Reason = r.Reason;
        entity.RequestedApproverId = r.RequestedApproverId;
        entity.UpdatedAt = DateTime.UtcNow;

        try
        {
            await _data.SaveAsync(ct);
        }
        catch (DbUpdateException)
        {
            AddError("Không thể cập nhật đơn xin nghỉ (dữ liệu không hợp lệ)");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        await Send.OkAsync(Map.FromEntity(entity), ct);
    }
}