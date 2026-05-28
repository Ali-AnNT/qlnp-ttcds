using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Features.LeaveBalances.Seed;

namespace QLNP.Api.Features.LeaveBalances.My;

internal sealed class Data {
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task<List<LeaveBalanceDto>> GetByUserIdAsync(long userId, int? year, string? userRole, CancellationToken ct) {
        var effectiveYear = year ?? DateTime.UtcNow.Year;

        // Lazy-seed: ensure balance row exists for this user+year
        await Seed.Data.EnsureBalancesAsync(_db, userId, effectiveYear, ct, userRole);

        var query = _db.LeaveBalances
            .Where(b => b.UserId == userId);

        if (year.HasValue)
            query = query.Where(b => b.Year == year.Value);

        return await query
            .OrderBy(b => b.Year)
            .Select(b => new LeaveBalanceDto(
                b.Id, b.UserId,
                b.Year, b.TotalDays, b.UsedDays,
                b.TotalDays - b.UsedDays,
                b.Role))
            .ToListAsync(ct);
    }
}
