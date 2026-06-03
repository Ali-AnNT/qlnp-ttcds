using QLNP.Api.Shared.Domain;
using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;
using QLNP.Api.Features.LeaveRequests;

namespace QLNP.Api.Features.LeaveRequests.Approve;

internal sealed class ApproveLeaveRequestEndpoint : EndpointWithoutRequest<Result<LeaveRequestDto>> {
    public AppDbContext Db { get; set; } = null!;
    public ICurrentUserProvider CurrentUser { get; set; } = null!;

    public override void Configure() {
        Post("/{id}/approve");
        Group<LeaveRequestGroup>();
        Roles(AppRoles.Leader, AppRoles.Director);
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var id = Route<long>("id");
        var currentUser = CurrentUser.GetCurrentUser();

        var entity = await Db.LeaveRequests
            .Include(lr => lr.LeaveType)
            .FirstOrDefaultAsync(lr => lr.Id == id, ct);
        if (entity is null) { await Send.NotFoundAsync(ct); return; }

        // Load requester info for approval scope check + DTO mapping
        var (hoTen, donViId, tenDonVi, requesterPhongBanId) = await LeaveRequestUserLookup.LoadUserInfoAsync(Db, entity.UserId, ct);

        // Get approval config for this leave type
        var configs = await Db.LeaveConfigs
            .Where(c => c.LeaveTypeId == entity.LeaveTypeId)
            .OrderBy(c => c.ApprovalLevel)
            .ToListAsync(ct);
        if (configs.Count == 0) {
            AddError("Chưa cấu hình phê duyệt cho loại phép này");
            await Send.ErrorsAsync(403, ct); return;
        }

        var flow = ApprovalHelper.GetApprovalFlow(configs);
        var maxLevel = ApprovalHelper.GetMaxLevel(flow);
        var targetLevel = entity.ApprovedLevel + 1;

        // Check if already fully approved
        if (targetLevel > maxLevel) {
            AddError("Đơn đã được phê duyệt");
            await Send.ErrorsAsync(409, ct); return;
        }

        // Check if request is in correct state
        if (entity.Status != "pending") {
            AddError("Không thể duyệt đơn ở trạng thái này");
            await Send.ErrorsAsync(409, ct); return;
        }

        // Check if user can approve at this level
        var (canApprove, errorMessage) = ApprovalHelper.CanApproveAtLevel(currentUser, entity, requesterPhongBanId, flow, targetLevel);
        if (!canApprove) {
            AddError(errorMessage ?? "Bạn không có quyền phê duyệt đơn này");
            await Send.ErrorsAsync(403, ct); return;
        }

        // Approve: increment ApprovedLevel
        entity.ApprovedLevel = targetLevel;
        entity.ApprovedBy = currentUser.UserId;
        entity.ApprovedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        // If this is the final level, mark as approved and deduct balance
        if (targetLevel == maxLevel) {
            entity.Status = "approved";
            await ApprovalBalanceService.UpsertBalanceForApprovalAsync(entity, Db, ct);
        }
        // Otherwise stays pending (partially approved)

        try {
            await Db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException) {
            AddError("Không thể xử lý đơn xin nghỉ");
            await Send.ErrorsAsync(409, ct); return;
        }

        await Send.OkAsync(Result<LeaveRequestDto>.Ok(entity.MapToDto(hoTen, donViId, tenDonVi)), ct);
    }
}
