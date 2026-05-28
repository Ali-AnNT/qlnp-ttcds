using QLNP.Api.Shared.Contracts;
using QLNP.Api.Shared.Groups;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Infrastructure.Auth;
using QLNP.Api.Shared.Domain;

namespace QLNP.Api.Features.SystemConfigs.ReplaceLeaveConfigs;

internal sealed class ReplaceLeaveConfigsEndpoint : Endpoint<List<LeaveConfigDto>, Result<ReplaceLeaveConfigsResponse>> {
    public AppDbContext Db { get; set; } = null!;

    public override void Configure() {
        Put("/leave-configs");
        Group<SystemConfigGroup>();
        Roles(AppRoles.Admin);
    }

    public override async Task HandleAsync(List<LeaveConfigDto> req, CancellationToken ct) {
        try {
            Db.LeaveConfigs.RemoveRange(await Db.LeaveConfigs.ToListAsync(ct));

            foreach (var item in req) {
                Db.LeaveConfigs.Add(new LeaveConfig {
                    LeaveTypeId = item.LeaveTypeId,
                    ApprovalLevel = item.ApprovalLevel,
                    ApproverRole = item.ApproverRole
                });
            }

            await Db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException) {
            AddError("Không thể cập nhật cấu hình");
            await Send.ErrorsAsync(409, ct);
            return;
        }

        await Send.OkAsync(Result<ReplaceLeaveConfigsResponse>.Ok(new ReplaceLeaveConfigsResponse("Cập nhật cấu hình thành công")), ct);
    }
}