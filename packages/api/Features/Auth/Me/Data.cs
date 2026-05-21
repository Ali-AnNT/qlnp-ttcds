using Microsoft.EntityFrameworkCore;
using QLNP.Api.Auth;
using QLNP.Api.Data;
using QLNP.Api.Middleware;

namespace QLNP.Api.Features.Auth.Me;

internal sealed class Data
{
    private readonly AppDbContext _db;
    private readonly ICurrentUserProvider _userProvider;

    public Data(AppDbContext db, ICurrentUserProvider userProvider)
    {
        _db = db;
        _userProvider = userProvider;
    }

    public CurrentUser GetCurrentUser() => _userProvider.GetCurrentUser();

    public async Task<Response?> BuildResponseAsync(long userId, CancellationToken ct)
    {
        var user = await _db.UserMaster.FirstOrDefaultAsync(u => u.UserMasterId == userId, ct);
        if (user is null) return null;

        var currentUser = _userProvider.GetCurrentUser();
        var role = MapRole(currentUser.Roles);

        return new Response(
            UserId: user.UserMasterId,
            UserName: user.UserName,
            FullName: user.HoTen ?? currentUser.DisplayName,
            DonViId: user.DonViId ?? currentUser.UnitId,
            Role: role
        );
    }

    private static readonly string[] RolePriority = ["QLNP.QTHT", "QLNP.GD.PGD", "QLNP.LD.PCM", "QLNP.CB.PCM"];

    private static string MapRole(List<string> roles)
    {
        foreach (var r in RolePriority)
            if (roles.Contains(r))
                return r == "QLNP.QTHT" ? "quantri" : r.Replace("QLNP.", "");
        return "user";
    }
}
