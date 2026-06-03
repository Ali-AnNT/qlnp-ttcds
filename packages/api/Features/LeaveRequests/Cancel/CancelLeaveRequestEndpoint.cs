using QLNP.Api.Shared.Domain;
using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;
using QLNP.Api.Features.LeaveRequests;

namespace QLNP.Api.Features.LeaveRequests.Cancel;

internal sealed class CancelLeaveRequestEndpoint : EndpointWithoutRequest<Result<LeaveRequestDto>> {
    public AppDbContext Db { get; set; } = null!;
    public ICurrentUserProvider CurrentUser { get; set; } = null!;

    public override void Configure() {
        Post("/{id}/cancel");
        Group<LeaveRequestGroup>();
        Roles(AppRoles.Staff, AppRoles.Leader);
    }

    public override async Task HandleAsync(CancellationToken ct) {
        var id = Route<long>("id");
        var currentUser = CurrentUser.GetCurrentUser();

        var entity = await Db.LeaveRequests
            .Include(lr => lr.LeaveType)
            .FirstOrDefaultAsync(lr => lr.Id == id, ct);
        if (entity is null) { await Send.NotFoundAsync(ct); return; }

        // Owner check
        if (entity.UserId != currentUser.UserId) {
            await Send.ForbiddenAsync(ct); return;
        }

        // Can only cancel pending requests (including partially approved)
        if (entity.Status != "pending") {
            AddError("Chỉ có thể hủy đơn đang chờ duyệt");
            await Send.ErrorsAsync(409, ct); return;
        }

        entity.Status = "cancelled";
        entity.UpdatedAt = DateTime.UtcNow;

        try {
            await Db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException) {
            AddError("Không thể xử lý đơn xin nghỉ");
            await Send.ErrorsAsync(409, ct); return;
        }

        var (hoTen, donViId, tenDonVi, _) = await LeaveRequestUserLookup.LoadUserInfoAsync(Db, entity.UserId, ct);
        await Send.OkAsync(Result<LeaveRequestDto>.Ok(entity.MapToDto(hoTen, donViId, tenDonVi)), ct);
    }
}
