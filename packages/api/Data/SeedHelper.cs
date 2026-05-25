using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Entities;

namespace QLNP.Api.Data;

/// <summary>
/// One-time and yearly startup seed for LeaveBalances.
/// Creates balance rows for all active users × active leave types for the current year.
/// Idempotent — safe to run on every app start.
/// </summary>
public static class SeedHelper
{
    public static async Task SeedLeaveBalancesAsync(AppDbContext db)
    {
        var year = DateTime.UtcNow.Year;

        var userIds = await db.UserMaster
            .Where(u => u.Used == true)
            .Select(u => (long)u.UserMasterId)
            .ToListAsync();

        if (userIds.Count == 0) return;

        await Features.LeaveBalances.Seed.Data.EnsureBalancesForUsersAsync(db, userIds, year, CancellationToken.None);
    }
}