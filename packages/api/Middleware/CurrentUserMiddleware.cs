using Microsoft.EntityFrameworkCore;
using QLNP.Api.Data;

namespace QLNP.Api.Middleware;

public class CurrentUserMiddleware : IMiddleware
{
    private readonly IConfiguration _config;

    public CurrentUserMiddleware(IConfiguration config)
    {
        _config = config;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var headers = _config.GetSection("GatewayHeaders");
        var userIdHeader = headers["UserId"] ?? "X-User-Id";
        var userNameHeader = headers["UserName"] ?? "X-User-Name";
        var fullNameHeader = headers["UserFullName"] ?? "X-User-FullName";

        if (long.TryParse(context.Request.Headers[userIdHeader].FirstOrDefault(), out var userId))
        {
            var userName = context.Request.Headers[userNameHeader].FirstOrDefault() ?? "";
            var fullName = context.Request.Headers[fullNameHeader].FirstOrDefault() ?? "";

            var db = context.RequestServices.GetRequiredService<AppDbContext>();
            var user = await db.UserMaster.FirstOrDefaultAsync(u => u.UserMasterId == userId);
            var role = await db.UserRoles.FirstOrDefaultAsync(r => r.UserId == userId);

            var currentUser = new CurrentUser(
                userId,
                userName,
                fullName,
                user?.DonViId,
                role?.Role ?? "user"
            );

            context.Items["CurrentUser"] = currentUser;
        }
        else if (_config.GetValue<bool>("DevMode:Enabled"))
        {
            // Dev mode fallback
            context.Items["CurrentUser"] = new CurrentUser(1, "admin", "Administrator", null, "quantri");
        }

        await next(context);
    }
}
