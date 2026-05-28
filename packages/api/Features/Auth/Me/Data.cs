using Microsoft.EntityFrameworkCore;
using QLNP.Api.Auth;
using QLNP.Api.Data;
using QLNP.Api.Middleware;
using QLNP.Api.Shared.Services;

namespace QLNP.Api.Features.Auth.Me;

internal sealed class Data {
    private readonly AppDbContext _db;
    private readonly ICurrentUserProvider _userProvider;
    private readonly ILeaveBalanceService _balanceService;

    public Data(AppDbContext db, ICurrentUserProvider userProvider, ILeaveBalanceService balanceService) {
        _db = db;
        _userProvider = userProvider;
        _balanceService = balanceService;
    }

    public CurrentUser GetCurrentUser() => _userProvider.GetCurrentUser();

    public async Task<Response?> BuildResponseAsync(long userId, CancellationToken ct) {
        var user = await _db.UserMaster.FirstOrDefaultAsync(u => u.UserMasterId == userId, ct);
        if (user is null) return null;

        var currentUser = _userProvider.GetCurrentUser();
        var role = MapRole(currentUser.Roles);

        // Upsert role and recalculate balance if changed
        await _balanceService.UpsertRoleAndRecalculateAsync(userId, role, ct);

        return new Response(
            UserId: user.UserMasterId,
            UserName: user.UserName,
            FullName: user.HoTen ?? currentUser.DisplayName,
            DonViId: user.DonViId ?? currentUser.UnitId,
            Role: role
        );
    }

    private static string MapRole(List<string> roles) {
        foreach (var r in AppRoles.Priority)
            if (roles.Contains(r))
                return r;
        return "user";
    }
}
