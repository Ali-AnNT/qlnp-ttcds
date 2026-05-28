using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Shared.Domain;

public class LeaveBalanceService : ILeaveBalanceService {
    private readonly AppDbContext _db;

    public LeaveBalanceService(AppDbContext db) => _db = db;

    public async Task RecalculateCurrentYearAsync(CancellationToken ct) {
        var year = DateTime.UtcNow.Year;
        var (maxAnnual, _) = await ResolveTotalDaysAsync(null, ct);
        var roleDefaults = await LoadRoleDefaultsAsync(ct);

        var balances = await _db.LeaveBalances
            .Where(b => b.Year == year)
            .ToListAsync(ct);

        var userIds = balances.Select(b => b.UserId).Distinct().ToList();
        var userRoles = await _db.UserRoles
            .Where(ur => userIds.Contains(ur.UserId))
            .ToDictionaryAsync(ur => ur.UserId, ur => ur.Role, ct);

        foreach (var balance in balances) {
            var role = userRoles.GetValueOrDefault(balance.UserId);
            balance.TotalDays = role is not null && roleDefaults.TryGetValue(role, out var rd)
                ? Math.Min(maxAnnual, rd)
                : maxAnnual;
            balance.Role = role;
        }

        await _db.SaveChangesAsync(ct);
    }

    public async Task RecalculateUserAsync(long userId, CancellationToken ct) {
        var year = DateTime.UtcNow.Year;
        var balance = await _db.LeaveBalances
            .FirstOrDefaultAsync(b => b.UserId == userId && b.Year == year, ct);

        if (balance is null) return;

        var userRole = await _db.UserRoles
            .Where(ur => ur.UserId == userId)
            .Select(ur => ur.Role)
            .FirstOrDefaultAsync(ct);

        var (maxAnnual, _) = await ResolveTotalDaysAsync(null, ct);
        var roleDefaults = await LoadRoleDefaultsAsync(ct);

        balance.TotalDays = userRole is not null && roleDefaults.TryGetValue(userRole, out var rd)
            ? Math.Min(maxAnnual, rd)
            : maxAnnual;
        balance.Role = userRole;

        await _db.SaveChangesAsync(ct);
    }

    public async Task UpsertRoleAndRecalculateAsync(long userId, string role, CancellationToken ct) {
        var existingRole = await _db.UserRoles.FindAsync([userId], ct);
        bool roleChanged = false;

        if (existingRole is null) {
            var newRole = new UserRole {
                UserId = userId,
                Role = role,
                UpdatedAt = DateTime.UtcNow
            };
            _db.UserRoles.Add(newRole);
            roleChanged = true;

            try {
                await _db.SaveChangesAsync(ct);
            }
            catch (DbUpdateException) {
                // Concurrent insert — another request already created this role
                var entry = _db.Entry(newRole);
                if (entry.State != EntityState.Detached)
                    entry.State = EntityState.Detached;
                roleChanged = false;
            }
        }
        else if (existingRole.Role != role) {
            existingRole.Role = role;
            existingRole.UpdatedAt = DateTime.UtcNow;
            roleChanged = true;
            await _db.SaveChangesAsync(ct);
        }

        if (roleChanged) {
            await RecalculateUserAsync(userId, ct);
        }
    }

    public async Task<(decimal totalDays, string? role)> ResolveTotalDaysAsync(
        string? userRole, CancellationToken ct) {
        const decimal fallback = 12m;
        var maxConfig = await _db.SystemConfigs
            .FirstOrDefaultAsync(c => c.ConfigKey == "max_annual_leave", ct);
        decimal maxAnnual = maxConfig is not null && decimal.TryParse(maxConfig.ConfigValue, out var v) ? v : fallback;

        if (userRole is null) return (maxAnnual, null);

        var roleDefaults = await LoadRoleDefaultsAsync(ct);
        if (roleDefaults.TryGetValue(userRole, out var roleDefault))
            return (Math.Min(maxAnnual, roleDefault), userRole);

        return (maxAnnual, userRole);
    }

    internal async Task<Dictionary<string, decimal>> LoadRoleDefaultsAsync(CancellationToken ct) {
        var configs = await _db.SystemConfigs
            .Where(c => c.ConfigKey.StartsWith("default_days_"))
            .ToListAsync(ct);

        var result = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        foreach (var c in configs) {
            var suffix = c.ConfigKey["default_days_".Length..];
            if (decimal.TryParse(c.ConfigValue, out var val))
                result[$"QLNP.{suffix}"] = val;
        }

        return result;
    }
}
