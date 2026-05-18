using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveRequests.Approve;

internal sealed class Data
{
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task<LeaveRequest?> GetByIdAsync(long id, CancellationToken ct) =>
        await _db.LeaveRequests
            .Include(lr => lr.User).ThenInclude(u => u!.DonVi)
            .Include(lr => lr.LeaveType)
            .FirstOrDefaultAsync(lr => lr.Id == id, ct);

    // Returns false if UsedDays would exceed TotalDays
    public async Task<bool> UpsertBalanceAsync(LeaveRequest entity, CancellationToken ct)
    {
        var year = entity.StartDate.Year;
        var balance = await _db.LeaveBalances
            .FirstOrDefaultAsync(b =>
                b.UserId == entity.UserId &&
                b.LeaveTypeId == entity.LeaveTypeId &&
                b.Year == year, ct);

        if (balance is null)
        {
            balance = new LeaveBalance
            {
                UserId = entity.UserId,
                LeaveTypeId = entity.LeaveTypeId,
                Year = year,
                TotalDays = entity.LeaveType.DefaultDays,
                UsedDays = 0
            };
            _db.LeaveBalances.Add(balance);
        }

        if (balance.UsedDays + entity.TotalDays > balance.TotalDays)
            return false;

        balance.UsedDays += entity.TotalDays;
        return true;
    }

    public async Task SaveAsync(CancellationToken ct) =>
        await _db.SaveChangesAsync(ct);
}