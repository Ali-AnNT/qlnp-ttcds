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
            await UpsertBalanceForApprovalAsync(entity, ct);
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

    private async Task UpsertBalanceForApprovalAsync(LeaveRequest entity, CancellationToken ct) {
        var year = entity.StartDate.Year;
        var balance = await Db.LeaveBalances
            .FirstOrDefaultAsync(b =>
                b.UserId == entity.UserId &&
                b.Year == year, ct);

        if (balance is null) {
            var userRole = await Db.UserRoles
                .Where(ur => ur.UserId == entity.UserId)
                .Select(ur => ur.Role)
                .FirstOrDefaultAsync(ct);
            var (totalDays, role) = await ResolveTotalDaysAsync(userRole, ct);

            balance = new LeaveBalance {
                UserId = entity.UserId,
                Year = year,
                TotalDays = totalDays,
                UsedDays = 0,
                Role = role
            };
            Db.LeaveBalances.Add(balance);
        }

        // Allow over-limit: remaining can go negative
        balance.UsedDays += entity.TotalDays;
    }

    private async Task<(decimal totalDays, string? role)> ResolveTotalDaysAsync(string? userRole, CancellationToken ct) {
        const decimal fallback = 12m;
        var maxConfig = await Db.SystemConfigs
            .FirstOrDefaultAsync(c => c.ConfigKey == "max_annual_leave", ct);
        decimal maxAnnual = maxConfig is not null && decimal.TryParse(maxConfig.ConfigValue, out var v) ? v : fallback;

        if (userRole is null) return (maxAnnual, null);

        var configs = await Db.SystemConfigs
            .Where(c => c.ConfigKey.StartsWith("default_days_"))
            .ToListAsync(ct);

        var roleDefaults = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        foreach (var c in configs) {
            var suffix = c.ConfigKey["default_days_".Length..];
            if (decimal.TryParse(c.ConfigValue, out var val))
                roleDefaults[$"QLNP.{suffix}"] = val;
        }

        if (roleDefaults.TryGetValue(userRole, out var roleDefault))
            return (Math.Min(maxAnnual, roleDefault), userRole);

        return (maxAnnual, userRole);
    }
}
