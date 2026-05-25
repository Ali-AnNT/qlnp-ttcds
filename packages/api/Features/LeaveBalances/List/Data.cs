using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Features.LeaveBalances.Seed;

namespace QLNP.Api.Features.LeaveBalances.List;

internal sealed class Data
{
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task<List<LeaveBalanceDto>> GetAllAsync(int? year, long? userId, CancellationToken ct)
    {
        var effectiveYear = year ?? DateTime.UtcNow.Year;

        // Lazy-seed: ensure balance rows exist before querying
        if (userId.HasValue)
        {
            await Seed.Data.EnsureBalancesAsync(_db, userId.Value, effectiveYear, ct);
        }
        else
        {
            // Admin view — seed for all users with QLNP roles
            var userIds = await _db.UserRoles
                .Select(ur => ur.UserId)
                .ToListAsync(ct);
            await Seed.Data.EnsureBalancesForUsersAsync(_db, userIds, effectiveYear, ct);
        }

        var query = _db.LeaveBalances
            .Include(b => b.LeaveType)
            .AsQueryable();

        if (year.HasValue)
            query = query.Where(b => b.Year == year.Value);

        if (userId.HasValue)
            query = query.Where(b => b.UserId == userId.Value);

        return await query
            .OrderBy(b => b.UserId).ThenBy(b => b.LeaveTypeId)
            .Select(b => new LeaveBalanceDto(
                b.Id, b.UserId, b.LeaveTypeId,
                b.LeaveType.Name,
                b.Year, b.TotalDays, b.UsedDays,
                b.TotalDays - b.UsedDays))
            .ToListAsync(ct);
    }
}
