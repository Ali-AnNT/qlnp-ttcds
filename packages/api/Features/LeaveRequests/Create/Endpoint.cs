using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Auth;

namespace QLNP.Api.Features.LeaveRequests.Create;

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
        Post("/api/leave-requests");
        Roles("CB.PCM", "LD.PCM");
    }

    public override async Task HandleAsync(Request r, CancellationToken ct)
    {
        // Business days check
        var totalDays = BusinessDayCalculator.Count(r.StartDate, r.EndDate);
        if (totalDays < 1)
        {
            AddError("Khoảng thời gian không có ngày làm việc");
            await Send.ErrorsAsync(422, ct);
            return;
        }

        // Overlap check
        var currentUser = _currentUser.GetCurrentUser();
        if (await _data.HasOverlapAsync(currentUser.UserId, r.StartDate, r.EndDate, ct))
        {
            AddError("Trùng lịch với đơn đã được duyệt");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        // Create
        var entity = Map.ToEntity(r);
        entity.UserId = currentUser.UserId;
        entity.TotalDays = totalDays;

        try
        {
            await _data.CreateAsync(entity, ct);
        }
        catch (DbUpdateException)
        {
            AddError("Không thể tạo đơn xin nghỉ (dữ liệu không hợp lệ)");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        // Load nav props for DTO mapping
        var loaded = await _data.GetByIdAsync(entity.Id, ct);
        await Send.CreatedAtAsync($"/api/leave-requests/{entity.Id}",
            Map.FromEntity(loaded!), cancellation: ct);
    }
}