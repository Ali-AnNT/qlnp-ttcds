using QLNP.Api.Auth;
using QLNP.Api.Middleware;

namespace QLNP.Api.Features.Auth.Me;

internal sealed class Data
{
    private readonly ICurrentUserProvider _userProvider;

    public Data(ICurrentUserProvider userProvider) => _userProvider = userProvider;

    public CurrentUser GetCurrentUser() => _userProvider.GetCurrentUser();
}
