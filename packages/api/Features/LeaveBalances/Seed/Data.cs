using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Entities;

namespace QLNP.Api.Features.LeaveBalances.Seed;

/// <summary>
/// Ensures LeaveBalance rows exist for all active LeaveTypes for a given user+year.
/// Idempotent — safe to call multiple times. Unique index (UserId, LeaveTypeId, Year) prevents duplicates.
/// Callers should re-query LeaveBalances after calling this to get fresh data including seeded rows.
/// </summary>
public static class Data {
    public static async Task EnsureBalancesAsync(
        AppDbContext db, long userId, int year, CancellationToken ct,
        string? userRole = null) {
        var existingTypeIds = await db.LeaveBalances
            .Where(b => b.UserId == userId && b.Year == year)
            .Select(b => b.LeaveTypeId)
            .ToListAsync(ct);

        var activeTypes = await db.LeaveTypes
            .Where(lt => lt.IsActive)
            .ToListAsync(ct);

        var missing = activeTypes.Where(lt => !existingTypeIds.Contains(lt.Id)).ToList();

        if (missing.Count == 0) return;

        // Load role-based default days from SystemConfigs if role provided
        Dictionary<string, string>? roleConfigMap = null;
        if (userRole is not null) {
            var suffix = userRole.Replace("QLNP.", "");
            roleConfigMap = await db.SystemConfigs
                .Where(c => c.ConfigKey == $"default_days_{suffix}")
                .ToDictionaryAsync(c => c.ConfigKey, c => c.ConfigValue, ct);
        }

        var npnType = activeTypes.FirstOrDefault(lt => lt.Code == "NPN");

        var newBalances = missing.Select(lt => new LeaveBalance {
            UserId = userId,
            LeaveTypeId = lt.Id,
            Year = year,
            TotalDays = ResolveTotalDays(lt, npnType?.Id, userRole, roleConfigMap),
            UsedDays = 0
        }).ToList();

        db.LeaveBalances.AddRange(newBalances);

        try {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException) {
            // Concurrent insert hit unique index — detach tracked new entries.
            // Caller will re-query to get all rows including the one inserted by the concurrent request.
            foreach (var nb in newBalances) {
                var entry = db.Entry(nb);
                if (entry.State != EntityState.Detached)
                    entry.State = EntityState.Detached;
            }
        }
    }

    private static decimal ResolveTotalDays(
        LeaveType lt, long? npnTypeId, string? userRole,
        Dictionary<string, string>? roleConfigMap) {
        if (userRole is not null && npnTypeId.HasValue && lt.Id == npnTypeId.Value && roleConfigMap is not null) {
            var suffix = userRole.Replace("QLNP.", "");
            var key = $"default_days_{suffix}";
            if (roleConfigMap.TryGetValue(key, out var val) && decimal.TryParse(val, out var days))
                return days;
        }
        return lt.DefaultDays;
    }

    /// <summary>
    /// Batch version — ensures balances for multiple users at once.
    /// More efficient than N individual calls for admin List endpoint.
    /// </summary>
    public static async Task EnsureBalancesForUsersAsync(
        AppDbContext db, IEnumerable<long> userIds, int year, CancellationToken ct) {
        var userIdSet = userIds.ToHashSet();
        if (userIdSet.Count == 0) return;

        var existingKeys = await db.LeaveBalances
            .Where(b => userIdSet.Contains(b.UserId) && b.Year == year)
            .Select(b => new { b.UserId, b.LeaveTypeId })
            .ToListAsync(ct);

        var existingKeySet = existingKeys
            .Select(k => (k.UserId, k.LeaveTypeId))
            .ToHashSet();

        var activeTypes = await db.LeaveTypes
            .Where(lt => lt.IsActive)
            .ToListAsync(ct);

        var newBalances = new List<LeaveBalance>();
        foreach (var userId in userIdSet) {
            foreach (var lt in activeTypes) {
                if (!existingKeySet.Contains((userId, lt.Id))) {
                    newBalances.Add(new LeaveBalance {
                        UserId = userId,
                        LeaveTypeId = lt.Id,
                        Year = year,
                        TotalDays = lt.DefaultDays,
                        UsedDays = 0
                    });
                }
            }
        }

        if (newBalances.Count == 0) return;

        db.LeaveBalances.AddRange(newBalances);

        try {
            await db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException) {
            // Concurrent insert hit unique index — detach tracked new entries.
            // Caller will re-query to get all rows including concurrent inserts.
            foreach (var nb in newBalances) {
                var entry = db.Entry(nb);
                if (entry.State != EntityState.Detached)
                    entry.State = EntityState.Detached;
            }
        }
    }
}
