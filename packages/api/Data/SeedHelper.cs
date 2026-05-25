using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Entities;

namespace QLNP.Api.Data;

/// <summary>
/// One-time and yearly startup seed for LeaveBalances.
/// Creates balance rows for all QLNP-role users × active leave types for the current year.
/// Idempotent — safe to run on every app start.
/// </summary>
public static class SeedHelper
{
    public static async Task SeedLeaveBalancesAsync(AppDbContext db)
    {
        var year = DateTime.UtcNow.Year;

        // Get all user IDs that have QLNP roles (UserId is PK, so Distinct is unnecessary)
        var userIds = await db.UserRoles
            .Select(ur => ur.UserId)
            .ToListAsync();

        if (userIds.Count == 0) return;

        await Features.LeaveBalances.Seed.Data.EnsureBalancesForUsersAsync(db, userIds, year, CancellationToken.None);
    }
}