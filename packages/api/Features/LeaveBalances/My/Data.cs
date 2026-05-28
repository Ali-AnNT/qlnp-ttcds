using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Features.LeaveBalances.Seed;

namespace QLNP.Api.Features.LeaveBalances.My;

internal sealed class Data {
    private readonly AppDbContext _db;

    public Data(AppDbContext db) => _db = db;

    public async Task<List<LeaveBalanceDto>> GetByUserIdAsync(long userId, int? year, string? userRole, CancellationToken ct) {
        var effectiveYear = year ?? DateTime.UtcNow.Year;

        // Lazy-seed: ensure balance rows exist for all active leave types
        await Seed.Data.EnsureBalancesAsync(_db, userId, effectiveYear, ct, userRole);

        // Correct unused NPN balance if role-based default differs
        await CorrectNpnBalanceAsync(userId, effectiveYear, userRole, ct);

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

    private async Task CorrectNpnBalanceAsync(long userId, int year, string? userRole, CancellationToken ct) {
        if (userRole is null) return;

        var npnType = await _db.LeaveTypes.FirstOrDefaultAsync(lt => lt.Code == "NPN" && lt.IsActive, ct);
        if (npnType is null) return;

        var suffix = userRole.Replace("QLNP.", "");
        var configKey = $"default_days_{suffix}";
        var config = await _db.SystemConfigs.FirstOrDefaultAsync(c => c.ConfigKey == configKey, ct);
        if (config is null) return;

        if (!decimal.TryParse(config.ConfigValue, out var roleDefault)) return;

        var balance = await _db.LeaveBalances
            .FirstOrDefaultAsync(b => b.UserId == userId && b.LeaveTypeId == npnType.Id && b.Year == year, ct);

        if (balance is not null && balance.UsedDays == 0 && balance.TotalDays != roleDefault) {
            balance.TotalDays = roleDefault;
            await _db.SaveChangesAsync(ct);
        }
    }
}
