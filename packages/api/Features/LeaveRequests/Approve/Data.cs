using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Entities;
using QLNP.Api.Shared.Services;

namespace QLNP.Api.Features.LeaveRequests.Approve;

internal sealed class Data {
    private readonly AppDbContext _db;
    private readonly ILeaveBalanceService _balanceService;

    public Data(AppDbContext db, ILeaveBalanceService balanceService) {
        _db = db;
        _balanceService = balanceService;
    }

    public async Task<LeaveRequest?> GetByIdAsync(long id, CancellationToken ct) =>
        await _db.LeaveRequests
            .Include(lr => lr.User).ThenInclude(u => u!.DonVi)
            .Include(lr => lr.LeaveType)
            .FirstOrDefaultAsync(lr => lr.Id == id, ct);

    public async Task<List<LeaveConfig>> GetApprovalConfigsAsync(long leaveTypeId, CancellationToken ct) =>
        await _db.LeaveConfigs
            .Where(c => c.LeaveTypeId == leaveTypeId)
            .OrderBy(c => c.ApprovalLevel)
            .ToListAsync(ct);

    public async Task UpsertBalanceAsync(LeaveRequest entity, CancellationToken ct) {
        var year = entity.StartDate.Year;
        var balance = await _db.LeaveBalances
            .FirstOrDefaultAsync(b =>
                b.UserId == entity.UserId &&
                b.Year == year, ct);

        if (balance is null) {
            var userRole = await _db.UserRoles
                .Where(ur => ur.UserId == entity.UserId)
                .Select(ur => ur.Role)
                .FirstOrDefaultAsync(ct);
            var (totalDays, role) = await _balanceService.ResolveTotalDaysAsync(userRole, ct);

            balance = new LeaveBalance {
                UserId = entity.UserId,
                Year = year,
                TotalDays = totalDays,
                UsedDays = 0,
                Role = role
            };
            _db.LeaveBalances.Add(balance);
        }

        // Allow over-limit: remaining can go negative
        balance.UsedDays += entity.TotalDays;
    }

    public async Task SaveAsync(CancellationToken ct) =>
        await _db.SaveChangesAsync(ct);
}
