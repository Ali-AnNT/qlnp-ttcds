using FastEndpoints;

namespace QLNP.Api.Features.Auth.Me;

internal sealed class Endpoint : EndpointWithoutRequest<Response>
{
    private readonly Data _data;

    public Endpoint(Data data) => _data = data;

    public override void Configure()
    {
        Get("/api/auth/me");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        try
        {
            var user = _data.GetCurrentUser();
            await Send.OkAsync(new Response(
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
