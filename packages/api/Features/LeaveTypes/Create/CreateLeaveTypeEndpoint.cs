using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;
using QLNP.Api.Shared.Domain;

namespace QLNP.Api.Features.LeaveTypes.Create;

internal sealed class CreateLeaveTypeEndpoint : Endpoint<Request, Result<LeaveTypeDto>, Mapper> {
    public AppDbContext Db { get; set; } = null!;

    public override void Configure() {
        Post("");
        Group<LeaveTypeGroup>();
        Roles(AppRoles.Admin);
    }

    public override async Task HandleAsync(Request r, CancellationToken ct) {
        // Business validation (DB-dependent)
        if (await Db.LeaveTypes.AnyAsync(t => t.Code == r.Code, ct))
            AddError(r => r.Code, "Mã loại nghỉ đã tồn tại");

        ThrowIfAnyErrors();

        var entity = Map.ToEntity(r);

        try {
            Db.LeaveTypes.Add(entity);
            await Db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException) {
            AddError("Không thể tạo loại nghỉ (mã có thể đã tồn tại)");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        var dto = new LeaveTypeDto(entity.Id, entity.Name, entity.Code,
            entity.DefaultDays, entity.Description, entity.IsActive);

        await Send.CreatedAtAsync(
            $"/api/leave-types/{entity.Id}",
            Result<LeaveTypeDto>.Ok(dto),
            cancellation: ct);
    }
}