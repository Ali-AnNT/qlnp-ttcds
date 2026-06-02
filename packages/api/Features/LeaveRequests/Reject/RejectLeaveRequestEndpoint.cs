using QLNP.Api.Shared.Domain;
using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;
using QLNP.Api.Features.LeaveRequests;

namespace QLNP.Api.Features.LeaveRequests.Reject;

internal sealed class RejectLeaveRequestEndpoint : Endpoint<Request, Result<LeaveRequestDto>> {
    public AppDbContext Db { get; set; } = null!;
    public ICurrentUserProvider CurrentUser { get; set; } = null!;

    public override void Configure() {
        Post("/{id}/reject");
        Group<LeaveRequestGroup>();
        Roles(AppRoles.Leader, AppRoles.Director);
    }

    public override async Task HandleAsync(Request r, CancellationToken ct) {
        var id = Route<long>("id");
        var currentUser = CurrentUser.GetCurrentUser();

        var entity = await Db.LeaveRequests
            .Include(lr => lr.User).ThenInclude(u => u!.DonVi)
            .Include(lr => lr.LeaveType)
            .FirstOrDefaultAsync(lr => lr.Id == id, ct);
        if (entity is null) { await Send.NotFoundAsync(ct); return; }

        // Only pending requests can be rejected
        if (entity.Status != "pending") {
            AddError("Không thể từ chối đơn ở trạng thái này");
            await Send.ErrorsAsync(409, ct); return;
        }

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
        var targetLevel = entity.ApprovedLevel + 1;

        // Check if user can reject at this level
        var (canApprove, errorMessage) = ApprovalHelper.CanApproveAtLevel(currentUser, entity, flow, targetLevel);
        if (!canApprove) {
            AddError(errorMessage ?? "Bạn không có quyền từ chối đơn này");
            await Send.ErrorsAsync(403, ct); return;
        }

        entity.Status = "rejected";
        entity.RejectedReason = r.RejectedReason;
        entity.UpdatedAt = DateTime.UtcNow;

        try {
            await Db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException) {
            AddError("Không thể xử lý đơn xin nghỉ");
            await Send.ErrorsAsync(409, ct); return;
        }

        await Send.OkAsync(Result<LeaveRequestDto>.Ok(entity.MapToDto()), ct);
    }
}