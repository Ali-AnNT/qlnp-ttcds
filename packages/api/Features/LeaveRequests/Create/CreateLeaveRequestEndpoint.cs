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
        Roles(AppRoles.Staff, AppRoles.Leader, AppRoles.Director, AppRoles.Admin);
    }

    public override async Task HandleAsync(Request r, CancellationToken ct) {
        // Business validation (DB-dependent)
        if (!await Db.LeaveTypes.AnyAsync(t => t.Id == r.LeaveTypeId && t.IsActive, ct))
            AddError(r => r.LeaveTypeId, "Loại nghỉ không tồn tại hoặc không còn hiệu lực");

        // Validate LeaveConfig exists for this leave type
        var configs = await Db.LeaveConfigs
            .Where(c => c.LeaveTypeId == r.LeaveTypeId)
            .OrderBy(c => c.ApprovalLevel)
            .ToListAsync(ct);
        if (configs.Count == 0) {
            AddError("Chưa cấu hình phê duyệt cho loại phép này");
            await Send.ErrorsAsync(403, ct);
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

        var currentUser = CurrentUser.GetCurrentUser();
        if (await Db.LeaveRequests.AnyAsync(lr =>
                lr.UserId == currentUser.UserId &&
                lr.Status != "cancelled" &&
                lr.StartDate <= r.EndDate &&
                lr.EndDate >= r.StartDate, ct))
            AddError(r => r.StartDate, "Trùng lịch với đơn đã gửi");

        ThrowIfAnyErrors();

        // Create entity
        var entity = Map.ToEntity(r);
        entity.UserId = currentUser.UserId;
        entity.TotalDays = totalDays;

        // Auto-approve logic for approver-role users
        var flow = ApprovalHelper.GetApprovalFlow(configs);
        var maxLevel = ApprovalHelper.GetMaxLevel(flow);
        var autoLevel = ApprovalHelper.GetAutoApproveLevel(currentUser, flow);

        if (autoLevel == ApprovalHelper.AutoApproveAll || (autoLevel > 0 && autoLevel >= maxLevel)) {
            // Auto-approve all levels → status = approved
            entity.ApprovedLevel = maxLevel;
            entity.Status = "approved";
            entity.ApprovedBy = currentUser.UserId;
            entity.ApprovedAt = DateTime.UtcNow;
        } else if (autoLevel > 0) {
            // Partial auto-approve → still pending, higher levels remain
            entity.ApprovedLevel = autoLevel;
            entity.ApprovedBy = currentUser.UserId;
            entity.ApprovedAt = DateTime.UtcNow;
        }
        // else autoLevel == 0 → default pending (no changes needed)

        try {
            Db.LeaveRequests.Add(entity);
            // If fully auto-approved → deduct balance in same transaction
            if (entity.Status == "approved") {
                await ApprovalBalanceService.UpsertBalanceForApprovalAsync(entity, Db, ct);
            }
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
        await Send.OkAsync(Result<LeaveRequestDto>.Ok(dto), ct);
    }
}
