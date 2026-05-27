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

    /// <summary>
    /// Migrates legacy 'approved_director' status to 'approved' across all leave requests.
    /// Idempotent — safe to run on every app start.
    /// </summary>
    public static async Task MigrateApprovedDirectorStatusAsync(AppDbContext db)
    {
        var affected = await db.LeaveRequests
            .Where(lr => lr.Status == "approved_director")
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(lr => lr.Status, "approved"));

        if (affected > 0)
        {
            // Also fix audit trail references
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE LeaveRequestAudits SET NewValue = 'approved' WHERE NewValue = 'approved_director'");
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE LeaveRequestAudits SET OldValue = 'approved' WHERE OldValue = 'approved_director'");
        }
    }
}