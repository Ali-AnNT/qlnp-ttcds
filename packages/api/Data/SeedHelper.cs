using Microsoft.EntityFrameworkCore;
using QLNP.Api.Shared.Domain;

namespace QLNP.Api.Data;

/// <summary>
/// One-time and yearly startup seed for LeaveBalances.
/// Creates a single balance row per (UserId, Year) for all active users.
/// Idempotent — safe to run on every app start.
/// </summary>
public static class SeedHelper {
    public static async Task SeedLeaveBalancesAsync(AppDbContext db) {
        var year = DateTime.UtcNow.Year;

        var userIds = await db.UserMaster
            .Where(u => u.Used == true && u.UserPortalId != null)
            .Select(u => (long)u.UserPortalId!)
            .ToListAsync();

        if (userIds.Count == 0) return;

        await LeaveBalanceSeeding.EnsureBalancesForUsersAsync(db, userIds, year, CancellationToken.None);
    }

    /// <summary>
    /// Migrates legacy statuses to the N-level approval model.
    /// - approved_director → approved (with ApprovedLevel from config)
    /// - approved_leader → pending + ApprovedLevel = 1 (still awaiting next level)
    /// Idempotent — safe to run on every app start.
    /// </summary>
    public static async Task MigrateLegacyStatusesAsync(AppDbContext db) {
        // 1. Migrate approved_director → approved (legacy from before ApprovedLevel existed)
        var directorAffected = await db.LeaveRequests
            .Where(lr => lr.Status == "approved_director")
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(lr => lr.Status, "approved"));

        if (directorAffected > 0) {
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE LeaveRequestAudits SET NewValue = 'approved' WHERE NewValue = 'approved_director'");
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE LeaveRequestAudits SET OldValue = 'approved' WHERE OldValue = 'approved_director'");
        }

        // 2. Migrate approved_leader → pending + ApprovedLevel = 1
        //    These are requests that got level-1 approval but still need level-2+
        var leaderAffected = await db.LeaveRequests
            .Where(lr => lr.Status == "approved_leader")
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(lr => lr.Status, "pending")
                .SetProperty(lr => lr.ApprovedLevel, 1));

        if (leaderAffected > 0) {
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE LeaveRequestAudits SET NewValue = 'pending' WHERE NewValue = 'approved_leader'");
            await db.Database.ExecuteSqlRawAsync(
                "UPDATE LeaveRequestAudits SET OldValue = 'pending' WHERE OldValue = 'approved_leader'");
        }

        // 3. For already-approved requests, set ApprovedLevel to the max config level for their LeaveType
        var approvedRequests = await db.LeaveRequests
            .Where(lr => lr.Status == "approved" && lr.ApprovedLevel == 0)
            .ToListAsync();

        if (approvedRequests.Count > 0) {
            var leaveTypeIds = approvedRequests.Select(lr => lr.LeaveTypeId).Distinct().ToList();
            var maxLevelsByType = await db.LeaveConfigs
                .Where(c => leaveTypeIds.Contains(c.LeaveTypeId))
                .GroupBy(c => c.LeaveTypeId)
                .Select(g => new { LeaveTypeId = g.Key, MaxLevel = g.Max(c => c.ApprovalLevel) })
                .ToDictionaryAsync(x => x.LeaveTypeId, x => x.MaxLevel);

            foreach (var req in approvedRequests) {
                if (maxLevelsByType.TryGetValue(req.LeaveTypeId, out var maxLevel))
                    req.ApprovedLevel = maxLevel;
                else
                    req.ApprovedLevel = 1; // Fallback if no config exists
            }

            await db.SaveChangesAsync();
        }

        // 4. For rejected/cancelled requests with ApprovedLevel 0, check if they had approval progress
        //    These keep ApprovedLevel = 0 (no approval progress before rejection/cancellation)
    }
}
