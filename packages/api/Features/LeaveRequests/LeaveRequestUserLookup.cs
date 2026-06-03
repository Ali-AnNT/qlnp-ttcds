using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;
using QLNP.Api.Shared.Domain;

namespace QLNP.Api.Features.LeaveRequests;

/// <summary>
/// Loads user info from UserMaster via UserPortalId for LeaveRequest DTO mapping.
/// Used instead of navigation properties since FKs to USER_MASTER are removed.
/// </summary>
internal static class LeaveRequestUserLookup {
    /// <summary>
    /// Loads user info for a single user by UserPortalId.
    /// Returns (HoTen, DonViId, TenDonVi, PhongBanId) or defaults if not found.
    /// </summary>
    internal static async Task<(string hoTen, long? donViId, string tenDonVi, long? phongBanId)> LoadUserInfoAsync(
        AppDbContext db, long userId, CancellationToken ct) {
        var user = await db.UserMaster
            .Include(u => u.DonVi)
            .FirstOrDefaultAsync(u => u.UserPortalId == userId, ct);

        return (
            user?.HoTen ?? "",
            user?.PhongBanId ?? user?.DonViId,
            user?.DonVi?.TenDonVi ?? "",
            user?.PhongBanId
        );
    }

    /// <summary>
    /// Loads user info for multiple users. Returns dict keyed by UserPortalId.
    /// </summary>
    internal static async Task<Dictionary<long, (string hoTen, long? donViId, string tenDonVi, long? phongBanId)>> LoadUserInfoBatchAsync(
        AppDbContext db, IEnumerable<long> userIds, CancellationToken ct) {
        var ids = userIds.Distinct().ToList();
        if (ids.Count == 0) return new();
        var users = await db.UserMaster
            .Include(u => u.DonVi)
            .Where(u => u.UserPortalId != null && ids.Contains((long)u.UserPortalId))
            .ToListAsync(ct);

        return users.ToDictionary(
            u => (long)u.UserPortalId!,
            u => (u.HoTen ?? "", u.PhongBanId ?? u.DonViId, u.DonVi?.TenDonVi ?? "", u.PhongBanId)
        );
    }
}
