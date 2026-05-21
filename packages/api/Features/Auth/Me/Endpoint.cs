using FastEndpoints;

namespace QLNP.Api.Features.Auth.Me;

internal sealed class Endpoint : EndpointWithoutRequest<Response>
{
    private readonly Data _data;

    public Endpoint(Data data) => _data = data;

    public override void Configure()
    {
        Get("/api/auth/me");
        Tags("Auth");
        Options(x => x.RequireAuthorization());
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var currentUser = _data.GetCurrentUser();
        var response = await _data.BuildResponseAsync(currentUser.UserId, ct);

        if (response is null)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        await Send.OkAsync(response, ct);
    }
}
