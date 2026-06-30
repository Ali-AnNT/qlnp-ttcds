using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Shared.Domain;

/// <summary>
/// Shared service for upserting leave balances upon approval.
/// Used by both manual approve and auto-approve flows.
/// </summary>
public static class ApprovalBalanceService {
    /// <summary>
    /// Upserts the leave balance for a request's user/year, adding TotalDays to UsedDays.
    /// Creates balance record if not exists (resolves default days from config + role).
    /// </summary>
    public static async Task UpsertBalanceForApprovalAsync(
        LeaveRequest entity, AppDbContext db, CancellationToken ct) {
        var year = entity.StartDate.Year;
        var balance = await db.LeaveBalances
            .FirstOrDefaultAsync(b =>
                b.UserId == entity.UserId &&
                b.Year == year, ct);

        if (balance is null) {
            var userRole = await db.UserRoles
                .Where(ur => ur.UserId == entity.UserId)
                .Select(ur => ur.Role)
                .FirstOrDefaultAsync(ct);
            var (totalDays, role) = await ResolveTotalDaysAsync(userRole, db, ct);

            balance = new LeaveBalance {
                UserId = entity.UserId,
                Year = year,
                TotalDays = totalDays,
                UsedDays = 0,
                Role = role
            };
            db.LeaveBalances.Add(balance);
        }

        // Allow over-limit: remaining can go negative
        balance.UsedDays += entity.TotalDays;
    }

    /// <summary>
    /// Resolves total default days and role for a user's leave balance creation.
    /// Reads from SystemConfigs (max_annual_leave, default_days_*).
    /// </summary>
    private static async Task<(decimal totalDays, string? role)> ResolveTotalDaysAsync(
        string? userRole, AppDbContext db, CancellationToken ct) {
        const decimal fallback = 12m;
        var maxConfig = await db.SystemConfigs
            .FirstOrDefaultAsync(c => c.ConfigKey == "max_annual_leave", ct);
        decimal maxAnnual = maxConfig is not null && decimal.TryParse(maxConfig.ConfigValue, out var v) ? v : fallback;

        if (userRole is null) return (maxAnnual, null);

        var configs = await db.SystemConfigs
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