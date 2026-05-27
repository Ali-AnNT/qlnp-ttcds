using QLNP.Api.Auth;
using QLNP.Api.Entities;
using QLNP.Api.Middleware;

namespace QLNP.Api.Features.LeaveRequests;

/// <summary>
/// Shared helper for config-driven N-level approval logic.
/// Each LeaveType can have N approval levels, with multiple roles per level (OR logic).
/// </summary>
public static class ApprovalHelper
{
    private const string RolePrefix = "QLNP.";

    /// <summary>
    /// Normalizes a role string to full form (with QLNP. prefix).
    /// Config may store short form (LD.PCM) but user roles use full form (QLNP.LD.PCM).
    /// </summary>
    private static string NormalizeRole(string role) =>
        role.StartsWith(RolePrefix) ? role : $"{RolePrefix}{role}";

    /// <summary>
    /// Groups LeaveConfigs by ApprovalLevel, returning a sorted dictionary
    /// where key = level (1-based) and value = list of normalized approver roles.
    /// </summary>
    public static Dictionary<int, List<string>> GetApprovalFlow(List<LeaveConfig> configs)
    {
        return configs
            .GroupBy(c => c.ApprovalLevel)
            .OrderBy(g => g.Key)
            .ToDictionary(g => g.Key, g => g.Select(c => NormalizeRole(c.ApproverRole)).ToList());
    }

    /// <summary>
    /// Returns the maximum approval level from the flow.
    /// Returns 0 if the flow is empty.
    /// </summary>
    public static int GetMaxLevel(Dictionary<int, List<string>> flow)
    {
        return flow.Count > 0 ? flow.Keys.Max() : 0;
    }

    /// <summary>
    /// Checks if the current user can approve/reject at the target level.
    /// Returns (canApprove, errorMessage).
    /// </summary>
    public static (bool canApprove, string? errorMessage) CanApproveAtLevel(
        CurrentUser user, LeaveRequest request, Dictionary<int, List<string>> flow, int targetLevel)
    {
        if (!flow.TryGetValue(targetLevel, out var roles))
            return (false, "Không tìm thấy cấu hình phê duyệt cho cấp này");

        // Check if user has any role at this level (OR logic)
        var userRoleAtLevel = roles.FirstOrDefault(r => user.Roles.Contains(r));
        if (userRoleAtLevel is null)
            return (false, "Bạn không có quyền phê duyệt ở cấp này");

        // Scope check: LD.PCM can only approve requests from same department, not own requests
        if (userRoleAtLevel == "QLNP.LD.PCM")
        {
            if (request.UserId == user.UserId)
                return (false, "Không thể phê duyệt đơn của chính mình");

            if (request.User?.PhongBanId == null || request.User.PhongBanId != user.PhongBanId)
                return (false, "Bạn chỉ có thể phê duyệt đơn trong phòng ban của mình");
        }

        return (true, null);
    }

    /// <summary>
    /// Gets the normalized roles that can approve at the next level for a request.
    /// Returns null if no config exists (request cannot be approved).
    /// </summary>
    public static List<string>? GetNextLevelRoles(Dictionary<int, List<string>> flow, int currentApprovedLevel)
    {
        var nextLevel = currentApprovedLevel + 1;
        return flow.TryGetValue(nextLevel, out var roles) ? roles : null;
    }
}