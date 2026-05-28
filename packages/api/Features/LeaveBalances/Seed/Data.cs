using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Entities;
using QLNP.Api.Shared.Services;

namespace QLNP.Api.Features.LeaveBalances.Seed;

/// <summary>
/// Ensures a single LeaveBalance row per (UserId, Year).
/// TotalDays = min(max_annual_leave, default_days_{role}) with fallback to max_annual_leave.
/// Idempotent — safe to call multiple times. Unique index (UserId, Year) prevents duplicates.
/// </summary>
public static class Data {
    public static async Task EnsureBalancesAsync(
        AppDbContext db, long userId, int year, CancellationToken ct,
        string? userRole = null) {
        var existing = await db.LeaveBalances
            .AnyAsync(b => b.UserId == userId && b.Year == year, ct);

        if (existing) return;

        // Use service for resolve logic — avoids duplicating config queries
        var balanceService = new LeaveBalanceService(db);
        var (totalDays, role) = await balanceService.ResolveTotalDaysAsync(userRole, ct);

        var balance = new LeaveBalance {
            UserId = userId,
            Year = year,
            TotalDays = totalDays,
            UsedDays = 0,
            Role = role
        };

        db.LeaveBalances.Add(balance);

        try {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException) {
            var entry = db.Entry(balance);
            if (entry.State != EntityState.Detached)
                entry.State = EntityState.Detached;
        }
    }

    /// <summary>
    /// Batch version — ensures balances for multiple users at once.
    /// </summary>
    public static async Task EnsureBalancesForUsersAsync(
        AppDbContext db, IEnumerable<long> userIds, int year, CancellationToken ct) {
        var userIdSet = userIds.ToHashSet();
        if (userIdSet.Count == 0) return;

        var existingUserIds = await db.LeaveBalances
            .Where(b => userIdSet.Contains(b.UserId) && b.Year == year)
            .Select(b => b.UserId)
            .ToListAsync(ct);

        var existingSet = existingUserIds.ToHashSet();
        var missingUserIds = userIdSet.Except(existingSet).ToList();

        if (missingUserIds.Count == 0) return;

        var balanceService = new LeaveBalanceService(db);
        var (defaultTotalDays, _) = await balanceService.ResolveTotalDaysAsync(null, ct);

        // Load user roles for missing users
        var userRoles = await db.UserRoles
            .Where(ur => missingUserIds.Contains(ur.UserId))
            .ToDictionaryAsync(ur => ur.UserId, ur => ur.Role, ct);

        // Load role defaults from SystemConfigs
        var roleDefaults = await balanceService.LoadRoleDefaultsAsync(ct);

        var newBalances = missingUserIds.Select(userId => {
            var role = userRoles.GetValueOrDefault(userId);
            var totalDays = role is not null && roleDefaults.TryGetValue(role, out var rd)
                ? Math.Min(defaultTotalDays, rd)
                : defaultTotalDays;
            return new LeaveBalance {
                UserId = userId,
                Year = year,
                TotalDays = totalDays,
                UsedDays = 0,
                Role = role
            };
        }).ToList();

        db.LeaveBalances.AddRange(newBalances);

        try {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException) {
            foreach (var nb in newBalances) {
                var entry = db.Entry(nb);
                if (entry.State != EntityState.Detached)
                    entry.State = EntityState.Detached;
            }
        }
    }
}
