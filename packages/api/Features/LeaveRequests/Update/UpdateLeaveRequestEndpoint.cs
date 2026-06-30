using QLNP.Api.Shared.Domain;
using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;
using QLNP.Api.Features.LeaveRequests;

namespace QLNP.Api.Features.LeaveRequests.Update;

internal sealed class UpdateLeaveRequestEndpoint : Endpoint<Request, Result<LeaveRequestDto>, UpdateLeaveRequestMapper> {
    public AppDbContext Db { get; set; } = null!;
    public ICurrentUserProvider CurrentUser { get; set; } = null!;

    public override void Configure() {
        Put("/{id}");
        Group<LeaveRequestGroup>();
        Roles(AppRoles.Staff, AppRoles.Leader);
    }

    public override async Task HandleAsync(Request r, CancellationToken ct) {
        var id = Route<long>("id");

        // Business validation (DB-dependent)
        if (!await Db.LeaveTypes.AnyAsync(t => t.Id == r.LeaveTypeId && t.IsActive, ct))
            AddError(r => r.LeaveTypeId, "Loại nghỉ không tồn tại hoặc không còn hiệu lực");

        ThrowIfAnyErrors();

        var entity = await Db.LeaveRequests
            .Include(lr => lr.LeaveType)
            .FirstOrDefaultAsync(lr => lr.Id == id, ct);
        if (entity is null) { await Send.NotFoundAsync(ct); return; }

        var currentUser = CurrentUser.GetCurrentUser();

        // Authorization
        if (entity.UserId != currentUser.UserId) { await Send.ForbiddenAsync(ct); return; }

        // Business rule validation
        if (entity.Status != "pending") {
            AddError("Chỉ có thể sửa đơn đang chờ duyệt");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        // Read work_days config
        var workDaysConfig = await Db.SystemConfigs
            .Where(c => c.ConfigKey == "work_days")
            .Select(c => c.ConfigValue)
            .FirstOrDefaultAsync(ct);

        var workDays = BusinessDayCalculator.ParseWorkDays(workDaysConfig);
        var totalDays = BusinessDayCalculator.Count(r.StartDate, r.EndDate, workDays);
        if (totalDays < 1)
            AddError(r => r.StartDate, "Khoảng thời gian không có ngày làm việc");

        if (await Db.LeaveRequests.AnyAsync(lr =>
                lr.Id != id &&
                lr.UserId == currentUser.UserId &&
                lr.Status == "approved" &&
                lr.StartDate <= r.EndDate &&
                lr.EndDate >= r.StartDate, ct))
            AddError(r => r.StartDate, "Trùng lịch với đơn đã được duyệt");

        ThrowIfAnyErrors();

        // Apply changes
        entity.LeaveTypeId = r.LeaveTypeId;
        entity.StartDate = r.StartDate;
        entity.EndDate = r.EndDate;
        entity.TotalDays = totalDays;
        entity.Reason = r.Reason;
        entity.RequestedApproverId = r.RequestedApproverId;
        entity.UpdatedAt = DateTime.UtcNow;

        try {
            await Db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException) {
            AddError("Không thể cập nhật đơn xin nghỉ (dữ liệu không hợp lệ)");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        var (hoTen, donViId, tenDonVi, _) = await LeaveRequestUserLookup.LoadUserInfoAsync(Db, entity.UserId, ct);
        await Send.OkAsync(Result<LeaveRequestDto>.Ok(entity.MapToDto(hoTen, donViId, tenDonVi)), ct);
    }
}
