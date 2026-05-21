using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Features.LeaveBalances.My;

internal sealed class Data
{
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task<List<LeaveBalanceDto>> GetByUserIdAsync(long userId, int? year, CancellationToken ct)
    {
        var query = _db.LeaveBalances
            .Include(b => b.LeaveType)
            .Where(b => b.UserId == userId);

        if (year.HasValue)
            query = query.Where(b => b.Year == year.Value);

        return await query
            .OrderBy(b => b.LeaveTypeId)
            .Select(b => new LeaveBalanceDto(
                b.Id, b.UserId, b.LeaveTypeId,
                b.LeaveType.Name,
                b.Year, b.TotalDays, b.UsedDays,
                b.TotalDays - b.UsedDays))
            .ToListAsync(ct);
    }
}
