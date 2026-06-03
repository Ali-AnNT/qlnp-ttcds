using QLNP.Api.Shared.Domain;
using QLNP.Api.Shared.Contracts;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;
using QLNP.Api.Shared.Groups;
using QLNP.Api.Features.LeaveRequests;

namespace QLNP.Api.Features.LeaveRequests.Create;

internal sealed class CreateLeaveRequestEndpoint : Endpoint<Request, Result<LeaveRequestDto>, CreateLeaveRequestMapper> {
    public AppDbContext Db { get; set; } = null!;
    public ICurrentUserProvider CurrentUser { get; set; } = null!;

    public override void Configure() {
        Post("");
        Group<LeaveRequestGroup>();
        Roles(AppRoles.Staff, AppRoles.Leader);
    }

    public override async Task HandleAsync(Request r, CancellationToken ct) {
        // Business validation (DB-dependent)
        if (!await Db.LeaveTypes.AnyAsync(t => t.Id == r.LeaveTypeId && t.IsActive, ct))
            AddError(r => r.LeaveTypeId, "Loại nghỉ không tồn tại hoặc không còn hiệu lực");

        var totalDays = BusinessDayCalculator.Count(r.StartDate, r.EndDate);
        if (totalDays < 1)
            AddError(r => r.StartDate, "Khoảng thời gian không có ngày làm việc");

        var currentUser = CurrentUser.GetCurrentUser();
        if (await Db.LeaveRequests.AnyAsync(lr =>
                lr.UserId == currentUser.UserId &&
                lr.Status == "approved" &&
                lr.StartDate <= r.EndDate &&
                lr.EndDate >= r.StartDate, ct))
            AddError(r => r.StartDate, "Trùng lịch với đơn đã được duyệt");

        ThrowIfAnyErrors();

        // Create
        var entity = Map.ToEntity(r);
        entity.UserId = currentUser.UserId;
        entity.TotalDays = totalDays;

        try {
            Db.LeaveRequests.Add(entity);
            await Db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException) {
            AddError("Không thể tạo đơn xin nghỉ (dữ liệu không hợp lệ)");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        // Load LeaveType + user info for DTO mapping
        var loaded = await Db.LeaveRequests
            .Include(lr => lr.LeaveType)
            .FirstOrDefaultAsync(lr => lr.Id == entity.Id, ct);
        var (hoTen, donViId, tenDonVi, _) = await LeaveRequestUserLookup.LoadUserInfoAsync(Db, entity.UserId, ct);
        var dto = loaded!.MapToDto(hoTen, donViId, tenDonVi);
        await Send.CreatedAtAsync($"/api/leave-requests/{entity.Id}", Result<LeaveRequestDto>.Ok(dto), cancellation: ct);
    }
}
