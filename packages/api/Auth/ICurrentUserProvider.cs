using QLNP.Api.Middleware;

namespace QLNP.Api.Auth;

public interface ICurrentUserProvider
{
    CurrentUser GetCurrentUser();
}
