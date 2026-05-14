using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using QLNP.Api.Middleware;

namespace QLNP.Api.Auth;

public class CurrentUserProvider : ICurrentUserProvider
{
    private readonly HttpContext _httpContext;

    public CurrentUserProvider(IHttpContextAccessor httpContextAccessor)
    {
        _httpContext = httpContextAccessor.HttpContext
            ?? throw new InvalidOperationException("No HttpContext available");
    }

    public CurrentUser GetCurrentUser()
    {
        var user = _httpContext.User;

        return new CurrentUser(
            UserId: long.Parse(user.FindFirst("UserId")?.Value ?? "0"),
            DisplayName: user.FindFirst("DisplayName")?.Value ?? "",
            UnitId: long.Parse(user.FindFirst("UnitId")?.Value ?? "0"),
            PhongBanId: long.Parse(user.FindFirst("PhongBanId")?.Value ?? "0"),
            DeviceId: user.FindFirst("DeviceId")?.Value ?? "",
            Roles: user.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList(),
            UserIdUBTP: int.Parse(user.FindFirst("UserIdUBTP")?.Value ?? "0"),
            PhongBanIdUBTP: int.Parse(user.FindFirst("PhongBanIdUBTP")?.Value ?? "0"),
            DonViIdUBTP: int.Parse(user.FindFirst("DonViIdUBTP")?.Value ?? "-1")
        );
    }
}
