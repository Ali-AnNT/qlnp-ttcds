#if DEBUG
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FastEndpoints;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QLNP.Api.Auth;
using QLNP.Api.Data;
using QLNP.Api.Shared.Services;

namespace QLNP.Api.Features.Auth.DevLogin;

internal sealed record Request(string UserName);

internal sealed record Response(string Token, string FullName, string Role);

internal sealed class Endpoint : Endpoint<Request, Response> {
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILeaveBalanceService _balanceService;

    public Endpoint(AppDbContext db, IConfiguration config, ILeaveBalanceService balanceService) {
        _db = db;
        _config = config;
        _balanceService = balanceService;
    }

    public override void Configure() {
        Post("/api/auth/dev/login");
        AllowAnonymous();
        Description(x => x.WithTags("Auth Dev"));
    }

    public override async Task HandleAsync(Request req, CancellationToken ct) {
        // Runtime guard: only when DevMode.Enabled is true
        var devMode = _config.GetSection("DevMode").GetValue<bool>("Enabled");
        if (!devMode) {
            await Send.NotFoundAsync(ct);
            return;
        }

        // Dev role map using centralized constants
        var devRoles = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase) {
            ["quantri"] = AppRoles.Admin,
            ["trinh.vo"] = AppRoles.Director,
            ["nvhau.ttcds"] = AppRoles.Leader,
            ["htquy.ttcds"] = AppRoles.Staff,
        };

        if (!devRoles.TryGetValue(req.UserName, out var role))
            ThrowError("User not found or not in dev allowlist");

        // Lookup user in USER_MASTER for identity info
        var user = await _db.UserMaster
            .FirstOrDefaultAsync(u => u.UserName == req.UserName, ct);

        if (user is null)
            ThrowError("User not found in USER_MASTER");

        // Upsert role and recalculate balance if changed
        await _balanceService.UpsertRoleAndRecalculateAsync(user.UserMasterId, role, ct);

        // Build JWT claims matching what external SSO provides
        var jwtConfig = _config.GetSection("Jwt");
        var claims = new List<Claim>
        {
            new("UserId", user.UserMasterId.ToString()),
            new("DisplayName", user.HoTen ?? user.UserName ?? ""),
            new("UnitId", user.DonViId?.ToString() ?? "0"),
            new("PhongBanId", user.PhongBanId?.ToString() ?? "0"),
            new("DeviceId", "dev-login"),
            new("UserIdUBTP", "0"),
            new("PhongBanIdUBTP", "0"),
            new("DonViIdUBTP", "-1"),
        };
        // Role claims for both FastEndpoints auth (Roles claim type) and CurrentUserProvider (ClaimTypes.Role)
        claims.Add(new("Roles", role));
        claims.Add(new(ClaimTypes.Role, role));

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtConfig["SigningKey"]!));
        var token = new JwtSecurityToken(
            issuer: jwtConfig["Issuer"],
            audience: jwtConfig["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        var tokenStr = new JwtSecurityTokenHandler().WriteToken(token);

        await Send.OkAsync(new Response(
            Token: tokenStr,
            FullName: user.HoTen ?? user.UserName ?? "",
            Role: role
        ), ct);
    }
}
#endif