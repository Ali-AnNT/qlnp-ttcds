using FastEndpoints;
using QLNP.Api.Auth;
using QLNP.Api.Middleware;

namespace QLNP.Api.Features.Auth.Me;

public class MeEndpoint : EndpointWithoutRequest<MeResponse>
{
    private readonly ICurrentUserProvider _userProvider;

    public MeEndpoint(ICurrentUserProvider userProvider)
    {
        _userProvider = userProvider;
    }

    public override void Configure()
    {
        Get("/api/auth/me");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var user = _userProvider.GetCurrentUser();
            await Send.OkAsync(new MeResponse(
                user.UserId,
                user.DisplayName,
                user.UnitId,
                user.PhongBanId,
                user.Roles,
                user.UserIdUBTP,
                user.PhongBanIdUBTP,
                user.DonViIdUBTP
            ), ct);
        }
        catch (InvalidOperationException)
        {
            await Send.UnauthorizedAsync(ct);
        }
    }
}

public record MeResponse(
    long Id,
    string DisplayName,
    long UnitId,
    long PhongBanId,
    List<string> Roles,
    int UserIdUBTP,
    int PhongBanIdUBTP,
    int DonViIdUBTP
);
